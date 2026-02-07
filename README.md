

                    
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
*   **Node.js**: v18 or higher (v20+ recommended).
*   **Windows Build Tools**: Required for compiling `better-sqlite3`.
    *   Run as Administrator: `npm install --global --production windows-build-tools`
    *   OR ensure "Desktop development with C++" is installed via Visual Studio Installer.

### Development

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/Easy_Bill.git
    cd Easy_Bill
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Rebuild Native Modules** (Important for SQLite)
    ```bash
    npm run postinstall
    ```

4.  **Run in Development Mode**
    ```bash
    npm run dev
    ```

### Building for Production

To create a standalone Windows executable (`.exe`):

```bash
npm run build
```

The output files (Installer and Portable EXE) will be located in the `dist/` folder.

## ⌨️ Keyboard Shortcuts (Billing Page)

*   **Search**: Auto-focused on load. Type to filter items.
*   **Arrow Up/Down**: Navigate through the menu list.
*   **Enter**: 
    *   If item selected: Open Quantity Popup.
    *   Inside Popup: Confirm Quantity.
    *   If search empty & cart has items: **Print Bill**.
*   **Esc**: Close Quantity Popup.

## 🐛 Troubleshooting

**`better-sqlite3` / `node-gyp` errors:**
If you see errors related to `distutils` or `msvs_version`, ensure you have Python installed and the Visual Studio Build Tools are correctly set up. You may need to run:
`npm config set msvs_version 2022` (or your VS version).

**Navigation not working in Build:**
Ensure `HashRouter` is used in `App.tsx` (already configured), as Electron serves files from the local filesystem which doesn't support standard browser history routing.

## 📄 License

Proprietary / Commercial.
