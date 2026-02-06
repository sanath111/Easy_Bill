export interface IElectronAPI {
  // Database methods
  getTables: () => Promise<any[]>;
  addTable: (table: any) => Promise<any>;
  deleteTable: (id: number) => Promise<any>;

  getCategories: () => Promise<any[]>;
  addCategory: (name: string) => Promise<any>;
  deleteCategory: (id: number) => Promise<any>;

  getMenuItems: () => Promise<any[]>;
  addMenuItem: (item: any) => Promise<any>;
  deleteMenuItem: (id: number) => Promise<any>;

  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<any>;

  createOrder: (tableId: number | null) => Promise<any>;
  // New method for saving without closing
  saveOrder: (data: { orderId: number, items: any[], tableId: number | null }) => Promise<any>;
  closeOrder: (data: { orderId: number, total: number, items: any[], paymentMethod: string, tableId: number | null }) => Promise<any>;
  getOpenOrder: (tableId: number) => Promise<any>;
  getPendingOrders: () => Promise<any[]>;

  // Reports
  getSalesReport: (range: { startDate: string, endDate: string }) => Promise<any>;
  getItemSalesReport: (range: { startDate: string, endDate: string }) => Promise<any>;
  getSalesByDay: (range: { startDate: string, endDate: string }) => Promise<any[]>;
  getSalesByPaymentMethod: (range: { startDate: string, endDate: string }) => Promise<any[]>;
  getSalesByCategory: (range: { startDate: string, endDate: string }) => Promise<any[]>;
  getExportData: (range: { startDate: string, endDate: string }) => Promise<any[]>;

  // Printing
  getPrinters: () => Promise<any[]>;
  printBill: (billData: any) => Promise<any>;

  // Licensing
  getLicenseStatus: () => Promise<string>;
  activateLicense: (data: { key: string, token?: string }) => Promise<any>;

  // Auth
  openGoogleLogin: () => Promise<any>;
  onSessionReceived: (callback: (session: any) => void) => void;

  // Network
  getLocalIp: () => Promise<string>;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}