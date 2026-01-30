import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            // Force output to dist-electron/main to match package.json "main"
            outDir: 'dist-electron/main',
            rollupOptions: {
              // Externalize native modules so they aren't bundled
              external: [
                'better-sqlite3',
                'electron-pos-printer',
                'fastify',
                'internal-ip',
                'qrcode',
                'axios',
                'node-machine-id',
                'fs-extra',
                'electron-squirrel-startup'
              ],
            },
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        input: 'electron/preload/index.ts',
        vite: {
          build: {
            // Force output to dist-electron/preload
            outDir: 'dist-electron/preload',
          },
        },
      },
      // Polyfill the Electron and Node.js API for Renderer process.
      renderer: {},
    }),
  ],
})