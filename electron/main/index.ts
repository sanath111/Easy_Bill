import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
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
import { checkLicense, activateLicense } from './license/validator';
import { startLocalServer } from './server/api';
import { SUPABASE_URL, LOCAL_CALLBACK_URL, isConfigured } from './config';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Register Custom Protocol 'easybill://'
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('easybill', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('easybill');
}

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../../dist-electron/preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Remove the top menu
  mainWindow.setMenu(null);

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

// Force Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine, _workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // Handle Deep Link on Windows
    const url = commandLine.find(arg => arg.startsWith('easybill://'));
    if (url) handleDeepLink(url);
  });

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
    
    // License IPC
    ipcMain.handle('license:status', () => checkLicense());
    ipcMain.handle('license:activate', (_, { key, token }) => activateLicense(key, token));
    
    ipcMain.handle('auth:open-google-login', () => {
      console.log('Checking Supabase Configuration...');
      console.log('URL Configured:', SUPABASE_URL && !SUPABASE_URL.includes('YOUR_PROJECT_ID'));
      
      if (!isConfigured()) {
        console.error('Supabase is NOT configured correctly.');
        dialog.showErrorBox(
          'Configuration Error', 
          'Supabase URL and Key are missing or default in electron/main/config.ts.'
        );
        return;
      }

      const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${LOCAL_CALLBACK_URL}`;
      console.log('Opening Auth URL:', authUrl);
      shell.openExternal(authUrl);
    });
    
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
}

// Handle Deep Link (macOS)
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

function handleDeepLink(url: string) {
  console.log('Received deep link:', url);
  
  try {
    const hash = url.split('#')[1];
    if (!hash) return;
    
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && mainWindow) {
      // Send token to renderer to handle Supabase session
      mainWindow.webContents.send('auth:session-received', { accessToken, refreshToken });
    }
  } catch (e) {
    console.error('Error parsing deep link', e);
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});