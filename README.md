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

1.  **Clone or Open project**:
    ```bash
    cd c:/Users/Admin/Documents/projman
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
*   **Compile production installer (.exe)**:
    ```bash
    make build
    ```
    *This packages the compiled React bundle, bundles icon resources, compiles the Rust executable, and generates standalone `.msi`/`.exe` installers in `src-tauri/target/release/bundle/`.*
*   **Clean build targets**:
    ```bash
    make clean
    ```
