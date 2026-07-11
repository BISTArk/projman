import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Download, 
  ArrowRight, 
  Check
} from "lucide-react";

// Inline Github Icon SVG
const GitHubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function App() {
  const GITHUB_REPO_URL = "https://github.com/BISTArk/projman";
  const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases/tag/v1.0.0`;
  const DOWNLOAD_MSI_URL = `${GITHUB_REPO_URL}/releases/download/v1.0.0/ProjMan_0.1.0_x64_en-US.msi`;
  const DOWNLOAD_EXE_URL = `${GITHUB_REPO_URL}/releases/download/v1.0.0/ProjMan_0.1.0_x64-setup.exe`;

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // FAQ states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#030406] text-slate-200 overflow-x-hidden selection:bg-emerald-500/20 relative">
      
      {/* Ambient Gradient Background Glows */}
      <div className="absolute top-0 inset-x-0 h-[1000px] grid-bg pointer-events-none opacity-60 z-0" />
      <div className="absolute top-[80px] left-[15%] w-[45%] h-[350px] glow-ambient-green rounded-full pointer-events-none opacity-40 blur-[120px] z-0" />
      <div className="absolute top-[200px] right-[10%] w-[40%] h-[350px] glow-ambient-blue rounded-full pointer-events-none opacity-30 blur-[100px] z-0" />

      {/* Floating toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0c0f16] border border-emerald-500/30 text-slate-100 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 text-xs font-semibold"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER / NAVIGATION */}
      <nav className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-slate-900 bg-[#030406]/70 backdrop-blur-md sticky top-0 z-40 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center shadow-lg shadow-black/25">
            <svg className="w-4.5 h-4.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent block">
              PROJMAN
            </span>
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-widest block -mt-1">
              Workspace Hub
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          <a href="#demo" className="hover:text-slate-200 transition-colors">Workspace View</a>
          <a href="#comparison" className="hover:text-slate-200 transition-colors">Comparison</a>
        </div>

        <div className="flex items-center gap-3.5">
          <a 
            href={GITHUB_REPO_URL}
            target="_blank"
            className="p-2 hover:bg-slate-900 border border-transparent hover:border-slate-850 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
            title="GitHub Repository"
          >
            <GitHubIcon className="w-4 h-4" />
          </a>
          <a 
            href={DOWNLOAD_MSI_URL}
            className="btn-primary inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-extrabold gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download v1.0.0</span>
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="px-6 py-20 md:py-28 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10 select-none">
        
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 tracking-wider uppercase mb-6"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          Local Development Command Center
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-100 tracking-tight leading-tight max-w-5xl font-display"
        >
          Stop Juggling Terminal Windows.<br />
          <span className="text-gradient-emerald">Take Control of Your Local Workspace.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-sm md:text-base lg:text-lg text-slate-400 max-w-2xl leading-relaxed font-sans"
        >
          ProjMan turns scattered repositories, terminal consoles, package scripts, environment files, and Git operations into a single, high-performance desktop workspace designed for modern developers.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center w-full"
        >
          <a 
            href={DOWNLOAD_EXE_URL}
            className="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 group"
          >
            <Download className="w-4 h-4" />
            <span>Download .exe Setup</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a 
            href={DOWNLOAD_MSI_URL}
            className="btn-secondary w-full sm:w-auto px-6 py-3.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download .msi Installer</span>
          </a>
        </motion.div>

        {/* Small trust badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center items-center gap-6 text-[10px] uppercase font-bold tracking-widest text-slate-500"
        >
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Native desktop app</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Powered by Tauri & Rust</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> 100% Local-first</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Works completely offline</span>
        </motion.div>
      </section>

      {/* HERO VISUAL / ACTUAL APPLICATION SCREENSHOT */}
      <section id="demo" className="px-6 pb-24 max-w-6xl mx-auto z-10 relative select-none">
        
        <div className="text-center mb-10 max-w-xl mx-auto">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 block mb-2">Native Workspace View</span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-200">The actual desktop app interface in action</h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full rounded-xl border border-slate-800 bg-[#07090e]/90 p-1.5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 rounded-xl pointer-events-none -z-10" />

          {/* Desktop Frameless Window Frame */}
          <div className="bg-[#030406] rounded-lg overflow-hidden border border-slate-850 flex flex-col">
            {/* Native window header */}
            <div className="h-10 border-b border-slate-900 flex items-center justify-between px-4 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-[10px] text-slate-600 font-mono ml-4">ProjMan Local Dashboard</span>
              </div>
              <div className="flex gap-4">
                <div className="w-3.5 h-3.5 border border-slate-800 rounded bg-slate-950 flex items-center justify-center text-slate-600 text-[9px]">-</div>
                <div className="w-3.5 h-3.5 border border-slate-800 rounded bg-slate-950 flex items-center justify-center text-slate-600 text-[9px]">□</div>
                <div className="w-3.5 h-3.5 border border-slate-800 rounded bg-slate-950 flex items-center justify-center text-slate-600 text-[9px]">×</div>
              </div>
            </div>

            {/* Actual Screenshot Image */}
            <img 
              src="/app-screenshot.png" 
              alt="ProjMan Desktop Application Screenshot" 
              className="w-full h-auto object-cover select-none"
              draggable="false"
            />
          </div>
        </motion.div>
      </section>



      {/* PROBLEM / FRUSTRATIONS GRID */}
      <section className="px-6 py-20 md:py-28 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-500 block mb-2">Development Friction</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 font-display">
            Developers spend more time managing their tools than their code.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#080a0f] border border-slate-900 p-6 rounded-xl border-glow-hover space-y-3">
            <h3 className="text-sm font-bold text-slate-200">Endless Terminal Tabs</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Juggling multiple terminals for mock servers, client dev servers, api compilers, and databases.
            </p>
          </div>

          <div className="bg-[#080a0f] border border-slate-900 p-6 rounded-xl border-glow-hover space-y-3">
            <h3 className="text-sm font-bold text-slate-200">Forgotten Environment Keys</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Forgetting to pull or update local `.env` variables and spending an hour debugging connection states.
            </p>
          </div>

          <div className="bg-[#080a0f] border border-slate-900 p-6 rounded-xl border-glow-hover space-y-3">
            <h3 className="text-sm font-bold text-slate-200">Git scattered everywhere</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Moving outside your active editor to commit updates, resolve simple merges, or switch local branches.
            </p>
          </div>

          <div className="bg-[#080a0f] border border-slate-900 p-6 rounded-xl border-glow-hover space-y-3">
            <h3 className="text-sm font-bold text-slate-200">Monorepo Complexity</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Searching nested workspaces to run isolated commands or check script files hidden in directories.
            </p>
          </div>
        </div>
      </section>

      {/* PIPELINE / WORKFLOW MAP */}
      <section className="px-6 py-16 bg-slate-950/20 border-t border-b border-slate-900 z-10 relative select-none">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 block mb-2">Automated Pipeline</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-200 font-display mb-10">Meet your Local Development Command Center</h2>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-3">
            <div className="bg-[#0c0f16] border border-slate-850 px-5 py-3 rounded-lg text-xs font-semibold font-mono w-44">Repository</div>
            <div className="hidden md:block text-slate-650 text-base">→</div>
            <div className="bg-[#0c0f16] border border-slate-850 px-5 py-3 rounded-lg text-xs font-semibold font-mono w-44">Workspace</div>
            <div className="hidden md:block text-slate-650 text-base">→</div>
            <div className="bg-[#0c0f16] border border-slate-850 px-5 py-3 rounded-lg text-xs font-semibold font-mono w-44">Scripts Runner</div>
            <div className="hidden md:block text-slate-650 text-base">→</div>
            <div className="bg-[#0c0f16] border border-slate-850 px-5 py-3 rounded-lg text-xs font-semibold font-mono w-44">Terminal Log</div>
            <div className="hidden md:block text-slate-650 text-base">→</div>
            <div className="bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 px-5 py-3 rounded-lg text-xs font-bold font-mono w-44">Ship App</div>
          </div>
        </div>
      </section>



      {/* COMPARISON WORKFLOW TABLE */}
      <section id="comparison" className="px-6 py-20 bg-[#030406] border-t border-slate-900 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 block mb-2">Product Comparisons</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 font-display">
              Built specifically to simplify local developer workflows
            </h2>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-900 bg-[#07090e] text-slate-400 uppercase tracking-widest text-[9px] font-extrabold">
                  <th className="p-4">Feature Set</th>
                  <th className="p-4">Traditional CLI</th>
                  <th className="p-4">VS Code + Extensions</th>
                  <th className="p-4 text-emerald-400">ProjMan Desktop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                <tr>
                  <td className="p-4 font-bold text-slate-200">Project Organization</td>
                  <td className="p-4 text-slate-500">Folder list navigation</td>
                  <td className="p-4 text-slate-400">Workspace files setup</td>
                  <td className="p-4 text-emerald-400 font-bold">Isolated workspaces config</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-200">Package Scripts</td>
                  <td className="p-4 text-slate-500">Manual search inside file</td>
                  <td className="p-4 text-slate-400">Extension layout selector</td>
                  <td className="p-4 text-emerald-400 font-bold">Auto-scanned action deck</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-200">Git integration</td>
                  <td className="p-4 text-slate-500">Command prompts</td>
                  <td className="p-4 text-slate-400">Basic sidebar status logs</td>
                  <td className="p-4 text-emerald-400 font-bold">Staging, committing, diff viewer</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-200">Environment files (.env)</td>
                  <td className="p-4 text-slate-500">Manual text line edits</td>
                  <td className="p-4 text-slate-400">Text block modification</td>
                  <td className="p-4 text-emerald-400 font-bold">Visual Dashboard UI</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-200">Memory usage</td>
                  <td className="p-4 text-slate-500">&lt; 10MB (shell)</td>
                  <td className="p-4 text-slate-500">&gt; 800MB (Electron backend)</td>
                  <td className="p-4 text-emerald-400 font-bold">&lt; 50MB (Tauri & Rust native)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-200">URL detection</td>
                  <td className="p-4 text-slate-500">Plain console line print</td>
                  <td className="p-4 text-slate-400">Ctrl+Click standard file links</td>
                  <td className="p-4 text-emerald-400 font-bold">Interactive URL links</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* DETAILED WORKSPACE STATISTICS */}
      <section className="px-6 py-20 max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-5 space-y-5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 block">Workspace Metrics</span>
            <h2 className="text-3xl font-black text-slate-100 font-display">Example Workspace Overview</h2>
            <p className="text-xs md:text-sm text-slate-450 leading-relaxed">
              When launching a workspace, ProjMan loads statistics across all project targets. Check running tasks, env changes, or commits in one quick overview before writing code.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2 font-mono">
              <div className="bg-[#080a0f] border border-slate-900 p-3 rounded-lg">
                <span className="text-[9px] text-slate-500 block">RUNNING PROCESSES</span>
                <span className="text-lg font-bold text-slate-200 mt-1">12 active</span>
              </div>
              <div className="bg-[#080a0f] border border-slate-900 p-3 rounded-lg">
                <span className="text-[9px] text-slate-500 block">ACTIVE BRANCHES</span>
                <span className="text-lg font-bold text-slate-200 mt-1">5 branches</span>
              </div>
              <div className="bg-[#080a0f] border border-slate-900 p-3 rounded-lg">
                <span className="text-[9px] text-slate-500 block">PENDING COMMITS</span>
                <span className="text-lg font-bold text-slate-200 mt-1">2 commits</span>
              </div>
              <div className="bg-[#080a0f] border border-slate-900 p-3 rounded-lg">
                <span className="text-[9px] text-slate-500 block">MODIFIED ENV FILES</span>
                <span className="text-lg font-bold text-slate-200 mt-1">3 env files</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#0c0f16] border border-slate-850 p-6 rounded-xl shadow-2xl relative select-none">
            <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">Active stats</div>
            <h3 className="text-xs uppercase font-extrabold text-slate-400 mb-4 tracking-wider">PROJECT LIST DECK</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-900 rounded-lg">
                <span className="font-bold text-slate-200">api-gateway</span>
                <span className="text-[10px] text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-950/20 border border-emerald-900/30">Healthy (2 running)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-900 rounded-lg">
                <span className="font-bold text-slate-200">frontend-app</span>
                <span className="text-[10px] text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-950/20 border border-indigo-900/30">Idle (1 changed env)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-900 rounded-lg">
                <span className="font-bold text-slate-200">mobile-client</span>
                <span className="text-[10px] text-amber-500 px-2.5 py-0.5 rounded-full bg-amber-950/20 border border-amber-900/30">Modified (+3 staging files)</span>
              </div>
            </div>
          </div>

        </div>
      </section>



      {/* ACCORDION FAQ SECTION */}
      <section className="px-6 py-20 max-w-3xl mx-auto z-10 relative">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 block mb-2">FAQ Reference</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 font-display">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3.5">
          {[
            {
              q: "How does ProjMan compare to VS Code?",
              a: "ProjMan is not a code editor. It is a desktop workspace controller. It runs alongside your IDE (VS Code, Cursor, WebStorm) to handle background script compilation, environment variables config, Git tracking, and local folders switcher in a unified panel."
            },
            {
              q: "Does ProjMan upload my code anywhere?",
              a: "No. ProjMan has a 100% local-first architecture. It runs native system bindings using Tauri and stores data on your disk. No telemetry, subscriptions, or login credentials are required."
            },
            {
              q: "Does it support monorepos?",
              a: "Yes. ProjMan handles Turborepo, Nx, and package directory subfolders natively. You can target scripts or `.env` parameters to a subdirectory (like `apps/web`) while Git anchors automatically to the workspace root repository."
            },
            {
              q: "Can I use multiple terminals?",
              a: "Yes. ProjMan spawns isolated processes for running scripts and has a dedicated Interactive Terminal tab for executing manual CLI routines inside the active workspace directory."
            },
            {
              q: "What package managers are supported?",
              a: "ProjMan supports npm, pnpm, yarn, bun, and cargo/rust commands natively. It automatically detects lockfiles in target paths to execute processes."
            }
          ].map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={index} className="bg-[#080a0f] border border-slate-900 rounded-lg overflow-hidden transition-colors">
                <button 
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-bold text-slate-200 focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-500 font-mono text-[14px]">{isOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-4 text-xs text-slate-450 leading-relaxed border-t border-slate-900/50 pt-2"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="px-6 py-24 text-center z-10 relative bg-gradient-to-t from-slate-950/40 to-transparent border-t border-slate-900">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-5xl font-black text-slate-100 font-display">
            Your code deserves a better workspace.
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Stop juggling terminal windows and context switching. Start building your next application in a unified desktop workspace.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href={DOWNLOAD_EXE_URL}
              className="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download .exe Setup</span>
            </a>
            <a 
              href={DOWNLOAD_MSI_URL}
              className="btn-secondary w-full sm:w-auto px-6 py-3.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download .msi Installer</span>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-8 text-center text-xs text-slate-600 z-10 relative select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-semibold text-[9px] tracking-widest uppercase">PROJMAN © 2026 — LOCAL DEVELOPMENT COMMAND CENTER</span>
          <div className="flex gap-6 font-semibold uppercase tracking-wider text-[9px]">
            <a href={GITHUB_REPO_URL} target="_blank" className="hover:text-slate-400 transition-colors">GitHub</a>
            <a href={GITHUB_RELEASES_URL} target="_blank" className="hover:text-slate-400 transition-colors">Releases</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Documentation</a>
            <button onClick={() => triggerToast("Community server launch soon!")} className="hover:text-slate-400 transition-colors">Discord</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
