import { useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Code2,
  Download,
  FileKey,
  FolderGit2,
  GitBranch,
  Layers3,
  Moon,
  Play,
  ShieldCheck,
  Sun,
  Terminal,
  Timer,
  Zap,
} from "lucide-react";

type DesktopOS = "windows" | "macos" | "unknown";

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

const GITHUB_REPO_URL = "https://github.com/BISTArk/projman";
const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases/latest`;

const detectDesktopOS = (): DesktopOS => {
  const navigatorWithPlatform = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform = `${navigatorWithPlatform.userAgentData?.platform || ""} ${navigator.platform || ""} ${navigator.userAgent || ""}`.toLowerCase();
  if (platform.includes("mac")) return "macos";
  if (platform.includes("win")) return "windows";
  return "unknown";
};

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reveal}
      initial={reduceMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const featureCards = [
  {
    icon: Terminal,
    index: "01",
    title: "Run every service without the tab sprawl.",
    copy: "ProjMan discovers package scripts across your workspace and keeps every process, log stream, and restart in one place.",
    accent: "orange",
    visual: (
      <div className="feature-terminal" aria-hidden="true">
        <div><span className="terminal-prompt">›</span> npm run dev <span className="terminal-ok">running</span></div>
        <div><span className="terminal-prompt">›</span> cargo watch <span className="terminal-ok">running</span></div>
        <div><span className="terminal-prompt">›</span> pnpm api <span className="terminal-idle">idle</span></div>
      </div>
    ),
  },
  {
    icon: FileKey,
    index: "02",
    title: "Edit environment files with context.",
    copy: "Switch between targets, reveal changes, and manage local configuration without hunting through nested folders.",
    accent: "blue",
    visual: (
      <div className="env-visual" aria-hidden="true">
        <span>API_URL</span><strong>localhost:4100</strong>
        <span>APP_ENV</span><strong>development</strong>
        <span>LOG_LEVEL</span><strong>debug</strong>
      </div>
    ),
  },
  {
    icon: GitBranch,
    index: "03",
    title: "Keep Git close to the work.",
    copy: "Review diffs, stage files, commit, pull, push, and move between branches without breaking your flow.",
    accent: "green",
    visual: (
      <div className="git-visual" aria-hidden="true">
        <div className="git-line"><span className="git-dot git-dot--active" /><strong>feat/workspace</strong><small>now</small></div>
        <div className="git-line"><span className="git-dot" /><span>main</span><small>2h</small></div>
        <div className="git-line"><span className="git-dot" /><span>release/1.5</span><small>1d</small></div>
      </div>
    ),
  },
];

const comparisonRows = [
  { feature: "Workspace overview", terminal: ["None", "Shell by shell"], editor: ["Project scoped", "Editor only"], projman: ["Unified", "Every project in view"] },
  { feature: "Process lifecycle", terminal: ["Manual", "Separate terminals"], editor: ["Basic", "Task runner"], projman: ["Persistent", "Run, stop, and restart"] },
  { feature: "Environment files", terminal: ["Raw editing", "Find the right file"], editor: ["Raw editing", "File by file"], projman: ["Target-aware", "Dedicated environment view"] },
  { feature: "Git workflow", terminal: ["Commands", "Context in your head"], editor: ["Integrated", "Current project"], projman: ["Workspace-wide", "Status, diffs, and sync"] },
  { feature: "Context switching", terminal: ["High", "Tabs and windows"], editor: ["Medium", "Panels and extensions"], projman: ["Low", "One operational layer"] },
];

const faqs = [
  {
    q: "Is ProjMan a code editor?",
    a: "No. ProjMan is a desktop control plane for your local development workspace. It runs alongside VS Code, Cursor, WebStorm, or any editor you already use.",
  },
  {
    q: "Does ProjMan upload my code?",
    a: "No. ProjMan is local-first. Your projects, environment files, terminal output, and Git operations stay on your machine. There is no account or cloud workspace involved.",
  },
  {
    q: "Which operating systems are supported?",
    a: "ProjMan supports Windows 10 or later and macOS 10.13 or later. The universal Mac build works on both Apple Silicon and Intel Macs, and both platforms receive signed automatic updates.",
  },
  {
    q: "Does it work with monorepos?",
    a: "Yes. You can target scripts and environment files inside nested apps or packages while Git stays anchored to the repository root.",
  },
  {
    q: "Which package managers are supported?",
    a: "ProjMan works with npm, pnpm, yarn, Bun, and Cargo commands, and detects the relevant lockfiles in your target paths.",
  },
];

export default function App() {
  const reduceMotion = useReducedMotion();
  const [detectedOS] = useState<DesktopOS>(detectDesktopOS);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [downloadUrls, setDownloadUrls] = useState<Record<"windows" | "macos", string>>({
    windows: GITHUB_RELEASES_URL,
    macos: GITHUB_RELEASES_URL,
  });
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("projman_site_theme");
    const initialTheme = saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    document.documentElement.dataset.theme = initialTheme;
    return initialTheme;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("projman_site_theme", theme);
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("https://api.github.com/repos/BISTArk/projman/releases/latest", {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
        return response.json() as Promise<{ assets?: GitHubReleaseAsset[] }>;
      })
      .then(({ assets = [] }) => {
        const windows = assets.find((asset) => /setup\.exe$/i.test(asset.name));
        const macCandidates = assets.filter((asset) => /\.dmg$/i.test(asset.name));
        const macos = macCandidates.find((asset) => /universal/i.test(asset.name)) || macCandidates[0];
        setDownloadUrls({
          windows: windows?.browser_download_url || GITHUB_RELEASES_URL,
          macos: macos?.browser_download_url || GITHUB_RELEASES_URL,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Could not resolve direct release downloads", error);
      });
    return () => controller.abort();
  }, []);

  const primaryOS: "windows" | "macos" = detectedOS === "macos" ? "macos" : "windows";
  const secondaryOS: "windows" | "macos" = primaryOS === "macos" ? "windows" : "macos";
  const downloadLabel = (os: "windows" | "macos") => os === "macos" ? "Download for Mac" : "Download for Windows";

  const handleThemeToggle = () => {
    const root = document.documentElement;
    const nextTheme = theme === "dark" ? "light" : "dark";
    const applyTheme = () => {
      root.dataset.theme = nextTheme;
      flushSync(() => setTheme(nextTheme));
    };
    const transitionDocument = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };
    if (transitionDocument.startViewTransition && !reduceMotion) {
      transitionDocument.startViewTransition(applyTheme);
    } else {
      applyTheme();
    }
  };

  return (
    <div className="landing-shell">
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />

      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="ProjMan home">
          <span className="brand-mark"><img src="/app-icon.png" alt="" /></span>
          <span className="brand-copy"><strong>ProjMan</strong><small>Local workspace control</small></span>
        </a>

        <div className="nav-links">
          <a href="#product">Product</a>
          <a href="#workflow">Workflow</a>
          <a href="#compare">Compare</a>
          <a href="#faq">FAQ</a>
        </div>

        <div className="nav-actions">
          <button className="icon-button" type="button" onClick={handleThemeToggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a className="nav-github" href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" aria-label="ProjMan on GitHub"><Code2 size={17} /></a>
        </div>
      </nav>

      <main id="top">
        <section className="hero section-shell">
          <div className="hero-copy">
            <motion.div className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="eyebrow-dot" /> Native desktop workspace for developers
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}>
              Your entire local stack.<br /><span>One calm workspace.</span>
            </motion.h1>
            <motion.p className="hero-lede" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}>
              Run services, manage environment files, follow Git changes, and move between projects without rebuilding your workspace from a pile of terminal tabs.
            </motion.p>
            <motion.div className="hero-actions" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.24 }}>
              <a className="button button--primary" href={downloadUrls[primaryOS]} target="_blank" rel="noreferrer">
                <Download size={17} /> {downloadLabel(primaryOS)} <ArrowRight size={16} />
              </a>
              <a className="button button--secondary" href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
                <Code2 size={17} /> View source <ArrowUpRight size={15} />
              </a>
            </motion.div>
            <motion.div className="hero-meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.34 }}>
              <span><ShieldCheck size={15} /> Local-first</span>
              <span><Zap size={15} /> Native performance</span>
              <span><Activity size={15} /> Signed auto-updates</span>
            </motion.div>
          </div>

          <motion.div className="hero-workbench" initial={{ opacity: 0, x: 30, rotate: 1.2 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ duration: 0.85, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}>
            <div className="workbench-aura" aria-hidden="true" />
            <div className="workbench-window">
              <div className="window-bar">
                <div className="window-dots" aria-hidden="true"><span /><span /><span /></div>
                <span>ProjMan · commerce-platform</span>
                <div className="live-badge"><span /> 3 running</div>
              </div>
              <div className="product-shot-wrap">
                <img src="/app-screenshot.png" alt="ProjMan desktop app showing a local development workspace" draggable="false" />
                <div className="shot-sheen" aria-hidden="true" />
              </div>
              <motion.div className="process-card" animate={reduceMotion ? undefined : { y: [0, -7, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                <div className="process-card__head"><span><Play size={11} fill="currentColor" /> ACTIVE PROCESS</span><strong>00:18:42</strong></div>
                <code>web:dev</code>
                <div className="process-track"><motion.span animate={reduceMotion ? undefined : { width: ["35%", "82%", "54%"] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }} /></div>
                <small>localhost:5173 · healthy</small>
              </motion.div>
              <motion.div className="branch-card" animate={reduceMotion ? undefined : { y: [0, 6, 0] }} transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}>
                <GitBranch size={15} /><div><small>CURRENT BRANCH</small><strong>feat/checkout</strong></div><span>+4</span>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section className="signal-strip" aria-label="Product highlights">
          <div className="signal-track">
            {["WINDOWS + MACOS", "TAURI + RUST", "NO ACCOUNT REQUIRED", "WORKS OFFLINE", "SIGNED UPDATES", "LOCAL-FIRST BY DESIGN"].map((item) => (
              <span key={item}><i /> {item}</span>
            ))}
          </div>
        </section>

        <section id="product" className="section-shell section-block">
          <Reveal className="section-heading section-heading--split">
            <div><span className="section-kicker">The product</span><h2>Less tool management.<br />More uninterrupted work.</h2></div>
            <p>ProjMan gives the operational side of local development a dedicated home—without trying to replace your editor or rewrite your workflow.</p>
          </Reveal>

          <div className="feature-grid">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} className={`feature-card feature-card--${feature.accent}`} delay={index * 0.08}>
                  <div className="feature-card__top"><span className="feature-icon"><Icon size={19} /></span><small>{feature.index}</small></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                  {feature.visual}
                </Reveal>
              );
            })}
          </div>
        </section>

        <section id="workflow" className="workflow-section">
          <div className="section-shell workflow-layout">
            <Reveal className="workflow-copy">
              <span className="section-kicker">A single control loop</span>
              <h2>From repository to running app, without losing context.</h2>
              <p>ProjMan keeps the state of your workspace visible while you move through the work.</p>
              <a href="#compare">See how it compares <ArrowRight size={15} /></a>
            </Reveal>
            <Reveal className="workflow-rail" delay={0.12}>
              <div className="rail-line"><motion.span animate={reduceMotion ? undefined : { left: ["2%", "94%"] }} transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }} /></div>
              {[
                [FolderGit2, "01", "Select", "Open a repository"],
                [Layers3, "02", "Configure", "Choose a target"],
                [Play, "03", "Run", "Start the stack"],
                [Terminal, "04", "Observe", "Follow every log"],
              ].map(([Icon, number, title, text]) => {
                const RailIcon = Icon as typeof FolderGit2;
                return (
                  <div className="rail-step" key={number as string}>
                    <div className="rail-node"><RailIcon size={17} /></div>
                    <small>{number as string}</small><strong>{title as string}</strong><span>{text as string}</span>
                  </div>
                );
              })}
            </Reveal>
          </div>
        </section>

        <section className="section-shell product-stage">
          <Reveal className="stage-heading">
            <div><span className="section-kicker">The workspace, in focus</span><h2>Everything important is visible. Nothing important is noisy.</h2></div>
            <div className="stage-stats"><span><strong>&lt;50 MB</strong> typical memory</span><span><strong>0</strong> required accounts</span></div>
          </Reveal>
          <Reveal className="stage-frame" delay={0.1}>
            <div className="stage-topbar"><span><i /> ProjMan Desktop</span><small>Native workspace view</small></div>
            <img src="/app-screenshot.png" alt="ProjMan workspace interface" draggable="false" />
          </Reveal>
        </section>

        <section id="compare" className="compare-section">
          <div className="section-shell">
            <Reveal className="compare-heading">
              <div>
                <span className="section-kicker">A different layer of the stack</span>
                <h2>Your editor writes code.<br />ProjMan runs everything around it.</h2>
              </div>
              <p>Keep the tools you already like. ProjMan gives local operations a dedicated place instead of squeezing them into another terminal tab or editor panel.</p>
            </Reveal>

            <Reveal className="compare-profiles" delay={0.06}>
              <article className="compare-profile">
                <span className="compare-profile__icon"><Terminal size={18} /></span>
                <div><small>TERMINAL</small><strong>Maximum control</strong><p>Powerful and precise, but every process and bit of context stays manual.</p></div>
              </article>
              <article className="compare-profile">
                <span className="compare-profile__icon"><Code2 size={18} /></span>
                <div><small>EDITOR + EXTENSIONS</small><strong>Close to the code</strong><p>Convenient for one project, but operational state competes with editing space.</p></div>
              </article>
              <article className="compare-profile compare-profile--featured">
                <span className="compare-profile__badge">PURPOSE-BUILT</span>
                <span className="compare-profile__icon"><img src="/app-icon.png" alt="" /></span>
                <div><small>PROJMAN</small><strong>A calm control plane</strong><p>One native workspace for projects, processes, environment files, and Git.</p></div>
              </article>
            </Reveal>

            <Reveal className="compare-matrix" delay={0.12}>
              <div className="compare-matrix__header">
                <span>Workflow</span><span>Terminal</span><span>Editor extensions</span><span className="is-projman"><img src="/app-icon.png" alt="" /> ProjMan</span>
              </div>
              {comparisonRows.map((row) => (
                <div className="compare-matrix__row" key={row.feature}>
                  <strong>{row.feature}</strong>
                  <div data-label="Terminal"><b>{row.terminal[0]}</b><small>{row.terminal[1]}</small></div>
                  <div data-label="Editor extensions"><b>{row.editor[0]}</b><small>{row.editor[1]}</small></div>
                  <div data-label="ProjMan" className="is-projman"><b><Check size={13} /> {row.projman[0]}</b><small>{row.projman[1]}</small></div>
                </div>
              ))}
              <div className="compare-matrix__footer"><span>ProjMan complements your editor—it does not replace it.</span><a href={downloadUrls[primaryOS]} target="_blank" rel="noreferrer">Try the dedicated workspace <ArrowRight size={14} /></a></div>
            </Reveal>
          </div>
        </section>

        <section className="section-shell reliability-grid">
          <Reveal className="reliability-card reliability-card--large">
            <span className="section-kicker">Built to stay out of the way</span>
            <h2>Fast at launch.<br />Quiet in the background.</h2>
            <p>A native Rust core keeps the app responsive while projects and processes do the heavy lifting.</p>
            <div className="performance-bars" aria-hidden="true">
              <div><span>ProjMan</span><i><b style={{ width: "13%" }} /></i><strong>&lt;50 MB</strong></div>
              <div><span>Electron tool</span><i><b style={{ width: "78%" }} /></i><strong>800+ MB</strong></div>
            </div>
          </Reveal>
          <Reveal className="reliability-card" delay={0.08}><Timer size={21} /><strong>Open and get to work</strong><p>Your recent projects and workspace state are ready when the app starts.</p></Reveal>
          <Reveal className="reliability-card" delay={0.14}><ShieldCheck size={21} /><strong>Your machine stays yours</strong><p>No telemetry, cloud workspace, subscription, or login required.</p></Reveal>
        </section>

        <section id="faq" className="section-shell faq-section">
          <Reveal className="faq-heading"><span className="section-kicker">Questions, answered</span><h2>The practical details.</h2><p>Everything you need to know before installing ProjMan.</p></Reveal>
          <Reveal className="faq-list" delay={0.08}>
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div className={`faq-item ${isOpen ? "is-open" : ""}`} key={faq.q}>
                  <button type="button" onClick={() => setOpenFaqIndex(isOpen ? null : index)} aria-expanded={isOpen}>
                    <span>{String(index + 1).padStart(2, "0")}</span><strong>{faq.q}</strong><ChevronDown size={17} />
                  </button>
                  <AnimatePresence initial={false}>{isOpen && <motion.div className="faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p>{faq.a}</p></motion.div>}</AnimatePresence>
                </div>
              );
            })}
          </Reveal>
        </section>

        <section className="cta-section section-shell">
          <div className="cta-grid" aria-hidden="true" />
          <Reveal className="cta-content">
            <span className="eyebrow"><span className="eyebrow-dot" /> Available for Windows and macOS</span>
            <h2>Give your local workspace<br />a proper home.</h2>
            <p>Free to download. No account. No subscription.</p>
            <div className="cta-actions">
              <a className="button button--light" href={downloadUrls[primaryOS]} target="_blank" rel="noreferrer"><Download size={17} /> {downloadLabel(primaryOS)} <ArrowRight size={16} /></a>
              <a className="button button--ghost-light" href={downloadUrls[secondaryOS]} target="_blank" rel="noreferrer">{downloadLabel(secondaryOS)}</a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="site-footer">
        <div className="brand"><span className="brand-mark"><img src="/app-icon.png" alt="" /></span><span className="brand-copy"><strong>ProjMan</strong><small>Local workspace control</small></span></div>
        <p>Built for developers who would rather ship than organize terminal tabs.</p>
        <div><a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">GitHub</a><a href={GITHUB_RELEASES_URL} target="_blank" rel="noreferrer">Releases</a><a href="#top">Back to top ↑</a></div>
      </footer>
    </div>
  );
}
