import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Layers,
  Folder,
  Plus,
  Trash2,
  Play,
  Square,
  RefreshCw,
  GitBranch,
  ChevronRight,
  Activity,
  AlertCircle,
  Terminal as TerminalIcon,

  Power,
  Edit2,
  Check,
  X,
  Loader2,
  Info,
  Sun,
  Moon
} from "lucide-react";
import { Terminal } from "./components/Terminal";
import { EnvEditor } from "./components/EnvEditor";
import { GitPanel } from "./components/GitPanel";
import { ScriptGrid } from "./components/ScriptGrid";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { InteractiveTerminal } from "./components/InteractiveTerminal";
// Config structures
const getFrameworkIcon = (framework?: "react" | "next" | "vue" | "svelte" | "express" | "tauri" | "node" | "generic") => {
  switch (framework) {
    case "next":
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <title>Next.js Project</title>
          <circle cx="12" cy="12" r="10" fill="black" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          <path d="M16 16L9.5 8H8V16H9.5V11L14.5 16H16ZM14.5 8H13V12.5L14.5 14.5V8Z" fill="white"/>
        </svg>
      );
    case "react":
      return (
        <svg className="w-4 h-4 shrink-0 text-cyan-400 animate-[spin_12s_linear_infinite]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <title>React Project</title>
          <ellipse rx="8" ry="3.2" transform="translate(10, 10) rotate(0)"/>
          <ellipse rx="8" ry="3.2" transform="translate(10, 10) rotate(60)"/>
          <ellipse rx="8" ry="3.2" transform="translate(10, 10) rotate(120)"/>
          <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
        </svg>
      );
    case "vue":
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <title>Vue Project</title>
          <path d="M2 3L12 21L22 3H17.5L12 13L6.5 3H2Z" fill="#41B883"/>
          <path d="M6.5 3L12 13L17.5 3H13L12 5L11 3H6.5Z" fill="#35495E"/>
        </svg>
      );
    case "svelte":
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <title>Svelte Project</title>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 7.5c0 1.93-1.57 3.5-3.5 3.5H9.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5H14c1.1 0 2 .9 2 2s-.9 2-2 2H9.5C7.57 16.5 6 14.93 6 13c0-1.93 1.57-3.5 3.5-3.5h3c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5H10c-1.1 0-2-.9-2-2s.9-2 2-2h4.5c1.93 0 3.5 1.57 3.5 3.5z" fill="#FF3E00"/>
        </svg>
      );
    case "express":
      return (
        <svg className="w-4 h-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <title>Express Server</title>
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
          <line x1="20" y1="6" x2="20.01" y2="6" />
          <line x1="20" y1="18" x2="20.01" y2="18" />
        </svg>
      );
    case "tauri":
      return (
        <svg className="w-4 h-4 shrink-0 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <title>Tauri Project</title>
          <circle cx="12" cy="12" r="7" />
          <path d="M5 8c0-3 3-5 7-5s7 2 7 5" />
        </svg>
      );
    case "node":
      return (
        <svg className="w-4 h-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <title>Node.js Project</title>
          <path d="M12 2L2 7v10l10 5 10-5V7z" />
          <polyline points="12 22 12 12 22 7" />
          <polyline points="12 12 2 7" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <title>Generic Project</title>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
  }
};

const VSCodeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#23A8F2" d="M17.7 2.2 8.2 11 3.1 7.1 1 8.4v7.2l2.1 1.3 5.1-3.9 9.5 8.8 5.3-2.6V4.8l-5.3-2.6Zm0 5.2v9.2L11.6 12l6.1-4.6Z" />
  </svg>
);

const CursorIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#fff" />
    <path fill="#111827" d="M7 5.8 18.2 12 13 13.4l-2.2 4.8L7 5.8Z" />
  </svg>
);
// Config structures
interface Project {
  id: string;
  name: string;
  path: string;
  template: string;
  subDir?: string;
}

interface Workspace {
  id: string;
  name: string;
  projectIds: string[];
}

interface ScriptLog {
  line: string;
  isStderr: boolean;
}

interface LogEventPayload {
  project_id: string;
  script: string;
  line: string;
  is_stderr: boolean;
}

interface ExitEventPayload {
  project_id: string;
  script: string;
  exit_code: number;
}

const isTauriRuntime = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("projman_theme");
    const initialTheme = saved === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = initialTheme;
    return initialTheme;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("projman_theme", theme);
  }, [theme]);

  // Persistence states
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem("orbit_workspaces");
    return saved ? JSON.parse(saved) : [{ id: "default", name: "My First Workspace", projectIds: [] }];
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    const saved = localStorage.getItem("orbit_active_workspace_id");
    if (saved) return saved;
    const savedWS = localStorage.getItem("orbit_workspaces");
    if (savedWS) {
      const parsed = JSON.parse(savedWS);
      if (parsed.length > 0) return parsed[0].id;
    }
    return "default";
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("orbit_projects");
    return saved ? JSON.parse(saved) : [];
  });

  // Window control states
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isTauriRuntime) return;
    const appWindow = getCurrentWebviewWindow();
    
    const updateMaximized = async () => {
      setIsMaximized(await appWindow.isMaximized());
    };
    
    updateMaximized();
    
    // Listen to resize events to sync isMaximized state
    let unlisten: (() => void) | null = null;
    appWindow.onResized(() => {
      updateMaximized();
    }).then((fn) => {
      unlisten = fn;
    });
    
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleMinimize = () => {
    if (isTauriRuntime) getCurrentWebviewWindow().minimize();
  };

  const handleMaximize = () => {
    if (isTauriRuntime) getCurrentWebviewWindow().toggleMaximize();
  };

  const handleClose = () => {
    if (isTauriRuntime) getCurrentWebviewWindow().close();
  };

  // Navigation states
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "env" | "git" | "terminal">("overview");
  const [activeScript, setActiveScript] = useState<string | null>(null);
  const [workspaceView, setWorkspaceView] = useState<"dashboard" | "terminals">("dashboard");
  const [selectedScripts, setSelectedScripts] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("orbit_selected_scripts");
    return saved ? JSON.parse(saved) : {};
  });

  // Script tracking states
  const [scriptStatuses, setScriptStatuses] = useState<Record<string, Record<string, "idle" | "running" | "stopping">>>({});
  const [logs, setLogs] = useState<Record<string, Record<string, ScriptLog[]>>>({});
  const [terminalInputs, setTerminalInputs] = useState<Record<string, string>>({});
  const pendingScriptLogs = useRef<LogEventPayload[]>([]);
  const logFlushFrame = useRef<number | null>(null);

  // Git state for projects (branch name, uncommitted changes count)
  const [projectGitInfo, setProjectGitInfo] = useState<Record<string, { branch: string; changes: number }>>({});

  // Modals / Adding states
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectPath, setNewProjectPath] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectSubDir, setNewProjectSubDir] = useState("");
  const [newProjectTemplate, setNewProjectTemplate] = useState("auto");
  const [projectModalError, setProjectModalError] = useState<string | null>(null);

  // Project editing states
  const [editingProjectNameId, setEditingProjectNameId] = useState<string | null>(null);
  const [editingProjectNameValue, setEditingProjectNameValue] = useState("");
  const [editingSubDirId, setEditingSubDirId] = useState<string | null>(null);
  const [editingSubDirValue, setEditingSubDirValue] = useState("");

  // Workspace editing states
  const [editingWorkspaceNameId, setEditingWorkspaceNameId] = useState<string | null>(null);
  const [editingWorkspaceNameValue, setEditingWorkspaceNameValue] = useState("");
  const [projectFrameworks, setProjectFrameworks] = useState<Record<string, "react" | "next" | "vue" | "svelte" | "express" | "tauri" | "node" | "generic">>({});
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Sync state overlay
  const [syncStatus, setSyncStatus] = useState<{
    isOpen: boolean;
    projectName: string;
    stage: "pulling" | "pushing" | "idle";
    progress: string[];
    error: string | null;
    completed: number;
    total: number;
  }>({ isOpen: false, projectName: "", stage: "idle", progress: [], error: null, completed: 0, total: 0 });
  const [projectScan, setProjectScan] = useState({ isLoading: false, completed: 0, total: 0 });
  const scanGeneration = useRef(0);
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [openingEditor, setOpeningEditor] = useState<string | null>(null);
  const [notice, setNotice] = useState<null | {
    tone: "info" | "success" | "error";
    title: string;
    message: string;
  }>(null);

  // Save config on changes
  useEffect(() => {
    if (workspaces.length > 0) {
      localStorage.setItem("orbit_workspaces", JSON.stringify(workspaces));
    }
  }, [workspaces]);

  const detectProjectFramework = async (proj: Project): Promise<"react" | "next" | "vue" | "svelte" | "express" | "tauri" | "node" | "generic"> => {
    const rootPath = proj.subDir ? `${proj.path}/${proj.subDir}` : proj.path;
    const pkgPath = `${rootPath}/package.json`;
    try {
      const exists = await invoke<boolean>("file_exists", { path: pkgPath });
      if (!exists) return "generic";
      
      const content = await invoke<string>("read_file", { path: pkgPath });
      const pkg = JSON.parse(content);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      
      if (deps["next"]) return "next";
      if (deps["@tauri-apps/api"] || deps["@tauri-apps/cli"] || deps["tauri"]) return "tauri";
      if (deps["express"]) return "express";
      if (deps["@vue/cli-service"] || deps["vue"]) return "vue";
      if (deps["@sveltejs/kit"] || deps["svelte"]) return "svelte";
      if (deps["react"] || deps["react-dom"]) return "react";
      
      return "node";
    } catch {
      return "generic";
    }
  };

  useEffect(() => {
    localStorage.setItem("orbit_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("orbit_selected_scripts", JSON.stringify(selectedScripts));
  }, [selectedScripts]);

  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem("orbit_active_workspace_id", activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  // Set up Tauri event listeners for background scripts
  useEffect(() => {
    if (!isTauriRuntime) return;
    let disposed = false;
    const cleanupListeners: Array<() => void> = [];

    const flushPendingLogs = () => {
      logFlushFrame.current = null;
      const batch = pendingScriptLogs.current.splice(0);
      if (disposed || batch.length === 0) return;

      setLogs(prev => {
        const grouped = new Map<string, LogEventPayload[]>();
        batch.forEach(payload => {
          const key = `${payload.project_id}:${payload.script}`;
          const entries = grouped.get(key);
          if (entries) entries.push(payload);
          else grouped.set(key, [payload]);
        });

        const next = { ...prev };
        grouped.forEach(entries => {
          const { project_id, script } = entries[0];
          const projectLogs = { ...(next[project_id] || {}) };
          const appended = entries.map(({ line, is_stderr }) => ({ line, isStderr: is_stderr }));
          projectLogs[script] = [...(projectLogs[script] || []), ...appended].slice(-1_000);
          next[project_id] = projectLogs;
        });
        return next;
      });
    };

    const setupListeners = async () => {
      // 1. Listen for logs
      const unlistenLog = await listen<LogEventPayload>("script-log", (event) => {
        if (disposed) return;
        pendingScriptLogs.current.push(event.payload);
        if (logFlushFrame.current === null) {
          logFlushFrame.current = window.requestAnimationFrame(flushPendingLogs);
        }
      });
      if (disposed) {
        unlistenLog();
        return;
      }
      cleanupListeners.push(unlistenLog);

      // 2. Listen for process exit
      const unlistenExit = await listen<ExitEventPayload>("script-exit", (event) => {
        if (disposed) return;
        flushPendingLogs();
        const { project_id, script, exit_code } = event.payload;
        
        setScriptStatuses((prev) => {
          const projectStats = prev[project_id] || {};
          return {
            ...prev,
            [project_id]: {
              ...projectStats,
              [script]: "idle"
            }
          };
        });

        setLogs((prev) => {
          const projectLogs = prev[project_id] || {};
          const scriptLogs = projectLogs[script] || [];
          return {
            ...prev,
            [project_id]: {
              ...projectLogs,
              [script]: [
                ...scriptLogs,
                {
                  line: `\n[Process terminated with code ${exit_code}]`,
                  isStderr: exit_code !== 0
                }
              ]
            }
          };
        });
      });
      if (disposed) {
        unlistenExit();
        return;
      }
      cleanupListeners.push(unlistenExit);

      // 3. Sync running states on startup
      try {
        const running = await invoke<string[]>("get_running_scripts");
        const initialStatuses: Record<string, Record<string, "idle" | "running" | "stopping">> = {};
        running.forEach((key) => {
          const [projId, scriptName] = key.split(":");
          if (!initialStatuses[projId]) initialStatuses[projId] = {};
          initialStatuses[projId][scriptName] = "running";
        });
        if (!disposed) setScriptStatuses(initialStatuses);

        const bufferedLogs = await invoke<LogEventPayload[]>("get_script_logs");
        if (!disposed) {
          const restored: Record<string, Record<string, ScriptLog[]>> = {};
          bufferedLogs.forEach(({ project_id, script, line, is_stderr }) => {
            if (!restored[project_id]) restored[project_id] = {};
            if (!restored[project_id][script]) restored[project_id][script] = [];
            restored[project_id][script].push({ line, isStderr: is_stderr });
          });
          setLogs(restored);
        }
      } catch (err) {
        console.error("Failed to sync running scripts:", err);
      }

    };

    setupListeners();
    return () => {
      disposed = true;
      if (logFlushFrame.current !== null) window.cancelAnimationFrame(logFlushFrame.current);
      logFlushFrame.current = null;
      pendingScriptLogs.current = [];
      cleanupListeners.forEach(unlisten => unlisten());
    };
  }, []);

  // Fetch branches and git status periodically or on workspace load
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const activeWorkspaceProjects = projects.filter((p) =>
    activeWorkspace?.projectIds.includes(p.id)
  );

  const fetchGitStates = async () => {
    const generation = ++scanGeneration.current;
    const projectsToScan = [...activeWorkspaceProjects];
    const updatedGitStates: Record<string, { branch: string; changes: number }> = {};
    const updatedFrameworks: Record<string, "react" | "next" | "vue" | "svelte" | "express" | "tauri" | "node" | "generic"> = { ...projectFrameworks };
    setProjectScan({ isLoading: projectsToScan.length > 0, completed: 0, total: projectsToScan.length });

    // Inspect only two projects at once: enough parallelism to feel quick without
    // flooding slower machines with Git and filesystem processes during startup.
    for (let index = 0; index < projectsToScan.length; index += 2) {
      const batch = projectsToScan.slice(index, index + 2);
      await Promise.all(batch.map(async (proj) => {
        const frameworkPromise = detectProjectFramework(proj);
        const gitPromise = (async () => {
          try {
            const gitExists = await invoke<boolean>("file_exists", { path: `${proj.path}/.git` });
            if (!gitExists) return { branch: "not a git repo", changes: 0 };
            const [branchOutput, statusOutput] = await Promise.all([
              invoke<string>("run_git_command", { path: proj.path, args: ["rev-parse", "--abbrev-ref", "HEAD"] }),
              invoke<string>("run_git_command", { path: proj.path, args: ["status", "--porcelain", "--untracked-files=normal"] })
            ]);
            return {
              branch: branchOutput.trim(),
              changes: statusOutput.split("\n").filter(l => l.trim().length > 0).length
            };
          } catch {
            return { branch: "unknown", changes: 0 };
          }
        })();

        const [framework, gitInfo] = await Promise.all([frameworkPromise, gitPromise]);
        updatedFrameworks[proj.id] = framework;
        updatedGitStates[proj.id] = gitInfo;
        if (scanGeneration.current === generation) {
          setProjectGitInfo(prev => ({ ...prev, [proj.id]: gitInfo }));
          setProjectFrameworks(prev => ({ ...prev, [proj.id]: framework }));
          setProjectScan(prev => ({ ...prev, completed: prev.completed + 1 }));
        }
      }));

      if (scanGeneration.current !== generation) return;
    }
    if (scanGeneration.current === generation) {
      setProjectGitInfo(updatedGitStates);
      setProjectFrameworks(updatedFrameworks);
      setProjectScan({ isLoading: false, completed: projectsToScan.length, total: projectsToScan.length });
    }
  };

  useEffect(() => {
    if (activeWorkspaceProjects.length > 0) {
      const timer = window.setTimeout(fetchGitStates, 250);
      return () => window.clearTimeout(timer);
    } else {
      scanGeneration.current += 1;
      setProjectGitInfo({});
      setProjectScan({ isLoading: false, completed: 0, total: 0 });
    }
  }, [activeWorkspaceId, projects, workspaces]);

  // Actions
  const handleStartScript = async (projId: string, scriptName: string, path: string) => {
    setScriptStatuses((prev) => {
      const projStats = prev[projId] || {};
      return {
        ...prev,
        [projId]: { ...projStats, [scriptName]: "running" }
      };
    });

    try {
      await invoke("start_project_script", {
        projectId: projId,
        script: scriptName,
        path
      });
      setActiveScript(scriptName);
      setSelectedScripts(prev => ({ ...prev, [projId]: scriptName }));
    } catch (err: any) {
      // Revert status
      setScriptStatuses((prev) => {
        const projStats = prev[projId] || {};
        return {
          ...prev,
          [projId]: { ...projStats, [scriptName]: "idle" }
        };
      });

      // Append error log
      setLogs((prev) => {
        const projectLogs = prev[projId] || {};
        const scriptLogs = projectLogs[scriptName] || [];
        return {
          ...prev,
          [projId]: {
            ...projectLogs,
            [scriptName]: [
              ...scriptLogs,
              { line: `Failed to start process: ${err}`, isStderr: true }
            ]
          }
        };
      });
    }
  };

  const handleStopScript = async (projId: string, scriptName: string) => {
    setScriptStatuses((prev) => {
      const projStats = prev[projId] || {};
      return {
        ...prev,
        [projId]: { ...projStats, [scriptName]: "stopping" }
      };
    });

    try {
      await invoke("stop_project_script", { projectId: projId, script: scriptName });
      setScriptStatuses(prev => ({
        ...prev,
        [projId]: { ...(prev[projId] || {}), [scriptName]: "idle" }
      }));
    } catch (err) {
      console.error(err);
      setScriptStatuses(prev => ({
        ...prev,
        [projId]: { ...(prev[projId] || {}), [scriptName]: "idle" }
      }));
      setLogs(prev => ({
        ...prev,
        [projId]: {
          ...(prev[projId] || {}),
          [scriptName]: [...(prev[projId]?.[scriptName] || []), { line: `Failed to stop process: ${err}`, isStderr: true }]
        }
      }));
    }
  };

  const handleTerminalSubmit = async (project: Project, terminalId: string) => {
    const key = `${project.id}:${terminalId}`;
    const input = (terminalInputs[key] || "").trim();
    if (!input) return;
    setTerminalInputs(prev => ({ ...prev, [key]: "" }));
    const status = scriptStatuses[project.id]?.[terminalId] || "idle";

    try {
      if (status === "running") {
        await invoke("send_project_script_input", {
          projectId: project.id,
          script: terminalId,
          input
        });
      } else {
        setScriptStatuses(prev => ({
          ...prev,
          [project.id]: { ...(prev[project.id] || {}), [terminalId]: "running" }
        }));
        await invoke("start_project_command", {
          projectId: project.id,
          terminalId,
          path: project.subDir ? `${project.path}/${project.subDir}` : project.path,
          command: input
        });
      }
    } catch (error) {
      setScriptStatuses(prev => ({
        ...prev,
        [project.id]: { ...(prev[project.id] || {}), [terminalId]: status }
      }));
      setLogs(prev => ({
        ...prev,
        [project.id]: {
          ...(prev[project.id] || {}),
          [terminalId]: [...(prev[project.id]?.[terminalId] || []), { line: `Terminal error: ${error}`, isStderr: true }]
        }
      }));
    }
  };

  const handleStopAllScripts = async () => {
    try {
      await invoke("stop_all_project_scripts");
      // Reset statuses in React
      const resetStatuses: Record<string, Record<string, "idle" | "running" | "stopping">> = {};
      projects.forEach((p) => {
        resetStatuses[p.id] = {};
        const projStats = scriptStatuses[p.id] || {};
        Object.keys(projStats).forEach((s) => {
          resetStatuses[p.id][s] = "idle";
        });
      });
      setScriptStatuses(resetStatuses);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartAllDev = async () => {
    for (const proj of activeWorkspaceProjects) {
      try {
        const resolvedPath = proj.subDir ? `${proj.path}/${proj.subDir}` : proj.path;
        const packageJsonPath = `${resolvedPath}/package.json`.replace(/\\/g, "/");
        const exists = await invoke<boolean>("file_exists", { path: packageJsonPath });
        if (!exists) continue;

        const content = await invoke<string>("read_file", { path: packageJsonPath });
        const pkg = JSON.parse(content);
        
        if (pkg.scripts && pkg.scripts.dev) {
          // If already running, skip
          const currentStatus = (scriptStatuses[proj.id] || {})["dev"] || "idle";
          if (currentStatus === "idle") {
            handleStartScript(proj.id, "dev", resolvedPath);
          }
        }
      } catch (err) {
        console.error(`Failed to trigger start all for project: ${proj.name}`, err);
      }
    }
  };

  const handleSyncAllGit = async () => {
    setSyncStatus({
      isOpen: true,
      projectName: "Preparing repositories",
      stage: "pulling",
      progress: [],
      error: null,
      completed: 0,
      total: activeWorkspaceProjects.length
    });
    
    for (const proj of activeWorkspaceProjects) {
      try {
        const gitExists = await invoke<boolean>("file_exists", { path: `${proj.path}/.git` });
        if (!gitExists) {
          setSyncStatus(prev => ({ ...prev, completed: prev.completed + 1 }));
          continue;
        }

        setSyncStatus(prev => ({
          ...prev,
          projectName: proj.name,
          stage: "pulling",
          progress: [...prev.progress, `[${proj.name}] Syncing Git...`]
        }));

        // Git pull
        try {
          const pullOut = await invoke<string>("run_git_command", {
            path: proj.path,
            args: ["pull"]
          });
          setSyncStatus(prev => ({
            ...prev,
            progress: [...prev.progress, `  ↳ Pull output: ${pullOut.trim().split("\n")[0]}`]
          }));
        } catch (pullErr: any) {
          setSyncStatus(prev => ({
            ...prev,
            progress: [...prev.progress, `  ❌ Pull failed: ${pullErr}`]
          }));
        }

        // Git push
        setSyncStatus(prev => ({ ...prev, stage: "pushing" }));
        try {
          const pushOut = await invoke<string>("run_git_command", {
            path: proj.path,
            args: ["push"]
          });
          setSyncStatus(prev => ({
            ...prev,
            progress: [...prev.progress, `  ↳ Push output: ${pushOut.trim() || "Everything up-to-date"}`]
          }));
        } catch (pushErr: any) {
          setSyncStatus(prev => ({
            ...prev,
            progress: [...prev.progress, `  ❌ Push failed: ${pushErr}`]
          }));
        }

        setSyncStatus(prev => ({
          ...prev,
          completed: prev.completed + 1,
          progress: [...prev.progress, `✓ [${proj.name}] Git sync complete.`]
        }));
      } catch (err) {
        console.error(err);
        setSyncStatus(prev => ({
          ...prev,
          completed: prev.completed + 1,
          progress: [...prev.progress, `Failed to inspect [${proj.name}]: ${err}`]
        }));
      }
    }
    
    setSyncStatus(prev => ({ ...prev, stage: "idle", projectName: "Done" }));
    fetchGitStates();
  };

  const handleAddWorkspace = () => {
    if (!newWorkspaceName.trim()) return;
    const newWS: Workspace = {
      id: Math.random().toString(36).substring(7),
      name: newWorkspaceName.trim(),
      projectIds: []
    };
    setWorkspaces([...workspaces, newWS]);
    setActiveWorkspaceId(newWS.id);
    setNewWorkspaceName("");
    setShowWorkspaceModal(false);
  };

  // handleDeleteWorkspace removed to satisfy compiler

  const handleBrowseDirectory = async () => {
    try {
      const selected = await invoke<string | null>("select_directory");
      if (selected) {
        setNewProjectPath(selected);
        const cleanPath = selected.replace(/\\/g, "/");
        const dirName = cleanPath.split("/").pop();
        if (dirName) {
          setNewProjectName(dirName);
        }
      }
    } catch (err) {
      console.error("Failed to open file dialog:", err);
    }
  };

  const handleSaveProjectName = () => {
    if (!editingProjectNameValue.trim() || !editingProjectNameId) return;
    setProjects(
      projects.map((p) => {
        if (p.id === editingProjectNameId) {
          return { ...p, name: editingProjectNameValue.trim() };
        }
        return p;
      })
    );
    setEditingProjectNameId(null);
  };

  const handleSaveWorkspaceName = () => {
    if (!editingWorkspaceNameValue.trim() || !editingWorkspaceNameId) return;
    setWorkspaces(
      workspaces.map((w) => {
        if (w.id === editingWorkspaceNameId) {
          return { ...w, name: editingWorkspaceNameValue.trim() };
        }
        return w;
      })
    );
    setEditingWorkspaceNameId(null);
  };

  const handleSaveSubDir = () => {
    if (!activeProjectId) return;
    const cleanSub = editingSubDirValue.trim().replace(/^\/+|\/+$/g, "");
    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          return { ...p, subDir: cleanSub || undefined };
        }
        return p;
      })
    );
    setEditingSubDirId(null);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectModalError(null);

    const cleanPath = newProjectPath.trim().replace(/\\/g, "/");
    if (!cleanPath) return;

    setIsImporting(true);
    try {
      // Validate path exists
      const exists = await invoke<boolean>("check_directory_exists", { path: cleanPath });
      if (!exists) {
        setProjectModalError("The directory path does not exist on your machine.");
        return;
      }

      // Try auto-detect name from package.json
      let detectedName = newProjectName.trim();
      if (!detectedName) {
        const pkgPath = `${cleanPath}/package.json`;
        const pkgExists = await invoke<boolean>("file_exists", { path: pkgPath });
        if (pkgExists) {
          try {
            const content = await invoke<string>("read_file", { path: pkgPath });
            const pkg = JSON.parse(content);
            if (pkg.name) detectedName = pkg.name;
          } catch (e) {
            console.error("Failed to read package.json name:", e);
          }
        }
      }

      // Fallback name is the folder name
      if (!detectedName) {
        detectedName = cleanPath.split("/").pop() || "Unnamed Project";
      }

      const newProjId = Math.random().toString(36).substring(7);
      const cleanSubDir = newProjectSubDir.trim().replace(/^\/+|\/+$/g, "");
      const newProj: Project = {
        id: newProjId,
        name: detectedName,
        path: cleanPath,
        template: newProjectTemplate,
        subDir: cleanSubDir || undefined
      };

      // Add project to list
      setProjects([...projects, newProj]);

      // Add project to active workspace
      setWorkspaces(
        workspaces.map((w) => {
          if (w.id === activeWorkspaceId) {
            return { ...w, projectIds: [...w.projectIds, newProjId] };
          }
          return w;
        })
      );

      // Clean inputs & close
      setNewProjectPath("");
      setNewProjectName("");
      setNewProjectSubDir("");
      setNewProjectTemplate("auto");
      setShowProjectModal(false);
      setActiveProjectId(newProjId); // Redirect to new project
    } catch (err: any) {
      setProjectModalError(`Error: ${err}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenEditor = async (project: Project, editor: "vscode" | "cursor") => {
    const operationKey = `${project.id}:${editor}`;
    if (openingEditor) return;
    setOpeningEditor(operationKey);
    const resolvedPath = project.subDir ? `${project.path}/${project.subDir}` : project.path;
    try {
      // Keep the busy state visible briefly because launching a desktop editor
      // returns before its window has finished appearing.
      await Promise.all([
        invoke("open_in_editor", { editor, path: resolvedPath }),
        new Promise(resolve => window.setTimeout(resolve, 1200))
      ]);
    } catch (error) {
      setNotice({
        tone: "error",
        title: `Could not open ${editor === "vscode" ? "Visual Studio Code" : "Cursor"}`,
        message: String(error)
      });
    } finally {
      setOpeningEditor(null);
    }
  };

  const selectProjectScript = (projectId: string, scriptName: string | null) => {
    setActiveScript(scriptName);
    if (scriptName) {
      setSelectedScripts(prev => ({ ...prev, [projectId]: scriptName }));
    }
  };

  const openProject = (projectId: string, tab: typeof activeTab = "overview") => {
    const running = Object.keys(scriptStatuses[projectId] || {}).find(
      script => scriptStatuses[projectId][script] === "running"
    );
    const remembered = selectedScripts[projectId];
    const scriptsWithLogs = Object.keys(logs[projectId] || {});
    const lastWithLogs = scriptsWithLogs[scriptsWithLogs.length - 1];
    setActiveProjectId(projectId);
    setActiveTab(tab);
    setActiveScript(remembered || running || lastWithLogs || null);
  };

  const clearScriptLogs = (projectId: string, scriptName: string) => {
    void invoke("clear_project_script_logs", { projectId, script: scriptName });
    setLogs(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || {}), [scriptName]: [] }
    }));
  };

  const dismissTerminalSession = (projectId: string, scriptName: string) => {
    if (scriptStatuses[projectId]?.[scriptName] === "running") return;
    clearScriptLogs(projectId, scriptName);
    setScriptStatuses(prev => {
      const projectStatuses = { ...(prev[projectId] || {}) };
      delete projectStatuses[scriptName];
      return { ...prev, [projectId]: projectStatuses };
    });
  };

  const handleConfirmRemoveProject = () => {
    if (!projectToDelete) return;
    const projId = projectToDelete.id;
    
    // Remove from active workspace
    setWorkspaces(
      workspaces.map((w) => {
        if (w.id === activeWorkspaceId) {
          return { ...w, projectIds: w.projectIds.filter(id => id !== projId) };
        }
        return w;
      })
    );

    // If active, reset active view
    if (activeProjectId === projId) {
      setActiveProjectId(null);
    }
    
    setProjectToDelete(null);
  };

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeProjectLogs = logs[activeProjectId || ""]?.[activeScript || ""] || [];
  const activeProjectStatuses = scriptStatuses[activeProjectId || ""] || {};
  const terminalSessions = activeWorkspaceProjects.flatMap(project => {
    const sessionNames = new Set([
      ...Object.keys(logs[project.id] || {}),
      ...Object.keys(scriptStatuses[project.id] || {})
    ]);
    return [...sessionNames].map(script => ({
      project,
      script,
      status: scriptStatuses[project.id]?.[script] || "idle"
    }));
  });
  const runningTerminalCount = terminalSessions.filter(({ status }) => status === "running" || status === "stopping").length;

  return (
    <div className="flex h-screen w-screen text-slate-100 bg-slate-950 overflow-hidden select-none">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-950/60 border-r border-slate-800/80 flex flex-col shrink-0">
        
        {/* Logo / Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-850/80 bg-slate-950/40 select-none" data-tauri-drag-region>
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-850/80 flex items-center justify-center shadow-lg shadow-black/25 overflow-hidden">
            <img src="/branding/projman-logo.png" alt="ProjMan" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              PROJMAN
            </h1>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block -mt-0.5">
              Workspace Hub
            </span>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="p-4 border-b border-slate-900">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workspace
            </label>
            <button
              onClick={() => setShowWorkspaceModal(true)}
              className="p-0.5 hover:bg-slate-900 rounded text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <select
            value={activeWorkspaceId || ""}
            onChange={(e) => {
              setActiveWorkspaceId(e.target.value);
              setActiveProjectId(null); // Return to dashboard
            }}
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none transition-colors"
          >
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Projects ({activeWorkspaceProjects.length})
            </span>
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900/30 border border-indigo-900/40 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Project
            </button>
          </div>

          {projectScan.isLoading && (
            <div className="rounded-lg border border-indigo-500/15 bg-indigo-500/5 p-2.5" aria-live="polite">
              <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading project details
                </span>
                <span>{projectScan.completed}/{projectScan.total}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-[width] duration-300"
                  style={{ width: `${projectScan.total ? (projectScan.completed / projectScan.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveProjectId(null);
                setWorkspaceView("dashboard");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                activeProjectId === null && workspaceView === "dashboard"
                  ? "bg-slate-900 text-indigo-400 font-semibold"
                  : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Workspace Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveProjectId(null);
                setWorkspaceView("terminals");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                activeProjectId === null && workspaceView === "terminals"
                  ? "bg-slate-900 text-emerald-400 font-semibold"
                  : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
              }`}
            >
              <TerminalIcon className="w-4 h-4" />
              <span className="flex-1">Terminal Wall</span>
              {runningTerminalCount > 0 && (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                  {runningTerminalCount}
                </span>
              )}
            </button>

            <div className="border-t border-slate-900/60 my-2" />

            {activeWorkspaceProjects.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-600 italic">
                No projects imported. Add a folder to get started!
              </div>
            ) : (
              activeWorkspaceProjects.map((p) => {
                const gitInfo = projectGitInfo[p.id];
                const activeRunningStats = Object.values(scriptStatuses[p.id] || {}).includes("running");
                const isActive = activeProjectId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`group relative flex items-center rounded-lg transition-all ${
                      isActive 
                        ? "bg-indigo-950/15 border border-indigo-900/50" 
                        : "hover:bg-slate-900/30 border border-transparent"
                    }`}
                  >
                    <button
                      onClick={() => {
                        openProject(p.id);
                      }}
                      className="flex-1 flex items-center gap-2.5 px-3 py-2 text-sm text-left min-w-0"
                    >
                      {/* Status indicator */}
                      <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${
                        activeRunningStats ? "bg-emerald-500 glow-green" : "bg-slate-700"
                      }`} />
                      
                      {getFrameworkIcon(projectFrameworks[p.id])}
                      
                      <div className="min-w-0 flex-1">
                        <span className={`block truncate ${isActive ? "text-slate-100 font-bold" : "text-slate-300"}`}>
                          {p.name}
                        </span>
                        {gitInfo && (
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-slate-600 shrink-0" />
                            <span className="truncate">{gitInfo.branch}</span>
                            {gitInfo.changes > 0 && (
                              <span className="text-amber-500/80 font-bold">+{gitInfo.changes}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Quick editor, terminal, and remove buttons */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditor(p, "vscode");
                        }}
                        disabled={openingEditor !== null}
                        className="p-1 bg-slate-950/80 hover:bg-slate-900 rounded transition-all disabled:opacity-50 disabled:cursor-wait"
                        title="Open in Visual Studio Code"
                        aria-label={`Open ${p.name} in Visual Studio Code`}
                      >
                        {openingEditor === `${p.id}:vscode` ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#23A8F2]" /> : <VSCodeIcon className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditor(p, "cursor");
                        }}
                        disabled={openingEditor !== null}
                        className="p-1 bg-slate-950/80 hover:bg-slate-900 rounded transition-all disabled:opacity-50 disabled:cursor-wait"
                        title="Open in Cursor"
                        aria-label={`Open ${p.name} in Cursor`}
                      >
                        {openingEditor === `${p.id}:cursor` ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <CursorIcon className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openProject(p.id, "terminal");
                        }}
                        className="p-1 text-slate-500 hover:text-indigo-400 bg-slate-950/80 hover:bg-slate-900 rounded transition-all"
                        title="Open Terminal"
                      >
                        <TerminalIcon className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(p);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 bg-slate-950/80 hover:bg-slate-900 rounded transition-all"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-900 flex items-center justify-between text-slate-500 text-xs">
          <span className="font-semibold text-[10px] tracking-wider text-slate-600">PROJMAN CLIENT v1.3</span>
          <button
            onClick={async () => {
              if (isCheckingUpdate) return;
              setIsCheckingUpdate(true);
              try {
                const result = await invoke<string>('check_for_update');
                if (result === 'already_latest') {
                  setNotice({ tone: "success", title: "ProjMan is up to date", message: "You already have the latest available version." });
                } else {
                  setNotice({ tone: "success", title: "Update installed", message: `${result}. ProjMan will restart to finish applying it.` });
                }
              } catch (e: any) {
                setNotice({ tone: "error", title: "Update check failed", message: String(e) });
              } finally {
                setIsCheckingUpdate(false);
              }
            }}
            disabled={isCheckingUpdate}
            title="Check for updates"
            className="flex items-center gap-1.5 hover:text-slate-300 transition-colors text-[9px] uppercase tracking-wider font-bold hover:text-emerald-400 disabled:opacity-60"
          >
            {isCheckingUpdate && <Loader2 className="w-3 h-3 animate-spin" />}
            {isCheckingUpdate ? "Checking..." : "Check for Updates"}
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950/20">
        
        {/* TOP BAR */}
        <header className="h-16 border-b border-slate-900/80 bg-slate-950/10 flex items-center justify-between px-8 select-none shrink-0" data-tauri-drag-region>
          <div className="flex items-center gap-2">
            {activeProject ? (
              editingProjectNameId === activeProject.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingProjectNameValue}
                    onChange={(e) => setEditingProjectNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveProjectName();
                      else if (e.key === "Escape") setEditingProjectNameId(null);
                    }}
                    autoFocus
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                  <button
                    onClick={handleSaveProjectName}
                    className="p-1 hover:bg-slate-900 rounded text-emerald-400"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span className="font-bold text-slate-200 text-sm">
                    {activeProject.name}
                  </span>
                  <button
                    onClick={() => {
                      setEditingProjectNameId(activeProject.id);
                      setEditingProjectNameValue(activeProject.name);
                    }}
                    className="p-1 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            ) : (
              editingWorkspaceNameId === activeWorkspaceId ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingWorkspaceNameValue}
                    onChange={(e) => setEditingWorkspaceNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveWorkspaceName();
                      else if (e.key === "Escape") setEditingWorkspaceNameId(null);
                    }}
                    autoFocus
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                  <button
                    onClick={handleSaveWorkspaceName}
                    className="p-1 hover:bg-slate-900 rounded text-emerald-400"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span className="font-bold text-slate-200 text-sm">
                    {activeWorkspace?.name}
                  </span>
                  <button
                    onClick={() => {
                      if (activeWorkspaceId) {
                        setEditingWorkspaceNameId(activeWorkspaceId);
                        setEditingWorkspaceNameValue(activeWorkspace?.name || "");
                       }
                    }}
                    className="p-1 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            )}
            {activeProject && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-600" />
                <span className="text-xs text-slate-500 font-mono" title="Git Root Path">
                  {activeProject.path}
                </span>

                <ChevronRight className="w-4 h-4 text-slate-600" />
                
                {editingSubDirId === activeProject.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-bold uppercase">Subdir:</span>
                    <input
                      type="text"
                      placeholder="e.g. frontend"
                      value={editingSubDirValue}
                      onChange={(e) => setEditingSubDirValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveSubDir();
                        else if (e.key === "Escape") setEditingSubDirId(null);
                      }}
                      autoFocus
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      onClick={handleSaveSubDir}
                      className="p-0.5 hover:bg-slate-900 rounded text-emerald-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group/subdir">
                    <span className="text-xs text-slate-400 font-bold uppercase">Subdir:</span>
                    <span className={`text-xs font-mono ${activeProject.subDir ? "text-indigo-400 font-semibold" : "text-slate-500 italic"}`}>
                      {activeProject.subDir || "none (root)"}
                    </span>
                    <button
                      onClick={() => {
                        setEditingSubDirId(activeProject.id);
                        setEditingSubDirValue(activeProject.subDir || "");
                      }}
                      className="p-1 text-slate-500 hover:text-slate-300 opacity-0 group-hover/subdir:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Global Workspace actions */}
            {!activeProject && activeWorkspaceProjects.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-900/30 p-1.5 rounded-lg border border-slate-900">
                <button
                  onClick={handleStartAllDev}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow transition-colors"
                >
                  <Play className="w-3 h-3 fill-white" />
                  Start All Dev
                </button>
                <button
                  onClick={handleSyncAllGit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs font-semibold transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  Sync All Git
                </button>
                <button
                  onClick={handleStopAllScripts}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/30 border border-rose-900/30 text-rose-400 rounded text-xs font-semibold transition-colors"
                >
                  <Power className="w-3.5 h-3.5" />
                  Stop All
                </button>
              </div>
            )}
            
            {activeProject && (
              <button
                onClick={() => setActiveProjectId(null)}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
              >
                Back to Dashboard
              </button>
            )}
          </div>

          {/* Custom Window Controls */}
          <div className="flex items-center border-l border-slate-800/80 pl-4 h-full ml-4 select-none shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setTheme(current => current === "dark" ? "light" : "dark")}
              className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:text-indigo-400"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleMinimize}
              className="p-1.5 hover:bg-slate-800/80 rounded transition-colors text-slate-400 hover:text-slate-200"
              title="Minimize"
            >
              <div className="w-3 h-[2px] bg-current" />
            </button>
            <button
              type="button"
              onClick={handleMaximize}
              className="p-1.5 hover:bg-slate-800/80 rounded transition-colors text-slate-400 hover:text-slate-200 flex items-center justify-center"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <div className="w-3 h-3 border-2 border-current relative flex items-center justify-center">
                  <div className="w-1.5 h-1.5 border border-current absolute -top-1 -right-1 bg-[#080a0f]" />
                </div>
              ) : (
                <div className="w-2.5 h-2.5 border-2 border-current" />
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 hover:bg-rose-600/90 rounded transition-colors text-slate-400 hover:text-white"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* WORKSPACE OVERVIEW (DASHBOARD) */}
        {activeProjectId === null && workspaceView === "dashboard" ? (
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            
            {/* Workspace Stats Widget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/20 border border-slate-800/80 p-5 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                  <Folder className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-bold block">IMPORTED PROJECTS</span>
                  <span className="text-2xl font-extrabold text-slate-100 mt-1">
                    {activeWorkspaceProjects.length}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/20 border border-slate-800/80 p-5 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-bold block">RUNNING SCRIPTS</span>
                  <span className="text-2xl font-extrabold text-slate-100 mt-1">
                    {
                      Object.values(scriptStatuses).reduce((acc, current) => {
                        return acc + Object.values(current).filter((s) => s === "running").length;
                      }, 0)
                    }
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/20 border border-slate-800/80 p-5 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
                  <GitBranch className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-bold block">OUT OF SYNC REPOS</span>
                  <span className="text-2xl font-extrabold text-slate-100 mt-1">
                    {
                      Object.values(projectGitInfo).filter((git) => git.changes > 0).length
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Project Cards Grid */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
                Workspace Projects
              </h3>
              
              {activeWorkspaceProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/10 border border-dashed border-slate-850 rounded-xl">
                  <Folder className="w-12 h-12 text-slate-700 mb-3" />
                  <h4 className="text-slate-300 font-bold mb-1">No Projects in Workspace</h4>
                  <p className="text-xs text-slate-500 mb-6">Import folders that you want to manage together.</p>
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-semibold shadow transition-colors"
                  >
                    Import First Project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 align-start">
                  {activeWorkspaceProjects.map((p) => {
                    const gitInfo = projectGitInfo[p.id];
                    const isRunning = Object.values(scriptStatuses[p.id] || {}).includes("running");
                    
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          openProject(p.id);
                        }}
                        className="glass-card p-5 rounded-xl border border-slate-800/80 cursor-pointer flex flex-col justify-between space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {getFrameworkIcon(projectFrameworks[p.id])}
                              <span className="font-extrabold text-slate-200 text-base truncate">
                                {p.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block truncate mt-0.5" title={p.path}>
                              {p.path}
                            </span>
                          </div>
                          
                          <span className={`w-2.5 h-2.5 shrink-0 rounded-full mt-1.5 ${
                            isRunning ? "bg-emerald-500 glow-green" : "bg-slate-700"
                          }`} />
                        </div>

                        {/* Git Branch Details */}
                        {gitInfo && (
                          <div className="bg-slate-950/40 border border-slate-850/40 p-2.5 rounded-lg flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <GitBranch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="font-semibold text-slate-300 truncate">{gitInfo.branch}</span>
                            </div>
                            {gitInfo.changes > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {gitInfo.changes} changed files
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-900/60 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {isRunning ? "Running dev server" : "Idle"}
                          </span>
                          
                          {/* Quick launch / stop dev button */}
                          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenEditor(p, "vscode")}
                              disabled={openingEditor !== null}
                              className="p-1.5 bg-[#23A8F2]/10 hover:bg-[#23A8F2]/20 border border-[#23A8F2]/20 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
                              title="Open in Visual Studio Code"
                              aria-label={`Open ${p.name} in Visual Studio Code`}
                            >
                              {openingEditor === `${p.id}:vscode` ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#23A8F2]" /> : <VSCodeIcon className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleOpenEditor(p, "cursor")}
                              disabled={openingEditor !== null}
                              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
                              title="Open in Cursor"
                              aria-label={`Open ${p.name} in Cursor`}
                            >
                              {openingEditor === `${p.id}:cursor` ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <CursorIcon className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => {
                                openProject(p.id, "terminal");
                              }}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 rounded transition-colors"
                              title="Open Terminal"
                            >
                              <TerminalIcon className="w-3.5 h-3.5" />
                            </button>

                            {isRunning ? (
                              <button
                                onClick={() => handleStopScript(p.id, "dev")}
                                className="p-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/20 rounded transition-colors"
                              >
                                <Square className="w-3.5 h-3.5 fill-rose-400" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartScript(p.id, "dev", p.subDir ? `${p.path}/${p.subDir}` : p.path)}
                                className="p-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-600/20 rounded transition-colors"
                              >
                                <Play className="w-3.5 h-3.5 fill-indigo-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : activeProjectId === null ? (
          /* WORKSPACE TERMINAL WALL */
          <div className="flex flex-1 min-h-0 flex-col overflow-y-auto p-6 scrollbar-hidden">
            <div className="mb-5 flex shrink-0 items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-100">
                  <TerminalIcon className="h-5 w-5 text-emerald-400" />
                  Terminal Sessions
                </h2>
                <p className="mt-1 text-xs text-slate-500">Live output from every running script in this workspace.</p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {runningTerminalCount} active
              </span>
            </div>

            {terminalSessions.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/10 text-center">
                <TerminalIcon className="mb-3 h-10 w-10 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-300">No scripts are running</h3>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">Start a project script and its live output will appear here automatically.</p>
              </div>
            ) : (
              <div
                className={`terminal-wall-grid grid flex-1 min-h-0 gap-4 ${terminalSessions.length === 1 ? "is-single" : ""}`}
                style={{
                  gridTemplateRows: terminalSessions.length <= 4
                    ? `repeat(${Math.ceil(terminalSessions.length / 2)}, minmax(0, 1fr))`
                    : undefined,
                  gridAutoRows: terminalSessions.length > 4 ? "minmax(300px, 1fr)" : undefined
                }}
              >
                {terminalSessions.map(({ project, script, status }) => (
                  <section key={`${project.id}:${script}`} className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30 shadow-xl shadow-black/10">
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          {status === "running" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
                          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${status === "running" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-200">{project.name}</div>
                          <div className="truncate font-mono text-[10px] text-indigo-400">{script} · {status}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveProjectId(project.id);
                            setActiveTab("overview");
                            selectProjectScript(project.id, script);
                          }}
                          className="rounded border border-slate-800 bg-slate-900 p-1.5 text-slate-400 transition-colors hover:text-indigo-400"
                          title="Open project terminal"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        {status === "running" || status === "stopping" ? (
                          <button
                            onClick={() => handleStopScript(project.id, script)}
                            disabled={status === "stopping"}
                            className="rounded border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                            title={status === "stopping" ? "Stopping process" : "Stop process (Ctrl+C)"}
                          >
                            {status === "stopping" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5 fill-current" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => dismissTerminalSession(project.id, script)}
                            className="rounded border border-slate-800 bg-slate-900 p-1.5 text-slate-500 transition-colors hover:text-rose-400"
                            title="Close terminal session"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 p-2">
                      <Terminal
                        logs={logs[project.id]?.[script] || []}
                        onClear={() => clearScriptLogs(project.id, script)}
                      />
                    </div>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleTerminalSubmit(project, script);
                      }}
                      className="flex shrink-0 items-center gap-2 border-t border-slate-800 bg-slate-950/60 p-2"
                    >
                      <span className="pl-1 font-mono text-xs font-bold text-emerald-400">›</span>
                      <input
                        value={terminalInputs[`${project.id}:${script}`] || ""}
                        onChange={event => setTerminalInputs(prev => ({ ...prev, [`${project.id}:${script}`]: event.target.value }))}
                        onKeyDown={event => {
                          if (event.ctrlKey && event.key.toLowerCase() === "c") {
                            event.preventDefault();
                            if (status === "running") handleStopScript(project.id, script);
                          }
                        }}
                        disabled={status === "stopping"}
                        placeholder={status === "running" ? "Send input…  (Ctrl+C to stop)" : "Run a new command…"}
                        className="min-w-0 flex-1 bg-transparent px-1 py-1 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-600 disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={status === "stopping" || !(terminalInputs[`${project.id}:${script}`] || "").trim()}
                        className="rounded border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold text-indigo-400 transition-colors hover:bg-indigo-500/20 disabled:opacity-40"
                      >
                        {status === "running" ? "Send" : "Run"}
                      </button>
                    </form>
                  </section>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* PROJECT TABS & DETAIL VIEW */
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* Tab navigation headers */}
            <div className="flex border-b border-slate-900 bg-slate-950/30 px-8 py-0">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "overview"
                    ? "border-indigo-500 text-indigo-400 bg-indigo-950/5"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Script Runner
              </button>
              <button
                onClick={() => setActiveTab("env")}
                className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "env"
                    ? "border-indigo-500 text-indigo-400 bg-indigo-950/5"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Env Editor
              </button>
              <button
                onClick={() => setActiveTab("git")}
                className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "git"
                    ? "border-indigo-500 text-indigo-400 bg-indigo-950/5"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Local Git Suite
              </button>
              <button
                onClick={() => setActiveTab("terminal")}
                className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "terminal"
                    ? "border-indigo-500 text-indigo-400 bg-indigo-950/5"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Terminal
              </button>
            </div>

            {/* Inner view container */}
            <div className="flex-1 overflow-y-auto p-8 min-h-0">
              {activeTab === "overview" && activeProject && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0">
                  
                  {/* Left Column: Script buttons (5 cols) */}
                  <div className="xl:col-span-5 h-full min-h-0">
                    <ScriptGrid
                      projectId={activeProject.id}
                      projectPath={activeProject.subDir ? `${activeProject.path}/${activeProject.subDir}` : activeProject.path}
                      scriptStatuses={activeProjectStatuses}
                      activeScript={activeScript}
                      onStartScript={(s) => handleStartScript(activeProject.id, s, activeProject.subDir ? `${activeProject.path}/${activeProject.subDir}` : activeProject.path)}
                      onStopScript={(s) => handleStopScript(activeProject.id, s)}
                      onSelectScript={(s) => selectProjectScript(activeProject.id, s)}
                    />
                  </div>

                  {/* Right Column: Terminal logs viewer (7 cols) */}
                  <div className="xl:col-span-7 h-[500px] xl:h-full min-h-0">
                    {activeScript ? (
                      <Terminal
                        logs={activeProjectLogs}
                        onClear={() => clearScriptLogs(activeProject.id, activeScript)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-slate-950 border border-slate-800 rounded-lg p-8 text-slate-500 italic text-center font-mono text-xs">
                        <TerminalIcon className="w-8 h-8 text-slate-700 mb-2" />
                        No active script output window selected. Select a running/idle script to view its logs here.
                      </div>
                    )}
                  </div>

                </div>
              )}

              {activeTab === "env" && activeProject && (
                <div className="h-full min-h-0">
                  <EnvEditor
                    projectId={activeProject.id}
                    projectPath={activeProject.subDir ? `${activeProject.path}/${activeProject.subDir}` : activeProject.path}
                  />
                </div>
              )}

              {activeTab === "git" && activeProject && (
                <div className="h-full min-h-0">
                  <GitPanel
                    projectId={activeProject.id}
                    projectPath={activeProject.path}
                  />
                </div>
              )}

              {activeTab === "terminal" && activeProject && (
                <div className="h-full min-h-0">
                  <InteractiveTerminal
                    projectId={activeProject.id}
                    projectPath={activeProject.subDir ? `${activeProject.path}/${activeProject.subDir}` : activeProject.path}
                  />
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* OVERLAY: SYNC ALL GIT PROGRESS */}
      {syncStatus.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col max-h-[500px] shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2 flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-indigo-400 ${syncStatus.stage !== "idle" ? "animate-spin" : ""}`} />
              Workspace Git Synchronization
            </h3>
            
            <p className="text-xs text-slate-400 mb-4">
              Running git pull & push across repository folders...
            </p>

            <div className="mb-4" aria-live="polite">
              <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>{syncStatus.stage === "idle" ? "Complete" : `Working on ${syncStatus.projectName}`}</span>
                <span>{syncStatus.completed}/{syncStatus.total}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-950 ring-1 ring-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-[width] duration-500"
                  style={{ width: `${syncStatus.total ? (syncStatus.completed / syncStatus.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-850 p-4 rounded-lg font-mono text-xs text-slate-300 space-y-2 select-text">
              {syncStatus.progress.map((l, idx) => (
                <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                  {l}
                </div>
              ))}
              {syncStatus.stage !== "idle" && (
                <div className="text-indigo-400 italic font-bold">
                  → Processing: {syncStatus.projectName} ({syncStatus.stage === "pulling" ? "Pulling updates" : "Pushing local commits"})
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSyncStatus(prev => ({ ...prev, isOpen: false, progress: [] }))}
                disabled={syncStatus.stage !== "idle"}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded text-xs font-semibold transition-colors"
              >
                Close Progress Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE WORKSPACE */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-100 text-base">New Workspace</h3>
              <p className="text-xs text-slate-400 mt-1">Group folders into separate custom workspaces.</p>
            </div>

            <div>
              <input
                type="text"
                placeholder="Workspace name (e.g. Personal Projects)"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWorkspaceModal(false)}
                className="px-3.5 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddWorkspace}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow"
              >
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PROJECT */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddProject}
            className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl space-y-4"
          >
            <div>
              <h3 className="font-extrabold text-slate-100 text-base">Import Project Directory</h3>
              <p className="text-xs text-slate-400 mt-1">Add a local repository folder to the active workspace.</p>
            </div>

            {projectModalError && (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded p-3 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{projectModalError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Folder Path (Absolute)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Click Browse to select folder..."
                    value={newProjectPath}
                    onChange={(e) => setNewProjectPath(e.target.value)}
                    required
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleBrowseDirectory}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow transition-colors shrink-0"
                  >
                    Browse...
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Project Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to auto-detect from package.json"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Project Subdirectory (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. frontend, packages/app (if package.json is in subfolder)"
                  value={newProjectSubDir}
                  onChange={(e) => setNewProjectSubDir(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Framework Template
                </label>
                <select
                  value={newProjectTemplate}
                  onChange={(e) => setNewProjectTemplate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="auto">Auto-detect (Recommended)</option>
                  <option value="react">React / Vite</option>
                  <option value="vue">Vue</option>
                  <option value="next">Next.js</option>
                  <option value="angular">Angular</option>
                  <option value="other">Other / Custom</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowProjectModal(false);
                  setNewProjectPath("");
                  setNewProjectName("");
                  setNewProjectSubDir("");
                  setNewProjectTemplate("auto");
                  setProjectModalError(null);
                }}
                className="px-3.5 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-wait text-white rounded text-xs font-semibold shadow"
              >
                {isImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isImporting ? "Inspecting folder..." : "Import Folder"}
              </button>
            </div>
          </form>
        </div>
      )}

      {openingEditor && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-md" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          <div>
            <div className="text-xs font-bold text-slate-100">
              Opening {openingEditor.endsWith(":vscode") ? "Visual Studio Code" : "Cursor"}
            </div>
            <div className="text-[10px] text-slate-500">Please wait for the editor window...</div>
          </div>
        </div>
      )}

      {/* THEMED APP NOTICE (replaces native browser alerts) */}
      {notice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="notice-title">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border ${
              notice.tone === "error"
                ? "border-rose-500/25 bg-rose-500/10 text-rose-400"
                : notice.tone === "success"
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                  : "border-indigo-500/25 bg-indigo-500/10 text-indigo-400"
            }`}>
              {notice.tone === "success" ? <Check className="h-5 w-5" /> : notice.tone === "error" ? <AlertCircle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            </div>
            <h3 id="notice-title" className="text-base font-bold text-slate-100">{notice.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">{notice.message}</p>
            <div className="mt-6 flex justify-end">
              <button type="button" autoFocus onClick={() => setNotice(null)} className="rounded bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: DELETE CONFIRMATION MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col shadow-2xl scale-up-entry">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">
                Remove Project
              </h3>
            </div>
            
            <p className="text-xs text-slate-350 leading-relaxed mb-6">
              Are you sure you want to remove <span className="text-slate-100 font-bold font-mono">"{projectToDelete.name}"</span> from this workspace? 
              This only removes the project from ProjMan's configurations. Your project files on disk and git repository will remain untouched.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 border border-slate-800 rounded text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleConfirmRemoveProject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold shadow transition-colors"
              >
                Remove Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
