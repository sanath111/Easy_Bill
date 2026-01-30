# Easy_Bill - Local-First Hotel Billing Software

## 1. Project Structure

```text
Easy_Bill/
├── electron/
│   ├── main/
│   │   ├── index.ts            # Entry point for Electron Main Process
│   │   ├── database/
│   │   │   ├── db.ts           # Database connection (better-sqlite3)
│   │   │   └── schema.sql      # SQL Schema
│   │   ├── ipc/
│   │   │   └── printing.ts     # IPC handlers for printing
│   │   ├── license/
│   │   │   └── validator.ts    # License check logic
│   │   └── server/
│   │       └── api.ts          # Fastify server for local mobile connection
│   └── preload/
│       └── index.ts            # Preload script (IPC Bridge)
├── src/                        # Renderer Process (React + Vite)
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 2. Core Dependencies

### SQLite Connectivity
*   `better-sqlite3`: Fastest SQLite driver for Node.js, synchronous (good for local desktop apps).
*   `kysely` or `drizzle-orm`: Lightweight SQL query builders/ORMs (optional but recommended over raw SQL).

### Silent Printing
*   `electron-pos-printer`: Easy wrapper for thermal printers (supports HTML/CSS to image/PDF).
*   OR `escpos` + `escpos-usb` / `escpos-network`: For raw ESC/POS command control (more robust for specific hardware).

### License Key Validation
*   `node-machine-id`: To generate a unique device fingerprint.
*   `axios`: For checking against the remote verification server.
*   `jsonwebtoken`: If using JWTs for offline license tokens.

### Electron-to-React Communication
*   Built-in `ipcMain` and `ipcRenderer`.

### Local Server
*   `fastify`: Low overhead web framework.
*   `qrcode`: To generate QR codes for the local IP.

## 4. Network Strategy for Mobile

To allow a mobile app to connect:
1.  **Internal Server**: Start a `fastify` server inside the Electron Main process on a specific port (e.g., 3000).
2.  **Discovery**: Use `internal-ip` package to find the desktop's LAN IP address.
3.  **Pairing**: Generate a QR code in the React UI containing `http://<LAN_IP>:3000`. The mobile app scans this to know where to connect.
4.  **Security**: Implement a simple pairing token or PIN displayed on the desktop that must be entered on the mobile app to authorize the connection.

## 5. Implementation Roadmap

1.  **Setup**: `npm init`, install Electron, Vite, React. Configure `vite-plugin-electron`.
2.  **Database**: Set up `better-sqlite3`. Create `schema.sql` and run migrations on startup.
3.  **IPC Bridge**: Configure `preload.ts` to expose safe APIs (e.g., `window.api.printBill`).
4.  **Printing**: Implement the `printBill` handler in Main process using `escpos` or `electron-pos-printer`. Test with a dummy printer or console output.
5.  **UI**: Build the POS interface in React. Connect it to the database via IPC.
6.  **Licensing**: Implement the startup check. Store license status in a secure local file or encrypted DB field.
7.  **Mobile Sync**: Add the Fastify server and QR code generation.
