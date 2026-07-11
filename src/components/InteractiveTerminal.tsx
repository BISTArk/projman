import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Terminal as TermIcon, Play, Square, Trash2 } from "lucide-react";

interface InteractiveTerminalProps {
  projectPath: string;
  projectId: string;
}

interface TermLog {
  text: string;
  type: "input" | "stdout" | "stderr" | "system";
}

interface TerminalLogEvent {
  project_id: string;
  line: string;
  is_stderr: boolean;
}

interface TerminalExitEvent {
  project_id: string;
  exit_code: number;
}

export const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({ projectPath, projectId }) => {
  const [logs, setLogs] = useState<TermLog[]>([
    { text: `ProjMan Interactive Shell session started.`, type: "system" },
    { text: `Directory: ${projectPath}`, type: "system" },
    { text: `Type any command (e.g. 'npm install', 'git status', 'dir') and press Enter.`, type: "system" }
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of logs
  const scrollToBottom = () => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Focus input automatically on mount or tab changes
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Listen for Tauri events
  useEffect(() => {
    let active = true;
    let removeLogListener: (() => void) | null = null;
    let removeExitListener: (() => void) | null = null;

    listen<TerminalLogEvent>("terminal-log", (event) => {
      if (!active) return;
      const { project_id, line, is_stderr } = event.payload;
      if (project_id === projectId) {
        // Strip ANSI escape codes for cleaner output
        const cleanLine = line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
        setLogs((prev) => [
          ...prev,
          { text: cleanLine, type: is_stderr ? "stderr" : "stdout" }
        ]);
      }
    }).then((unlisten) => {
      removeLogListener = unlisten;
      if (!active) unlisten();
    });

    listen<TerminalExitEvent>("terminal-exit", (event) => {
      if (!active) return;
      const { project_id, exit_code } = event.payload;
      if (project_id === projectId) {
        setIsRunning(false);
        setLogs((prev) => [
          ...prev,
          { text: `Process exited with code ${exit_code}`, type: "system" }
        ]);
        // Refocus input
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }).then((unlisten) => {
      removeExitListener = unlisten;
      if (!active) unlisten();
    });

    return () => {
      active = false;
      if (removeLogListener) removeLogListener();
      if (removeExitListener) removeExitListener();
    };
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const command = currentInput.trim();
    if (!command || isRunning) return;

    // Add to logs display
    setLogs((prev) => [
      ...prev,
      { text: `${projectPath} > ${command}`, type: "input" }
    ]);

    // Track command history
    setHistory((prev) => {
      const nextHist = [command, ...prev.filter((h) => h !== command)];
      return nextHist.slice(0, 50); // limit to 50 items
    });
    setHistoryIndex(-1);
    setIsRunning(true);
    setCurrentInput("");

    try {
      await invoke("run_terminal_command", {
        projectId,
        command,
        cwd: projectPath
      });
    } catch (err: any) {
      setIsRunning(false);
      setLogs((prev) => [
        ...prev,
        { text: `Error executing command: ${err}`, type: "stderr" }
      ]);
    }
  };

  const handleStop = async () => {
    if (!isRunning) return;
    try {
      await invoke("stop_terminal_command", { projectId });
      setLogs((prev) => [
        ...prev,
        { text: `Process interrupted by user (Ctrl+C)`, type: "system" }
      ]);
    } catch (err) {
      console.error("Failed to interrupt process:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx < history.length) {
        setHistoryIndex(nextIdx);
        setCurrentInput(history[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = historyIndex - 1;
      if (nextIdx >= 0) {
        setHistoryIndex(nextIdx);
        setCurrentInput(history[nextIdx]);
      } else {
        setHistoryIndex(-1);
        setCurrentInput("");
      }
    }
  };

  const handleClear = () => {
    setLogs([
      { text: `Console cleared. Session active in: ${projectPath}`, type: "system" }
    ]);
  };

  const handleUrlClick = async (url: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      try {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(url);
      } catch (err) {
        window.open(url, "_blank");
      }
    }
  };

  const renderLineWithUrls = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s"'`]+)/g;
    const parts = text.split(urlRegex);
    if (parts.length === 1) return text;

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <span
            key={index}
            onClick={(e) => handleUrlClick(part, e)}
            className="text-indigo-400 font-semibold underline hover:text-indigo-300 cursor-pointer select-text"
            title="Ctrl+Click to open in browser"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleConsoleClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 p-6 rounded-xl border border-slate-800/80">
      
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-2">
          <TermIcon className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-100">Interactive Terminal</h2>
        </div>

        <div className="flex items-center gap-3">
          {isRunning ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold shadow transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              Ctrl+C (Kill)
            </button>
          ) : (
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
              Ready
            </span>
          )}

          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Clear Output"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Output Console Display */}
      <div 
        onClick={handleConsoleClick}
        className="flex-1 bg-slate-950 border border-slate-850 p-5 rounded-lg overflow-y-auto font-mono text-xs select-text scrollbar-thin flex flex-col space-y-1.5 cursor-text"
      >
        {logs.map((log, idx) => {
          let lineClass = "text-slate-350";
          if (log.type === "input") {
            lineClass = "text-indigo-400 font-bold mt-2";
          } else if (log.type === "stderr") {
            lineClass = "text-rose-400 bg-rose-950/10 px-1 rounded-sm";
          } else if (log.type === "system") {
            lineClass = "text-slate-500 italic";
          }
          
          return (
            <div key={idx} className={`whitespace-pre-wrap leading-relaxed break-all ${lineClass}`}>
              {renderLineWithUrls(log.text)}
            </div>
          );
        })}
        <div ref={consoleEndRef} />
      </div>

      {/* Prompt Input Form */}
      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 focus-within:border-indigo-500 rounded-lg px-3.5 py-2 transition-all">
          <span className="text-slate-500 font-mono text-xs select-none mr-2 shrink-0 truncate max-w-[200px]">
            {projectPath.split("/").pop()} &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            placeholder={isRunning ? "Command is running..." : "Type command here..."}
            className="flex-1 bg-transparent font-mono text-xs text-slate-200 focus:outline-none disabled:text-slate-600"
          />
        </div>

        <button
          type="submit"
          disabled={isRunning || !currentInput.trim()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition-colors shrink-0 flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Execute
        </button>
      </form>
      
    </div>
  );
};
