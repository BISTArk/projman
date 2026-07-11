// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use std::thread;
use tauri::{Emitter, Manager};

pub struct ProcessState {
    pub processes: Arc<Mutex<HashMap<String, u32>>>,
}

#[derive(Clone, serde::Serialize)]
struct LogPayload {
    project_id: String,
    script: String,
    line: String,
    is_stderr: bool,
}

#[derive(Clone, serde::Serialize)]
struct ExitPayload {
    project_id: String,
    script: String,
    exit_code: i32,
}

fn kill_process_tree(pid: u32) {
    let _ = std::process::Command::new("taskkill")
        .args(&["/F", "/T", "/PID", &pid.to_string()])
        .status();
}

#[tauri::command]
fn select_directory() -> Option<String> {
    rfd::FileDialog::new()
        .pick_folder()
        .map(|path| path.to_string_lossy().to_string())
}

#[tauri::command]
fn check_directory_exists(path: String) -> bool {
    std::path::Path::new(&path).is_dir()
}

#[tauri::command]
fn file_exists(path: String) -> bool {
    std::path::Path::new(&path).exists()
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
fn write_env_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| format!("Failed to write env file: {}", e))
}

#[tauri::command]
fn run_git_command(path: String, args: Vec<String>) -> Result<String, String> {
    let output = Command::new("git")
        .args(&args)
        .current_dir(&path)
        .output()
        .map_err(|e| format!("Failed to execute git command: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(stderr)
    }
}

#[tauri::command]
fn start_project_script(
    state: tauri::State<'_, ProcessState>,
    window: tauri::Window,
    project_id: String,
    script: String,
    path: String,
) -> Result<(), String> {
    let key = format!("{}:{}", project_id, script);

    // Check if it's already running
    {
        let map = state.processes.lock().unwrap();
        if map.contains_key(&key) {
            return Err("Script is already running".to_string());
        }
    }

    // Detect package manager
    let package_manager = if std::path::Path::new(&path).join("pnpm-lock.yaml").exists() {
        "pnpm"
    } else if std::path::Path::new(&path).join("yarn.lock").exists() {
        "yarn"
    } else {
        "npm"
    };

    // Spawn the command on Windows using cmd
    let mut child = Command::new("cmd")
        .args(&["/C", &format!("{} run {}", package_manager, script)])
        .current_dir(&path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn process: {}", e))?;

    let pid = child.id();
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

    // Insert to map
    {
        let mut map = state.processes.lock().unwrap();
        map.insert(key.clone(), pid);
    }

    // Spawn monitor threads
    let processes_map = state.processes.clone();
    let window_clone = window.clone();
    let project_id_clone = project_id.clone();
    let script_clone = script.clone();
    let key_clone = key.clone();

    thread::spawn(move || {
        let w1 = window_clone.clone();
        let p1 = project_id_clone.clone();
        let s1 = script_clone.clone();
        let t_stdout = thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line_str) = line {
                    let _ = w1.emit("script-log", LogPayload {
                        project_id: p1.clone(),
                        script: s1.clone(),
                        line: line_str,
                        is_stderr: false,
                    });
                }
            }
        });

        let w2 = window_clone.clone();
        let p2 = project_id_clone.clone();
        let s2 = script_clone.clone();
        let t_stderr = thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line_str) = line {
                    let _ = w2.emit("script-log", LogPayload {
                        project_id: p2.clone(),
                        script: s2.clone(),
                        line: line_str,
                        is_stderr: true,
                    });
                }
            }
        });

        // Wait for process to exit
        let status = child.wait();
        let _ = t_stdout.join();
        let _ = t_stderr.join();

        // Clean up from map
        {
            let mut map = processes_map.lock().unwrap();
            if let Some(&current_pid) = map.get(&key_clone) {
                if current_pid == pid {
                    map.remove(&key_clone);
                }
            }
        }

        // Emit exit event
        let exit_code = status.ok().and_then(|s| s.code()).unwrap_or(-1);
        let _ = window_clone.emit("script-exit", ExitPayload {
            project_id: project_id_clone,
            script: script_clone,
            exit_code,
        });
    });

    Ok(())
}

#[tauri::command]
fn stop_project_script(
    state: tauri::State<'_, ProcessState>,
    project_id: String,
    script: String,
) -> Result<(), String> {
    let key = format!("{}:{}", project_id, script);
    let mut map = state.processes.lock().unwrap();
    if let Some(pid) = map.remove(&key) {
        kill_process_tree(pid);
        Ok(())
    } else {
        Err("Script is not running".to_string())
    }
}

#[tauri::command]
fn stop_all_project_scripts(state: tauri::State<'_, ProcessState>) -> Result<(), String> {
    let mut map = state.processes.lock().unwrap();
    for &pid in map.values() {
        kill_process_tree(pid);
    }
    map.clear();
    Ok(())
}

#[tauri::command]
fn get_running_scripts(state: tauri::State<'_, ProcessState>) -> Result<Vec<String>, String> {
    let map = state.processes.lock().unwrap();
    Ok(map.keys().cloned().collect())
}
#[derive(Clone, serde::Serialize)]
struct TerminalLogPayload {
    project_id: String,
    line: String,
    is_stderr: bool,
}

#[derive(Clone, serde::Serialize)]
struct TerminalExitPayload {
    project_id: String,
    exit_code: i32,
}

#[tauri::command]
fn run_terminal_command(
    state: tauri::State<'_, ProcessState>,
    window: tauri::Window,
    project_id: String,
    command: String,
    cwd: String,
) -> Result<(), String> {
    let key = format!("{}:terminal", project_id);

    // Check if a command is already running
    {
        let map = state.processes.lock().unwrap();
        if map.contains_key(&key) {
            return Err("A terminal command is already running".to_string());
        }
    }

    // Spawn command shell (cmd /C on Windows)
    let mut child = Command::new("cmd")
        .args(&["/C", &command])
        .current_dir(&cwd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run command: {}", e))?;

    let pid = child.id();
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

    // Insert PID to track it
    {
        let mut map = state.processes.lock().unwrap();
        map.insert(key.clone(), pid);
    }

    let processes_map = state.processes.clone();
    let window_clone = window.clone();
    let project_id_clone = project_id.clone();
    let key_clone = key.clone();

    thread::spawn(move || {
        let w1 = window_clone.clone();
        let p1 = project_id_clone.clone();
        let t_stdout = thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line_str) = line {
                    let _ = w1.emit("terminal-log", TerminalLogPayload {
                        project_id: p1.clone(),
                        line: line_str,
                        is_stderr: false,
                    });
                }
            }
        });

        let w2 = window_clone.clone();
        let p2 = project_id_clone.clone();
        let t_stderr = thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line_str) = line {
                    let _ = w2.emit("terminal-log", TerminalLogPayload {
                        project_id: p2.clone(),
                        line: line_str,
                        is_stderr: true,
                    });
                }
            }
        });

        let status = child.wait();
        let _ = t_stdout.join();
        let _ = t_stderr.join();

        // Clean up from map
        {
            let mut map = processes_map.lock().unwrap();
            if let Some(&current_pid) = map.get(&key_clone) {
                if current_pid == pid {
                    map.remove(&key_clone);
                }
            }
        }

        // Emit exit event
        let exit_code = status.ok().and_then(|s| s.code()).unwrap_or(-1);
        let _ = window_clone.emit("terminal-exit", TerminalExitPayload {
            project_id: project_id_clone,
            exit_code,
        });
    });

    Ok(())
}

#[tauri::command]
fn stop_terminal_command(
    state: tauri::State<'_, ProcessState>,
    project_id: String,
) -> Result<(), String> {
    let key = format!("{}:terminal", project_id);
    let mut map = state.processes.lock().unwrap();
    if let Some(pid) = map.remove(&key) {
        kill_process_tree(pid);
        Ok(())
    } else {
        Err("No terminal command is running".to_string())
    }
}

#[tauri::command]
async fn check_for_update(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_updater::UpdaterExt;
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    let version = update.version.clone();
                    // Install the update (downloads and relaunches)
                    update.download_and_install(|_, _| {}, || {}).await
                        .map_err(|e| format!("Failed to install update: {}", e))?;
                    Ok(format!("Updated to v{}", version))
                }
                Ok(None) => Ok("already_latest".to_string()),
                Err(e) => Err(format!("Update check failed: {}", e)),
            }
        }
        Err(e) => Err(format!("Updater unavailable: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(ProcessState {
            processes: Arc::new(Mutex::new(HashMap::new())),
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let state = window.state::<ProcessState>();
                let mut map = state.processes.lock().unwrap();
                for &pid in map.values() {
                    kill_process_tree(pid);
                }
                map.clear();
            }
        })
        .invoke_handler(tauri::generate_handler![
            check_directory_exists,
            file_exists,
            read_file,
            write_env_file,
            run_git_command,
            start_project_script,
            stop_project_script,
            stop_all_project_scripts,
            get_running_scripts,
            select_directory,
            run_terminal_command,
            stop_terminal_command,
            check_for_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
