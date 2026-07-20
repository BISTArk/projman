// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::ChildStdin;
use std::thread;
use tauri::{Emitter, Manager};

pub struct ProcessState {
    processes: Arc<Mutex<HashMap<String, u32>>>,
    inputs: Arc<Mutex<HashMap<String, ChildStdin>>>,
    script_logs: Arc<Mutex<HashMap<String, Vec<LogPayload>>>>,
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

fn append_script_log(
    logs: &Arc<Mutex<HashMap<String, Vec<LogPayload>>>>,
    key: &str,
    payload: LogPayload,
) {
    let mut all_logs = logs.lock().unwrap();
    let terminal_logs = all_logs.entry(key.to_string()).or_default();
    terminal_logs.push(payload);
    if terminal_logs.len() > 2_000 {
        terminal_logs.drain(..terminal_logs.len() - 2_000);
    }
}

fn kill_process_tree(pid: u32) -> Result<(), String> {
    let output = std::process::Command::new("taskkill")
        .args(&["/F", "/T", "/PID", &pid.to_string()])
        .output()
        .map_err(|e| format!("Failed to run taskkill: {}", e))?;
    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[tauri::command]
async fn select_directory() -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        rfd::FileDialog::new()
            .pick_folder()
            .map(|path| path.to_string_lossy().to_string())
    })
    .await
    .map_err(|e| format!("Failed to open folder picker: {}", e))
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
async fn run_git_command(path: String, args: Vec<String>) -> Result<String, String> {
    // Git may wait on the network, hooks, or a large worktree. Keeping it on a
    // blocking worker lets the webview continue painting progress feedback.
    tauri::async_runtime::spawn_blocking(move || {
        let output = Command::new("git")
            .args(&args)
            .current_dir(&path)
            .output()
            .map_err(|e| format!("Failed to execute git command: {}", e))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            Err(if stderr.is_empty() {
                format!("Git exited with status {}", output.status)
            } else {
                stderr
            })
        }
    })
    .await
    .map_err(|e| format!("Git worker failed: {}", e))?
}

#[tauri::command]
async fn open_in_editor(editor: String, path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        if !std::path::Path::new(&path).is_dir() {
            return Err(format!("Project directory does not exist: {}", path));
        }

        let (display_name, command_name, relative_install_path) = match editor.as_str() {
            "vscode" => ("Visual Studio Code", "code", "Programs/Microsoft VS Code/Code.exe"),
            "cursor" => ("Cursor", "cursor", "Programs/cursor/Cursor.exe"),
            _ => return Err("Unsupported editor requested".to_string()),
        };

        let mut candidates = Vec::<PathBuf>::new();
        if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") {
            candidates.push(PathBuf::from(local_app_data).join(relative_install_path));
        }
        if let Some(program_files) = std::env::var_os("ProgramFiles") {
            let executable = if editor == "vscode" {
                "Microsoft VS Code/Code.exe"
            } else {
                "Cursor/Cursor.exe"
            };
            candidates.push(PathBuf::from(program_files).join(executable));
        }

        for executable in candidates.iter().filter(|candidate| candidate.exists()) {
            if Command::new(executable).arg(&path).spawn().is_ok() {
                return Ok(());
            }
        }

        Command::new(command_name)
            .arg(&path)
            .spawn()
            .map(|_| ())
            .map_err(|_| {
                format!(
                    "{} is not installed or its command is not available in PATH.",
                    display_name
                )
            })
    })
    .await
    .map_err(|e| format!("Editor launcher failed: {}", e))?
}

fn start_tracked_process(
    state: &ProcessState,
    window: tauri::Window,
    project_id: String,
    script: String,
    path: String,
    command: String,
) -> Result<(), String> {
    let key = format!("{}:{}", project_id, script);

    // Check if it's already running
    {
        let map = state.processes.lock().unwrap();
        if map.contains_key(&key) {
            return Err("Script is already running".to_string());
        }
    }

    // Spawn the command on Windows using cmd
    let mut child = Command::new("cmd")
        .args(["/C", &command])
        .current_dir(&path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn process: {}", e))?;

    let pid = child.id();
    let stdin = child.stdin.take().ok_or("Failed to open stdin")?;
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

    // Insert to map
    {
        let mut map = state.processes.lock().unwrap();
        map.insert(key.clone(), pid);
    }
    state.inputs.lock().unwrap().insert(key.clone(), stdin);

    let command_payload = LogPayload {
        project_id: project_id.clone(),
        script: script.clone(),
        line: format!("> {}", command),
        is_stderr: false,
    };
    append_script_log(&state.script_logs, &key, command_payload.clone());
    let _ = window.emit("script-log", command_payload);

    // Spawn monitor threads
    let processes_map = state.processes.clone();
    let inputs_map = state.inputs.clone();
    let logs_map = state.script_logs.clone();
    let window_clone = window.clone();
    let project_id_clone = project_id.clone();
    let script_clone = script.clone();
    let key_clone = key.clone();

    thread::spawn(move || {
        let w1 = window_clone.clone();
        let p1 = project_id_clone.clone();
        let s1 = script_clone.clone();
        let k1 = key_clone.clone();
        let logs1 = logs_map.clone();
        let t_stdout = thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line_str) = line {
                    let payload = LogPayload {
                        project_id: p1.clone(),
                        script: s1.clone(),
                        line: line_str,
                        is_stderr: false,
                    };
                    append_script_log(&logs1, &k1, payload.clone());
                    let _ = w1.emit("script-log", payload);
                }
            }
        });

        let w2 = window_clone.clone();
        let p2 = project_id_clone.clone();
        let s2 = script_clone.clone();
        let k2 = key_clone.clone();
        let logs2 = logs_map.clone();
        let t_stderr = thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line_str) = line {
                    let payload = LogPayload {
                        project_id: p2.clone(),
                        script: s2.clone(),
                        line: line_str,
                        is_stderr: true,
                    };
                    append_script_log(&logs2, &k2, payload.clone());
                    let _ = w2.emit("script-log", payload);
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
        inputs_map.lock().unwrap().remove(&key_clone);

        // Emit exit event
        let exit_code = status.ok().and_then(|s| s.code()).unwrap_or(-1);
        append_script_log(
            &logs_map,
            &key_clone,
            LogPayload {
                project_id: project_id_clone.clone(),
                script: script_clone.clone(),
                line: format!("\n[Process terminated with code {}]", exit_code),
                is_stderr: exit_code != 0,
            },
        );
        let _ = window_clone.emit("script-exit", ExitPayload {
            project_id: project_id_clone,
            script: script_clone,
            exit_code,
        });
    });

    Ok(())
}

#[tauri::command]
fn start_project_script(
    state: tauri::State<'_, ProcessState>,
    window: tauri::Window,
    project_id: String,
    script: String,
    path: String,
) -> Result<(), String> {
    let package_manager = if std::path::Path::new(&path).join("pnpm-lock.yaml").exists() {
        "pnpm"
    } else if std::path::Path::new(&path).join("yarn.lock").exists() {
        "yarn"
    } else {
        "npm"
    };
    let command = format!("{} run {}", package_manager, script);
    start_tracked_process(state.inner(), window, project_id, script, path, command)
}

#[tauri::command]
fn start_project_command(
    state: tauri::State<'_, ProcessState>,
    window: tauri::Window,
    project_id: String,
    terminal_id: String,
    path: String,
    command: String,
) -> Result<(), String> {
    if command.trim().is_empty() {
        return Err("Command cannot be empty".to_string());
    }
    start_tracked_process(state.inner(), window, project_id, terminal_id, path, command)
}

#[tauri::command]
fn send_project_script_input(
    state: tauri::State<'_, ProcessState>,
    window: tauri::Window,
    project_id: String,
    script: String,
    input: String,
) -> Result<(), String> {
    let key = format!("{}:{}", project_id, script);
    let payload = LogPayload {
        project_id: project_id.clone(),
        script: script.clone(),
        line: format!("> {}", input),
        is_stderr: false,
    };
    let mut inputs = state.inputs.lock().unwrap();
    let stdin = inputs.get_mut(&key).ok_or("Terminal is not accepting input")?;
    stdin
        .write_all(format!("{}\n", input).as_bytes())
        .and_then(|_| stdin.flush())
        .map_err(|e| format!("Failed to send terminal input: {}", e))?;
    append_script_log(&state.script_logs, &key, payload.clone());
    let _ = window.emit("script-log", payload);
    Ok(())
}

#[tauri::command]
fn get_script_logs(state: tauri::State<'_, ProcessState>) -> Vec<LogPayload> {
    state
        .script_logs
        .lock()
        .unwrap()
        .values()
        .flat_map(|entries| entries.clone())
        .collect()
}

#[tauri::command]
fn clear_project_script_logs(
    state: tauri::State<'_, ProcessState>,
    project_id: String,
    script: String,
) {
    state
        .script_logs
        .lock()
        .unwrap()
        .remove(&format!("{}:{}", project_id, script));
}

#[tauri::command]
fn stop_project_script(
    state: tauri::State<'_, ProcessState>,
    project_id: String,
    script: String,
) -> Result<(), String> {
    let key = format!("{}:{}", project_id, script);
    let pid = state.processes.lock().unwrap().get(&key).copied();
    if let Some(pid) = pid {
        kill_process_tree(pid)?;
        state.processes.lock().unwrap().remove(&key);
        state.inputs.lock().unwrap().remove(&key);
        Ok(())
    } else {
        Err("Script is not running".to_string())
    }
}

#[tauri::command]
fn stop_all_project_scripts(state: tauri::State<'_, ProcessState>) -> Result<(), String> {
    let mut map = state.processes.lock().unwrap();
    for &pid in map.values() {
        let _ = kill_process_tree(pid);
    }
    map.clear();
    state.inputs.lock().unwrap().clear();
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
        let _ = kill_process_tree(pid);
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
            inputs: Arc::new(Mutex::new(HashMap::new())),
            script_logs: Arc::new(Mutex::new(HashMap::new())),
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let state = window.state::<ProcessState>();
                let mut map = state.processes.lock().unwrap();
                for &pid in map.values() {
                    let _ = kill_process_tree(pid);
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
            open_in_editor,
            start_project_script,
            start_project_command,
            send_project_script_input,
            get_script_logs,
            clear_project_script_logs,
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
