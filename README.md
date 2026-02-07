

                    
# Easy Bill - Local-First Hotel Billing Software

Easy Bill is a modern, high-performance Desktop POS (Point of Sale) application designed for hotels and restaurants. It follows a "Local-First" architecture, ensuring complete offline functionality with a robust SQLite database, while being future-proofed for mobile connectivity.

Built with **Electron**, **React**, **Vite**, and **TypeScript**.

## 🚀 Features

*   **⚡ Fast Billing**: Keyboard-centric workflow. Search items, adjust quantities, and print bills without touching the mouse.
*   **🍽️ Menu Management**: Manage Categories and Menu Items with ease.
*   **🪑 Modular Table Management**: 
    *   Enable/Disable table management based on business type (Dine-in vs. QSR).
    *   Dynamic addition and deletion of tables.
*   **⚙️ Customizable Settings**: Configure Hotel Name, Address, Printer Name, and Bill Footer.
*   **🖨️ Silent Printing**: Supports thermal printers via ESC/POS commands (currently mocked for development).
*   **📱 Mobile Ready**: Embedded Fastify server to allow future local mobile apps to connect and place orders.
*   **🔒 Secure & Offline**: Data is stored locally in an encrypted SQLite database. Includes a licensing system with an offline grace period.

## 🛠️ Tech Stack

*   **Core**: [Electron](https://www.electronjs.org/) (v33), [React](https://react.dev/) (v18), [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/) (v6)
*   **Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (High-performance synchronous SQLite)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Routing**: [React Router DOM](https://reactrouter.com/) (HashRouter for Electron compatibility)
*   **Local Server**: [Fastify](https://fastify.dev/) (Embedded HTTP server)
*   **Packaging**: [electron-builder](https://www.electron.build/)

## 📂 Project Structure

```text
Easy_Bill/
├── electron/
│   ├── main/
│   │   ├── index.ts            # Main Process Entry (Window creation, IPC setup)
│   │   ├── database/
│   │   │   ├── db.ts           # SQLite connection & Helper functions
│   │   │   └── schema.sql      # Database Schema
│   │   ├── ipc/
│   │   │   └── printing.ts     # Printing Logic (ESC/POS)
│   │   ├── license/
│   │   │   └── validator.ts    # License & Grace Period Logic
│   │   └── server/
│   │       └── api.ts          # Fastify Local Server (Port 3000)
│   └── preload/
│       └── index.ts            # Context Bridge (Secure API exposure)
├── src/                        # Renderer Process (Frontend)
│   ├── components/             # React Components (Billing, Dashboard, Settings)
│   ├── App.tsx                 # Main Layout & Routing
│   ├── main.tsx                # React Entry Point
│   └── index.css               # Tailwind Imports
├── dist/                       # Production Build Output (Executables)
├── package.json
└── vite.config.ts              # Vite & Electron Build Config
```

## ⚙️ Installation & Setup

### Prerequisites
*   **Node.js LTS (v20.x)**: **Mandatory for easy setup.** Using Node v20 ensures that `better-sqlite3` can download a **prebuilt binary**. This avoids the need for manual C++ compilation and Visual Studio dependencies.
    *   [Download Node.js v20.x LTS](https://nodejs.org/en/download)
    *   Verify your version: `node -v`

### Clean Installation

To avoid permission errors and ensure prebuilt binaries are used:

1.  **Close your IDE** (Cursor/VS Code) and any running app instances.
2.  **Run this cleanup command** in PowerShell:
    ```powershell
    Stop-Process -Name node -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force node_modules, dist, dist-electron -ErrorAction SilentlyContinue
    ```
3.  **Install & Rebuild**:
    ```bash
    npm install
    npm run postinstall
    ```

4.  **Run Dev Mode**:
    ```bash
    npm run dev
    ```

### Building for Production

To create a standalone Windows executable (`.exe`):

```bash
npm run build
```

The output files will be in the `dist/` folder.

## ⌨️ Keyboard Shortcuts (Billing Page)

*   **Search**: Auto-focused on load. Type to filter items.
*   **Arrow Up/Down**: Navigate through the menu list.
*   **Enter**: 
    *   If item selected: Open Quantity Popup.
    *   Inside Popup: Confirm Quantity.
    *   If search empty & cart has items: **Print Bill**.
*   **Esc**: Close Quantity Popup.

## 🐛 Troubleshooting

**`better-sqlite3` build errors:**
If npm tries to "rebuild" or "node-gyp" fails, it means you are likely **not** on Node v20 LTS. Prebuilt binaries are only guaranteed for LTS versions. Switch to Node v20 and delete `node_modules` before trying again.

**`EPERM: operation not permitted`:**
A background process is locking files. Close your IDE, run `taskkill /F /IM node.exe /T` in PowerShell, and try again.


**Navigation not working in Build:**
Ensure `HashRouter` is used in `App.tsx` (already configured), as Electron serves files from the local filesystem which doesn't support standard browser history routing.

## 📄 License

Proprietary / Commercial.
