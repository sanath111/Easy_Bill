import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { 
  initDatabase, 
  getTables, 
  addTable, 
  deleteTable, 
  getCategories, 
  addCategory, 
  deleteCategory, 
  getMenuItems, 
  addMenuItem, 
  deleteMenuItem, 
  getSettings, 
  saveSettings, 
  createOrder
} from './database/db';
import { setupPrintingHandlers } from './ipc/printing';
import { checkLicense } from './license/validator';
import { startLocalServer } from './server/api';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until maximized
    webPreferences: {
      preload: path.join(__dirname, '../../dist-electron/preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Maximize the window
  mainWindow.maximize();
  mainWindow.show();

  // Remove the top menu
  mainWindow.setMenu(null);

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // 1. Initialize Database
  initDatabase();

  // 2. Check License
  const licenseStatus = await checkLicense();
  console.log('License Status:', licenseStatus);

  // 3. Setup IPC Handlers
  setupPrintingHandlers();

  // Database IPC
  ipcMain.handle('db:get-tables', () => getTables());
  ipcMain.handle('db:add-table', (_, table) => addTable(table));
  ipcMain.handle('db:delete-table', (_, id) => deleteTable(id));

  ipcMain.handle('db:get-categories', () => getCategories());
  ipcMain.handle('db:add-category', (_, name) => addCategory(name));
  ipcMain.handle('db:delete-category', (_, id) => deleteCategory(id));

  ipcMain.handle('db:get-menu-items', () => getMenuItems());
  ipcMain.handle('db:add-menu-item', (_, item) => addMenuItem(item));
  ipcMain.handle('db:delete-menu-item', (_, id) => deleteMenuItem(id));

  ipcMain.handle('db:get-settings', () => getSettings());
  ipcMain.handle('db:save-settings', (_, settings) => saveSettings(settings));

  ipcMain.handle('db:create-order', (_, tableId) => createOrder(tableId));

  ipcMain.handle('license:status', () => licenseStatus);

  // 4. Start Local Mobile Server
  startLocalServer();

  // 5. Create Window
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});