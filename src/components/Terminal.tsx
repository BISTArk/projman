import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Terminal as TerminalIcon, Trash2, Copy, ArrowDown, Search } from "lucide-react";

interface ScriptLog {
  line: string;
  isStderr: boolean;
}

interface TerminalProps {
  logs: ScriptLog[];
  onClear: () => void;
}

const cleanAnsi = (text: string) => {
  return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
};

export const Terminal: React.FC<TerminalProps> = memo(({ logs, onClear }) => {
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [logs, autoScroll]);

  // Handle manual scroll to detect if user scrolls up
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // If user is within 30px of bottom, keep auto-scroll on
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
    setAutoScroll(isAtBottom);
  };

  const handleCopy = () => {
    const rawText = logs.map(l => cleanAnsi(l.line)).join("\n");
    navigator.clipboard.writeText(rawText);
  };

  const filteredLogs = useMemo(() => {
    const query = filter.toLowerCase();
    return logs
      .map(log => ({ ...log, cleaned: cleanAnsi(log.line) }))
      .filter(log => log.cleaned.toLowerCase().includes(query));
  }, [logs, filter]);

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

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden font-mono text-sm shadow-inner shadow-black/40">
      {/* Terminal Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-xs uppercase tracking-wider text-slate-300">Terminal Logs</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {filteredLogs.length} lines
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-7 pr-2 py-1 text-xs w-36 sm:w-48 bg-slate-950 border border-slate-800 rounded text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            onClick={handleCopy}
            title="Copy Logs"
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClear}
            title="Clear Terminal"
            className="p-1 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {!autoScroll && (
            <button
              onClick={() => setAutoScroll(true)}
              title="Scroll to bottom"
              className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors animate-bounce"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Screen */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto space-y-1.5 scrollbar-hidden select-text selection:bg-indigo-500/30"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600 italic">
            {filter ? "No matching log lines" : "Terminal output is empty. Run a script to start logging..."}
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            return (
              <div
                key={idx}
                className={`whitespace-pre-wrap break-all leading-relaxed ${
                  log.isStderr ? "text-rose-400 selection:bg-rose-500/20" : "text-slate-300"
                }`}
              >
                {renderLineWithUrls(log.cleaned)}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
});

Terminal.displayName = "Terminal";
