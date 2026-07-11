import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Play, Square, Settings, AlertCircle, Cpu, Loader2 } from "lucide-react";

interface ScriptGridProps {
  projectPath: string;
  projectId: string;
  scriptStatuses: Record<string, "idle" | "running" | "stopping">;
  onStartScript: (scriptName: string) => void;
  onStopScript: (scriptName: string) => void;
  onSelectScript: (scriptName: string) => void;
  activeScript: string | null;
}

export const ScriptGrid: React.FC<ScriptGridProps> = ({
  projectPath,
  projectId,
  scriptStatuses,
  onStartScript,
  onStopScript,
  onSelectScript,
  activeScript,
}) => {
  const [scripts, setScripts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadScripts = async () => {
    setError(null);
    try {
      const packageJsonPath = `${projectPath}/package.json`.replace(/\\/g, "/");
      const exists = await invoke<boolean>("file_exists", { path: packageJsonPath });
      
      if (!exists) {
        setScripts({});
        return;
      }

      const content = await invoke<string>("read_file", { path: packageJsonPath });
      const pkg = JSON.parse(content);
      
      if (pkg.scripts) {
        setScripts(pkg.scripts);
      } else {
        setScripts({});
      }
    } catch (err: any) {
      setError(`Failed to parse package.json: ${err}`);
      setScripts({});
    }
  };

  useEffect(() => {
    loadScripts();
  }, [projectPath, projectId]);

  const scriptNames = Object.keys(scripts);

  return (
    <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-800/80 h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800/60 pb-4">
        <Cpu className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-slate-100">Project Scripts</h2>
        <span className="text-xs text-slate-400 ml-auto">
          Defined in package.json
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded p-3 text-xs text-rose-400 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {scriptNames.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 italic text-sm text-center">
          <Settings className="w-8 h-8 text-slate-700 mb-2" />
          No scripts found. Make sure package.json exists and contains a "scripts" field.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 select-none">
          {scriptNames.map((name) => {
            const command = scripts[name];
            const status = scriptStatuses[name] || "idle";
            const isActiveView = activeScript === name;

            return (
              <div
                key={name}
                onClick={() => onSelectScript(name)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  isActiveView
                    ? "border-indigo-500/80 bg-indigo-950/10 shadow-md shadow-indigo-950/15"
                    : "border-slate-800 bg-slate-950/30 hover:bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Status dot indicator */}
                  <span className="shrink-0 flex h-2.5 w-2.5 relative">
                    {status === "running" ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="inline-flex rounded-full h-2 w-2 bg-slate-800 border border-slate-700"></span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                    <span className="font-bold text-slate-200 text-sm truncate shrink-0 w-28">
                      {name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-[280px]" title={command}>
                      {command}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    {status === "running" ? "Running" : status === "stopping" ? "Stopping..." : "Idle"}
                  </span>
                  
                  {status === "idle" ? (
                    <button
                      onClick={() => onStartScript(name)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-semibold transition-colors shadow shadow-indigo-900/10"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Run
                    </button>
                  ) : status === "running" ? (
                    <button
                      onClick={() => onStopScript(name)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold transition-colors shadow shadow-rose-900/10"
                    >
                      <Square className="w-3 h-3 fill-white" />
                      Stop
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-slate-500 rounded text-[11px] font-semibold"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Wait
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
