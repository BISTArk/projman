import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Save, Plus, Trash2, Eye, EyeOff, Search, AlertCircle, FileText, Check } from "lucide-react";

interface EnvVar {
  key: string;
  value: string;
  isNew?: boolean;
}

interface EnvEditorProps {
  projectPath: string;
  projectId: string;
}

const COMMON_ENV_FILES = [".env", ".env.local", ".env.development", ".env.production", ".env.example"];

export const EnvEditor: React.FC<EnvEditorProps> = ({ projectPath, projectId }) => {
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available env files
  const scanEnvFiles = async () => {
    try {
      const found: string[] = [];
      for (const file of COMMON_ENV_FILES) {
        const fullPath = `${projectPath}/${file}`.replace(/\\/g, "/");
        const exists = await invoke<boolean>("file_exists", { path: fullPath });
        if (exists) {
          found.push(file);
        }
      }
      setAvailableFiles(found);
      
      // Default selection logic
      if (found.length > 0) {
        if (found.includes(".env")) {
          setSelectedFile(".env");
        } else {
          setSelectedFile(found[0]);
        }
      } else {
        setSelectedFile("");
        setEnvVars([]);
      }
    } catch (err: any) {
      setError(`Failed to scan directory: ${err}`);
    }
  };

  useEffect(() => {
    scanEnvFiles();
    setIsSaved(false);
    setError(null);
  }, [projectPath, projectId]);

  // Load variables when selected file changes
  useEffect(() => {
    if (!selectedFile) return;
    loadEnvFile(selectedFile);
  }, [selectedFile, projectPath]);

  const loadEnvFile = async (fileName: string) => {
    try {
      setError(null);
      setIsSaved(false);
      const fullPath = `${projectPath}/${fileName}`.replace(/\\/g, "/");
      const content = await invoke<string>("read_file", { path: fullPath });
      
      // Parse file
      const lines = content.split(/\r?\n/);
      const parsedVars: EnvVar[] = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        
        const key = trimmed.substring(0, eqIdx).trim();
        let value = trimmed.substring(eqIdx + 1).trim();
        
        // Remove outer quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.substring(1, value.length - 1);
        }
        
        parsedVars.push({ key, value });
      }
      
      setEnvVars(parsedVars);
    } catch (err: any) {
      setError(`Failed to read ${fileName}: ${err}`);
    }
  };

  const handleCreateFromExample = async () => {
    try {
      setError(null);
      const examplePath = `${projectPath}/.env.example`.replace(/\\/g, "/");
      const envPath = `${projectPath}/.env`.replace(/\\/g, "/");
      
      const content = await invoke<string>("read_file", { path: examplePath });
      await invoke("write_env_file", { path: envPath, content });
      
      await scanEnvFiles();
      setSelectedFile(".env");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setError(`Failed to create .env file: ${err}`);
    }
  };

  const handleCreateEmptyEnv = async () => {
    try {
      setError(null);
      const envPath = `${projectPath}/.env`.replace(/\\/g, "/");
      await invoke("write_env_file", { path: envPath, content: "# Created by ProjMan\n" });
      
      await scanEnvFiles();
      setSelectedFile(".env");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setError(`Failed to create .env file: ${err}`);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    try {
      setError(null);
      const fullPath = `${projectPath}/${selectedFile}`.replace(/\\/g, "/");
      
      // Construct env content
      const content = envVars
        .map(v => `${v.key}=${v.value}`)
        .join("\n") + "\n";
      
      await invoke("write_env_file", { path: fullPath, content });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      
      // Refresh
      loadEnvFile(selectedFile);
    } catch (err: any) {
      setError(`Failed to save: ${err}`);
    }
  };

  const handleAddVar = () => {
    setEnvVars([...envVars, { key: "", value: "", isNew: true }]);
  };

  const handleUpdateKey = (index: number, newKey: string) => {
    const updated = [...envVars];
    updated[index].key = newKey.replace(/\s+/g, "_").toUpperCase();
    setEnvVars(updated);
  };

  const handleUpdateValue = (index: number, newValue: string) => {
    const updated = [...envVars];
    updated[index].value = newValue;
    setEnvVars(updated);
  };

  const handleDeleteVar = (index: number) => {
    const updated = [...envVars];
    updated.splice(index, 1);
    setEnvVars(updated);
  };

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredVars = envVars.filter(
    v => v.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
         v.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/40 p-6 rounded-xl border border-slate-800/80">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Environment Variables
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage local config files. Unsaved changes will remain local in UI until saved.
          </p>
        </div>
        
        {availableFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {/* File Selector */}
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              {availableFiles.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <button
              onClick={handleAddVar}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-slate-700 rounded text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Variable
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-semibold text-white transition-all shadow-md ${
                isSaved 
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20" 
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/20"
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 mb-6 text-sm text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {availableFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
          <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-slate-300 font-bold mb-1">No Environment Files Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-6">
            We searched for common files like .env or .env.local in this project root but couldn't find any.
          </p>
          <div className="flex gap-4">
            {availableFiles.length === 0 && (
              <>
                {/* Check if example exists */}
                {availableFiles.includes(".env.example") || (
                  <button
                    onClick={handleCreateEmptyEnv}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-semibold shadow transition-colors"
                  >
                    Create Empty .env
                  </button>
                )}
                
                {/* Fallback to clone example */}
                <button
                  onClick={async () => {
                    const examplePath = `${projectPath}/.env.example`.replace(/\\/g, "/");
                    const exists = await invoke<boolean>("file_exists", { path: examplePath });
                    if (exists) {
                      handleCreateFromExample();
                    } else {
                      handleCreateEmptyEnv();
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-sm font-semibold transition-colors"
                >
                  Create from .env.example
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search filter */}
          <div className="relative flex items-center mb-4">
            <Search className="absolute left-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search variables by key or value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Grid Headers */}
          <div className="grid grid-cols-[2fr_3fr_40px] gap-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-950/40 rounded-t-lg border-x border-t border-slate-800/60">
            <div>Key</div>
            <div>Value</div>
            <div className="text-center">Actions</div>
          </div>

          {/* Variables Table */}
          <div className="flex-1 overflow-y-auto border border-slate-800/60 bg-slate-950/10 rounded-b-lg p-2 space-y-2">
            {filteredVars.length === 0 ? (
              <div className="text-center py-12 text-slate-500 italic text-sm">
                {searchQuery ? "No matching variables" : "No variables in this file. Click 'Add Variable' to create one."}
              </div>
            ) : (
              filteredVars.map((v, idx) => {
                const uniqueKey = `${v.key}-${idx}`;
                const isMasked = !visibleKeys[uniqueKey];
                return (
                  <div key={idx} className="grid grid-cols-[2fr_3fr_40px] gap-4 items-center bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/40 rounded px-3 py-1.5 transition-colors">
                    {/* Key Input */}
                    <div>
                      <input
                        type="text"
                        value={v.key}
                        disabled={!v.isNew}
                        onChange={(e) => handleUpdateKey(idx, e.target.value)}
                        placeholder="API_URL"
                        className={`w-full font-mono text-sm px-2 py-1 bg-slate-950 border rounded focus:outline-none focus:border-indigo-500 ${
                          v.isNew 
                            ? "border-indigo-500/40 text-indigo-300" 
                            : "border-transparent text-indigo-400 font-semibold"
                        }`}
                      />
                    </div>

                    {/* Value Input + Mask */}
                    <div className="relative flex items-center">
                      <input
                        type={isMasked ? "password" : "text"}
                        value={v.value}
                        onChange={(e) => handleUpdateValue(idx, e.target.value)}
                        placeholder="value"
                        className="w-full font-mono text-sm px-2 py-1 pr-9 bg-slate-950 border border-transparent hover:border-slate-800 focus:border-indigo-500 rounded text-slate-300 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility(uniqueKey)}
                        className="absolute right-2 text-slate-500 hover:text-slate-300 p-0.5"
                      >
                        {isMasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleDeleteVar(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
