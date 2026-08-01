import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  AlertCircle,
  Check,
  Cpu,
  Edit2,
  EllipsisVertical,
  Loader2,
  Play,
  Plus,
  Settings,
  Square,
  Trash2,
  X,
} from "lucide-react";

interface ScriptGridProps {
  projectPath: string;
  projectId: string;
  scriptStatuses: Record<string, "idle" | "running" | "stopping">;
  onStartScript: (scriptName: string) => void;
  onStopScript: (scriptName: string) => void;
  onSelectScript: (scriptName: string | null) => void;
  activeScript: string | null;
}

interface ScriptDraft {
  originalName: string | null;
  name: string;
  command: string;
}

type ScriptMutation =
  | { kind: "add"; name: string; command: string }
  | { kind: "edit"; originalName: string; name: string; command: string }
  | { kind: "delete"; name: string };

const getPackageJsonPath = (projectPath: string) =>
  `${projectPath}/package.json`.replace(/\\/g, "/");

const serializePackageJson = (pkg: Record<string, unknown>, original: string) => {
  const indentation = original.match(/\n([ \t]+)"/)?.[1] || "  ";
  const lineEnding = original.includes("\r\n") ? "\r\n" : "\n";
  const hadTrailingNewline = /\r?\n$/.test(original);
  const serialized = JSON.stringify(pkg, null, indentation).replace(/\n/g, lineEnding);
  return hadTrailingNewline ? `${serialized}${lineEnding}` : serialized;
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasPackageJson, setHasPackageJson] = useState(false);
  const [draft, setDraft] = useState<ScriptDraft | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const loadScripts = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const packageJsonPath = getPackageJsonPath(projectPath);
      const exists = await invoke<boolean>("file_exists", { path: packageJsonPath });
      setHasPackageJson(exists);

      if (!exists) {
        setScripts({});
        return;
      }

      const content = await invoke<string>("read_file", { path: packageJsonPath });
      const pkg = JSON.parse(content);
      if (pkg.scripts && (typeof pkg.scripts !== "object" || Array.isArray(pkg.scripts))) {
        throw new Error('The "scripts" field must be an object.');
      }
      if (pkg.scripts && Object.values(pkg.scripts).some((command) => typeof command !== "string")) {
        throw new Error('Every entry in "scripts" must contain a string command.');
      }
      setScripts(pkg.scripts || {});
    } catch (err) {
      setError(`Failed to read package.json: ${String(err)}`);
      setScripts({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setDraft(null);
    setDeleteCandidate(null);
    setSavedMessage(null);
    void loadScripts();
  }, [projectPath, projectId]);

  useEffect(() => {
    if (!savedMessage) return;
    const timer = window.setTimeout(() => setSavedMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [savedMessage]);

  useEffect(() => {
    if (!openMenu) return;
    const closeMenu = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-script-menu]")) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [openMenu]);

  const persistMutation = async (mutation: ScriptMutation) => {
    const packageJsonPath = getPackageJsonPath(projectPath);
    const content = await invoke<string>("read_file", { path: packageJsonPath });
    const pkg = JSON.parse(content) as Record<string, unknown>;
    const latestScripts =
      pkg.scripts && typeof pkg.scripts === "object" && !Array.isArray(pkg.scripts)
        ? { ...(pkg.scripts as Record<string, string>) }
        : {};

    let nextScripts: Record<string, string>;
    if (mutation.kind === "add") {
      if (Object.prototype.hasOwnProperty.call(latestScripts, mutation.name)) {
        throw new Error(`A script named "${mutation.name}" already exists.`);
      }
      nextScripts = { ...latestScripts, [mutation.name]: mutation.command };
    } else if (mutation.kind === "edit") {
      if (!Object.prototype.hasOwnProperty.call(latestScripts, mutation.originalName)) {
        throw new Error(`"${mutation.originalName}" changed outside ProjMan. Refresh and try again.`);
      }
      if (
        mutation.name !== mutation.originalName &&
        Object.prototype.hasOwnProperty.call(latestScripts, mutation.name)
      ) {
        throw new Error(`A script named "${mutation.name}" already exists.`);
      }
      nextScripts = {};
      Object.entries(latestScripts).forEach(([name, command]) => {
        nextScripts[name === mutation.originalName ? mutation.name : name] =
          name === mutation.originalName ? mutation.command : command;
      });
    } else {
      if (!Object.prototype.hasOwnProperty.call(latestScripts, mutation.name)) {
        throw new Error(`"${mutation.name}" has already been removed.`);
      }
      nextScripts = { ...latestScripts };
      delete nextScripts[mutation.name];
    }

    pkg.scripts = nextScripts;
    const updatedContent = serializePackageJson(pkg, content);
    await invoke("write_package_json", { path: packageJsonPath, content: updatedContent });
    setScripts(nextScripts);
    return nextScripts;
  };

  const openAddScript = () => {
    setError(null);
    setDraft({ originalName: null, name: "", command: "" });
  };

  const openEditScript = (name: string) => {
    if ((scriptStatuses[name] || "idle") !== "idle") return;
    setOpenMenu(null);
    setError(null);
    setDraft({ originalName: name, name, command: scripts[name] });
  };

  const saveDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;

    const name = draft.name.trim();
    const command = draft.command.trim();
    if (!name) {
      setError("Give the script a name.");
      return;
    }
    if (/\s/.test(name)) {
      setError("Script names cannot contain spaces.");
      return;
    }
    if (!command) {
      setError("Enter the command this script should run.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (draft.originalName) {
        await persistMutation({
          kind: "edit",
          originalName: draft.originalName,
          name,
          command,
        });
        if (activeScript === draft.originalName) onSelectScript(name);
        setSavedMessage(`Updated ${name}`);
      } else {
        await persistMutation({ kind: "add", name, command });
        onSelectScript(name);
        setSavedMessage(`Added ${name}`);
      }
      setDraft(null);
    } catch (err) {
      setError(`Could not save script: ${String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteScript = async () => {
    if (!deleteCandidate) return;
    const status = scriptStatuses[deleteCandidate] || "idle";
    if (status !== "idle") {
      setError("Stop this script before removing it.");
      setDeleteCandidate(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const removedName = deleteCandidate;
      const nextScripts = await persistMutation({ kind: "delete", name: removedName });
      if (activeScript === removedName) {
        onSelectScript(Object.keys(nextScripts)[0] || null);
      }
      setDeleteCandidate(null);
      setSavedMessage(`Removed ${removedName}`);
    } catch (err) {
      setError(`Could not remove script: ${String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const scriptNames = Object.keys(scripts);

  return (
    <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-800/80 h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800/60 pb-4">
        <Cpu className="w-5 h-5 text-indigo-400" />
        <div>
          <h2 className="text-lg font-bold text-slate-100">Project Scripts</h2>
          <p className="text-[10px] text-slate-500">Saved directly to package.json</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {savedMessage && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400" role="status">
              <Check className="h-3.5 w-3.5" />
              {savedMessage}
            </span>
          )}
          <button
            type="button"
            onClick={openAddScript}
            disabled={!hasPackageJson || isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-all hover:-translate-y-0.5 hover:border-indigo-400/50 hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            title={hasPackageJson ? "Add a package script" : "This project does not have a package.json"}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Script
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded p-3 text-xs text-rose-400 mb-4" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 space-y-2" role="status" aria-label="Loading project scripts">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="skeleton-card flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/30 p-3"
              style={{ animationDelay: `${row * 60}ms` }}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-800" />
              <div className="skeleton-bar h-3 w-24 rounded-full bg-slate-800" />
              <div className="skeleton-bar h-2 flex-1 rounded-full bg-slate-800" />
              <div className="skeleton-bar h-7 w-14 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      ) : scriptNames.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-sm text-center">
          <Settings className="w-8 h-8 text-slate-700 mb-2" />
          <p className="font-semibold text-slate-400">
            {hasPackageJson ? "No package scripts yet" : "No package.json found"}
          </p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            {hasPackageJson
              ? "Create a script here and ProjMan will add it to package.json."
              : "Select a JavaScript project or configure the correct project subdirectory."}
          </p>
          {hasPackageJson && (
            <button
              type="button"
              onClick={openAddScript}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" />
              Create first script
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 select-none">
          {scriptNames.map((name, scriptIndex) => {
            const command = scripts[name];
            const status = scriptStatuses[name] || "idle";
            const isActiveView = activeScript === name;
            const canModify = status === "idle";

            return (
              <div
                key={name}
                onClick={() => {
                  setOpenMenu(null);
                  onSelectScript(name);
                }}
                className={`group relative flex items-center justify-between gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  isActiveView
                    ? "border-indigo-500/80 bg-indigo-950/10 shadow-md shadow-indigo-950/15"
                    : "border-slate-800 bg-slate-950/30 hover:bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="shrink-0 flex h-2.5 w-2.5 relative">
                    {status === "running" ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </>
                    ) : (
                      <span className="inline-flex rounded-full h-2 w-2 bg-slate-800 border border-slate-700" />
                    )}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-bold text-slate-200">
                      {name}
                    </span>
                    <span className="truncate font-mono text-[10px] text-slate-500" title={command}>
                      {command}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                  {status === "idle" ? (
                    <button
                      type="button"
                      onClick={() => onStartScript(name)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-semibold transition-colors shadow shadow-indigo-900/10"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Run
                    </button>
                  ) : status === "running" ? (
                    <button
                      type="button"
                      onClick={() => onStopScript(name)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold transition-colors shadow shadow-rose-900/10"
                    >
                      <Square className="w-3 h-3 fill-white" />
                      Stop
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-slate-500 rounded text-[11px] font-semibold"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Wait
                    </button>
                  )}

                  <div className="relative" data-script-menu>
                    <button
                      type="button"
                      onClick={() => setOpenMenu((current) => current === name ? null : name)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                        openMenu === name
                          ? "border-slate-700 bg-slate-800 text-slate-200"
                          : "border-transparent text-slate-500 hover:border-slate-800 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                      title={`Manage ${name}`}
                      aria-label={`Manage ${name}`}
                      aria-expanded={openMenu === name}
                    >
                      <EllipsisVertical className="h-4 w-4" />
                    </button>

                    {openMenu === name && (
                      <div className={`absolute right-0 z-30 w-40 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 p-1.5 shadow-2xl ${
                        scriptIndex >= scriptNames.length - 2 ? "bottom-10" : "top-10"
                      }`}>
                        <button
                          type="button"
                          onClick={() => openEditScript(name)}
                          disabled={!canModify}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit script
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!canModify) return;
                            setOpenMenu(null);
                            setDeleteCandidate(name);
                          }}
                          disabled={!canModify}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove script
                        </button>
                        {!canModify && (
                          <p className="px-2.5 pb-1 pt-2 text-[9px] leading-relaxed text-slate-500">
                            Stop the script to modify it.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {draft && (
        <div
          className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="script-editor-title"
        >
          <form
            onSubmit={saveDraft}
            className="modal-surface w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 id="script-editor-title" className="text-base font-extrabold text-slate-100">
                  {draft.originalName ? "Edit package script" : "Add package script"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  This change will be written directly to package.json.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                disabled={isSaving}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Close script editor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-300">Script name</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  autoFocus
                  spellCheck={false}
                  placeholder="e.g. dev, test, build:desktop"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-300">Command</span>
                <textarea
                  value={draft.command}
                  onChange={(event) => setDraft({ ...draft, command: event.target.value })}
                  rows={3}
                  spellCheck={false}
                  placeholder="e.g. vite --host 0.0.0.0"
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-sm leading-relaxed text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                disabled={isSaving}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex min-w-28 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {isSaving ? "Saving..." : draft.originalName ? "Save changes" : "Add script"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteCandidate && (
        <div
          className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-script-title"
        >
          <div className="modal-surface w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 id="delete-script-title" className="text-base font-extrabold text-slate-100">
              Remove “{deleteCandidate}”?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              The script entry will be removed from package.json. Its command will no longer be available in ProjMan.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                disabled={isSaving}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                Keep script
              </button>
              <button
                type="button"
                onClick={deleteScript}
                disabled={isSaving}
                className="flex min-w-28 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-rose-500 disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {isSaving ? "Removing..." : "Remove script"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
