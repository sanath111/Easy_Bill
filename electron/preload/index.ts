import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Database methods
  getTables: () => ipcRenderer.invoke('db:get-tables'),
  addTable: (table: any) => ipcRenderer.invoke('db:add-table', table),
  deleteTable: (id: number) => ipcRenderer.invoke('db:delete-table', id),
  
  getCategories: () => ipcRenderer.invoke('db:get-categories'),
  addCategory: (name: string) => ipcRenderer.invoke('db:add-category', name),
  deleteCategory: (id: number) => ipcRenderer.invoke('db:delete-category', id),

  getMenuItems: () => ipcRenderer.invoke('db:get-menu-items'),
  addMenuItem: (item: any) => ipcRenderer.invoke('db:add-menu-item', item),
  deleteMenuItem: (id: number) => ipcRenderer.invoke('db:delete-menu-item', id),
  
  getSettings: () => ipcRenderer.invoke('db:get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('db:save-settings', settings),

  createOrder: (tableId: number | null) => ipcRenderer.invoke('db:create-order', tableId),
  
  // Printing
  printBill: (billData: any) => ipcRenderer.invoke('print:bill', billData),
  
  // Licensing
  getLicenseStatus: () => ipcRenderer.invoke('license:status'),
  // UPDATED: Accept object with key and optional token
  activateLicense: (data: { key: string, token?: string }) => ipcRenderer.invoke('license:activate', data),
  
  // Auth
  openGoogleLogin: () => ipcRenderer.invoke('auth:open-google-login'),
  onSessionReceived: (callback: (session: any) => void) => {
    ipcRenderer.on('auth:session-received', (_, session) => callback(session));
  },
  
  // Network
  getLocalIp: () => ipcRenderer.invoke('network:get-ip'),
});