# ProjMan 📂⚡

**ProjMan** is a premium, lightweight project management dashboard designed for developers to organize local repositories, execute package scripts, inspect Git statuses, manage environmental variables, and run interactive terminals in a unified, beautifully styled workspace.

Built with **Tauri v2**, **React**, **TypeScript**, and **Vite**, ProjMan offers a frameless, desktop-native window wrapper featuring custom window controls, taskbar icons, and a dark, modern interface inspired by the BeeVault design scheme (neon emerald accents over slate-dark backgrounds).

---

## Key Features

### 1. 🗂️ Workspaces & Project Organizer
*   Group multiple directory folders into distinct, customizable workspaces (e.g. *Personal*, *Work*, *Client Projects*).
*   Inline editing for workspace and project names.
*   Persistent storage (`localStorage` and native Tauri bindings) keeps workspaces configured across restarts.

### 2. ⚙️ Script Runner & Monitor
*   Automatically parses `package.json` configurations in imported projects.
*   Renders scripts (e.g., `dev`, `build`, `test`) as clean, horizontal action items.
*   Streams terminal outputs in real-time with an integrated log console featuring search filters and copy utilities.

### 3. 🛡️ Env Variable Editor
*   Inspects, edits, and writes environment keys dynamically from `.env` files in project roots.
*   Provides a clean dashboard interface to modify configurations without opening code editors.

### 4. 🌿 Local Git Suite & GitHub Link
*   View active branches (both local and remote) in a grouped, searchable selection dropdown.
*   List modified file counts, stage/unstage lines, view color-coded syntax diff blocks, and commit updates.
*   Execute background pull and push sync operations.
*   Dynamic **GitHub Button** detects upstream origin configs and opens repositories directly in your default browser using `Ctrl+Click`.

### 5. 💻 Interactive Project Terminal
*   Launches native cmd terminal sessions directly inside the target project directory.
*   Supports full CLI operations (`npm install`, testing, git configs).
*   Maintains scroll locks and command history (using **Arrow Up/Down** navigation).
*   **Ctrl+Clickable URLs**: Any printed local addresses (like `http://localhost:5173`) are highlighted and opened in default browsers on click.

### 6. 📂 Subdirectory Projects
*   Supports monorepos and subfolder structures.
*   Optional **Project Subdirectory** parameter isolates script runners, terminals, and `.env` editing to subfolders (e.g. `frontend/`), while keeping Git tracking anchored to the parent Git root.

### 7. 🏷️ Framework Auto-Detection
*   Analyzes package structures to automatically classify and assign custom vector icons to:
    *   **Next.js** (N Circular badge)
    *   **React** (animated neon-blue spinning atom)
    *   **Vue.js** (emerald green shield)
    *   **Svelte** (orange loop)
    *   **Express** (amber server rack api symbol)
    *   **Tauri** (yellow Taurus crest)
    *   **Node.js / Generic** (green cube / folder)

---

## Technologies Used

*   **Frontend**: React (v19), TypeScript, Tailwind CSS (v4), Lucide Icons.
*   **Backend**: Rust (Tauri v2 core).
*   **Native Plugins**: `@tauri-apps/plugin-opener` (default browser integration).
*   **Build System**: Vite (v7), Cargo.

---

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [Rust](https://www.rust-lang.org/) (Cargo and compiler toolchain)

### Setup & Run

1.  **Clone or open the project**:
    ```bash
    cd /path/to/projman
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start Development Mode**:
    ```bash
    npm run tauri dev
    ```

---

## Build and Distribution (Automated Workflows)

ProjMan includes a `Makefile` to streamline common compilation tasks:

*   **Install dependencies**:
    ```bash
    make install
    ```
*   **Run dev build**:
    ```bash
    make dev
    ```
*   **Compile production installers for the current OS**:
    ```bash
    make build
    ```
    *On Windows this creates `.msi`/`.exe` installers. On macOS this creates an app bundle and `.dmg` under `src-tauri/target/release/bundle/`.*
*   **Compile only the macOS app and DMG**:
    ```bash
    make build-macos
    ```
*   **Clean build targets**:
    ```bash
    make clean
    ```

## Cross-platform releases and automatic updates

ProjMan releases can be assembled manually without paid CI runners. Keep `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` aligned with the release tag, then publish:

* Windows x64 NSIS (`.exe`) and MSI installers.
* A universal macOS app and `.dmg` for Apple Silicon and Intel Macs.
* Signed updater archives and one `update.json` manifest covering both operating systems.
* The same manifest at `docs/update.json`, which keeps existing ProjMan installations on the shared update channel.

The private key in `.secrets/projman.key` must match the updater public key in `src-tauri/tauri.conf.json`; changing it would prevent existing installations from accepting new updates. `.secrets/` is ignored by Git and must never be committed.

On the Windows release machine, pull the tag and run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\release-windows.ps1
```

The script prompts securely for the updater-key password, creates signed NSIS/MSI updater artifacts, clears the signing environment, and uploads the four Windows files to the existing draft GitHub release. macOS artifacts are built with `src-tauri/tauri.release.conf.json` on a Mac and uploaded to the same draft. Publish the draft only after `update.json` contains both `windows-x86_64` and the two macOS architecture entries.

For a macOS build that opens without Gatekeeper warnings, configure Apple Developer signing and notarization credentials in the local build environment. Without those credentials, the ad-hoc-signed DMG may need one-time approval in macOS Privacy & Security.

The landing page is built from `promo-site/` directly into `docs/`, the GitHub Pages source. It detects macOS or Windows in the browser, puts the matching download first, and resolves the actual installer asset from the latest GitHub release.
