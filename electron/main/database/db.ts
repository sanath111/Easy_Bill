import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

const dbPath = process.env.NODE_ENV === 'development'
  ? path.join(process.cwd(), 'easy_bill.db')
  : path.join(app.getPath('userData'), 'easy_bill.db');

const db = new Database(dbPath, { verbose: console.log });

export function initDatabase() {
  const schema = `
  CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'available', -- available, occupied, reserved
      capacity INTEGER
  );

  CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      printer_name TEXT
  );

  CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      is_available INTEGER DEFAULT 1,
      FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER,
      status TEXT DEFAULT 'open', -- open, closed, cancelled
      token_number INTEGER,
      bill_number INTEGER,
      total_amount REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      payment_method TEXT,
      FOREIGN KEY (table_id) REFERENCES tables(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      item_id INTEGER,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  -- Indices for Reporting Performance
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
  `;

  db.exec(schema);
  
  // Migration: Check if item_id exists in order_items (for existing DBs)
  try {
    const tableInfo = db.prepare("PRAGMA table_info(order_items)").all() as any[];
    const hasItemId = tableInfo.some(col => col.name === 'item_id');
    if (!hasItemId) {
      console.log('Migrating: Adding item_id to order_items');
      db.prepare("ALTER TABLE order_items ADD COLUMN item_id INTEGER").run();
    }

    const categoryTableInfo = db.prepare("PRAGMA table_info(categories)").all() as any[];
    const hasPrinterName = categoryTableInfo.some(col => col.name === 'printer_name');
    if (!hasPrinterName) {
      db.prepare("ALTER TABLE categories ADD COLUMN printer_name TEXT").run();
    }

    const ordersTableInfo = db.prepare("PRAGMA table_info(orders)").all() as any[];
    const hasTokenNum = ordersTableInfo.some(col => col.name === 'token_number');
    if (!hasTokenNum) {
      db.prepare("ALTER TABLE orders ADD COLUMN token_number INTEGER").run();
      db.prepare("ALTER TABLE orders ADD COLUMN bill_number INTEGER").run();
    }
  } catch (e) {
    console.error('Migration failed:', e);
  }

  // Seed initial data
  const tableCount = db.prepare('SELECT count(*) as count FROM tables').get() as { count: number };
  if (tableCount.count === 0) {
    const insert = db.prepare('INSERT INTO tables (name, capacity) VALUES (?, ?)');
    insert.run('Table 1', 4);
    insert.run('Table 2', 2);
    insert.run('Table 3', 6);
    insert.run('Table 4', 4);
  }

  const categoryCount = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const insert = db.prepare('INSERT INTO categories (name) VALUES (?)');
    insert.run('Beverages');
    insert.run('Starters');
    insert.run('Main Course');
  }

  const settingsCount = db.prepare('SELECT count(*) as count FROM settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insert.run('hotel_name', 'Easy Bill Hotel');
    insert.run('hotel_address', '123 Main St, City');
    insert.run('printer_name', 'Microsoft Print to PDF');
    insert.run('bill_footer', 'Thank you for visiting!');
    insert.run('enable_tables', 'true');
    
    // New Bill Settings Defaults
    insert.run('paper_size', '80mm'); // 3 inch
    insert.run('font_size_header', '16px');
    insert.run('font_size_body', '12px');
    insert.run('line_pattern', 'dashed'); // dashed, solid, double
    insert.run('show_token', 'true');
    insert.run('show_logo', 'false');
    insert.run('font_family', 'monospace');
    insert.run('show_cashier', 'true');
    insert.run('cashier_name', 'Cashier');

    // Multi-printer settings
    insert.run('printer_mode', 'single'); // single or multiple
    insert.run('single_printer_kot_type', 'single_kot'); // single_kot or category_kot

    // Numbering settings
    insert.run('token_reset_daily', 'true');
    insert.run('bill_reset_daily', 'false');
    insert.run('token_prefix', '0');
    insert.run('bill_prefix', '0');
    insert.run('last_reset_date', new Date().toISOString().split('T')[0]);

    insert.run('hotel_phone', '');
    insert.run('fssai_number', '');
    insert.run('gst_number', '');
  } else {
    // Migration for existing settings: Check and add missing printer settings
    const existingSettings = getSettings() as any;
    const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    if (existingSettings.printer_mode === undefined) {
      insert.run('printer_mode', 'single');
    }
    if (existingSettings.single_printer_kot_type === undefined) {
      insert.run('single_printer_kot_type', 'single_kot');
    }
    
    // Numbering migrations
    if (existingSettings.token_reset_daily === undefined) {
      insert.run('token_reset_daily', 'true');
      insert.run('bill_reset_daily', 'false');
      insert.run('token_prefix', '0');
      insert.run('bill_prefix', '0');
      insert.run('last_reset_date', new Date().toISOString().split('T')[0]);
    }

    // Contact and Tax migrations
    if (existingSettings.hotel_phone === undefined) {
      insert.run('hotel_phone', '');
    }
    if (existingSettings.fssai_number === undefined) {
      insert.run('fssai_number', '');
    }
    if (existingSettings.gst_number === undefined) {
      insert.run('gst_number', '');
    }
  }
}

// --- Data Access Methods ---

// Tables
export function getTables() {
  return db.prepare('SELECT * FROM tables').all();
}

export function addTable(table: any) {
  const stmt = db.prepare('INSERT INTO tables (name, capacity) VALUES (?, ?)');
  return stmt.run(table.name, table.capacity);
}

export function deleteTable(id: number) {
  return db.prepare('DELETE FROM tables WHERE id = ?').run(id);
}

// Menu
export function getCategories() {
  return db.prepare('SELECT * FROM categories').all();
}

export function addCategory(name: string, printerName?: string) {
  const stmt = db.prepare('INSERT INTO categories (name, printer_name) VALUES (?, ?)');
  return stmt.run(name, printerName || null);
}

export function updateCategoryPrinter(id: number, printerName: string | null) {
  const stmt = db.prepare('UPDATE categories SET printer_name = ? WHERE id = ?');
  return stmt.run(printerName, id);
}

export function deleteCategory(id: number) {
  return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}

export function getMenuItems() {
  return db.prepare('SELECT m.*, c.name as category_name FROM menu_items m LEFT JOIN categories c ON m.category_id = c.id').all();
}

export function addMenuItem(item: any) {
  const stmt = db.prepare('INSERT INTO menu_items (category_id, name, price) VALUES (?, ?, ?)');
  return stmt.run(item.category_id, item.name, item.price);
}

export function deleteMenuItem(id: number) {
  return db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
}

// Settings
export function getSettings() {
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
  return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
}

export function saveSettings(settings: any) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const transaction = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      stmt.run(key, value as string);
    }
  });
  transaction(settings);
  return { success: true };
}

function getNextNumber(type: 'token' | 'bill') {
  const settings = getSettings() as any;
  const resetDaily = settings[`${type}_reset_daily`] === 'true';
  const prefix = parseInt(settings[`${type}_prefix`] || '0');
  const lastResetDate = settings.last_reset_date;
  const today = new Date().toISOString().split('T')[0];

  let needsReset = false;
  if (resetDaily && lastResetDate !== today) {
    needsReset = true;
    // Update last_reset_date
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_reset_date', today);
  }

  const column = `${type}_number`;
  let query = `SELECT MAX(${column}) as maxNum FROM orders`;
  let params: any[] = [];

  if (resetDaily) {
    query += " WHERE created_at >= ?";
    params.push(`${today} 00:00:00`);
  }

  const result = db.prepare(query).get(...params) as { maxNum: number | null };
  let nextNum = (result.maxNum || prefix) + 1;
  
  if (needsReset) {
      nextNum = prefix + 1;
  }

  return nextNum;
}

// Orders
export function createOrder(tableId: number | null) {
  const transaction = db.transaction(() => {
    const tokenNumber = getNextNumber('token');
    const stmt = db.prepare('INSERT INTO orders (table_id, status, token_number) VALUES (?, ?, ?)');
    const info = stmt.run(tableId, 'open', tokenNumber);
    
    if (tableId) {
      db.prepare("UPDATE tables SET status = 'occupied' WHERE id = ?").run(tableId);
    }
    
    return { id: info.lastInsertRowid, tableId, status: 'open', total_amount: 0, token_number: tokenNumber };
  });
  return transaction();
}

export function getOpenOrder(tableId: number) {
  const order = db.prepare("SELECT * FROM orders WHERE table_id = ? AND status = 'open'").get(tableId);
  if (!order) return null;
  // @ts-ignore
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  return order;
}

export function getPendingOrders() {
  const orders = db.prepare(`
    SELECT o.*, t.name as table_name 
    FROM orders o 
    LEFT JOIN tables t ON o.table_id = t.id 
    WHERE o.status = 'open'
    ORDER BY o.created_at DESC
  `).all();
  
  for (const order of orders) {
    // @ts-ignore
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }
  
  return orders;
}

export function saveOrder(orderId: number, items: any[], tableId: number | null) {
  const transaction = db.transaction(() => {
    // 1. Clear existing items for this order (simple way to handle updates)
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);

    // 2. Insert Order Items
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, item_id, item_name, quantity, price, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let total = 0;
    for (const item of items) {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      insertItem.run(orderId, item.id, item.name, item.quantity, item.price, itemTotal);
    }

    // 3. Update Order Total
    db.prepare('UPDATE orders SET total_amount = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?').run(total, orderId);
    
    // 4. Ensure table is occupied
    if (tableId) {
      db.prepare("UPDATE tables SET status = 'occupied' WHERE id = ?").run(tableId);
    }
  });

  transaction();
  return { success: true };
}

export function closeOrder(orderId: number, total: number, items: any[], paymentMethod: string = 'Cash', tableId: number | null) {
  const transaction = db.transaction(() => {
    // 1. Get Bill Number
    const billNumber = getNextNumber('bill');

    // 2. Update Order
    db.prepare(`
      UPDATE orders 
      SET status = 'closed', total_amount = ?, closed_at = CURRENT_TIMESTAMP, payment_method = ?, bill_number = ?
      WHERE id = ?
    `).run(total, paymentMethod, billNumber, orderId);

    // 3. Clear and Re-insert items (to ensure final state matches)
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
    
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, item_id, item_name, quantity, price, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(orderId, item.id, item.name, item.quantity, item.price, item.price * item.quantity);
    }

    // 3. Free the table
    if (tableId) {
      db.prepare("UPDATE tables SET status = 'available' WHERE id = ?").run(tableId);
    }

    return { billNumber };
  });

  return transaction();
}

export function deleteOrder(orderId: number) {
  const transaction = db.transaction(() => {
    // 1. Get order details to check table
    const order = db.prepare('SELECT table_id FROM orders WHERE id = ?').get(orderId) as any;
    
    if (order) {
      // 2. Delete items
      db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
      
      // 3. Delete order
      db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);

      // 4. Free table if exists
      if (order.table_id) {
        db.prepare("UPDATE tables SET status = 'available' WHERE id = ?").run(order.table_id);
      }
    }
  });
  
  transaction();
  return { success: true };
}

// Reports
export function getSalesReport(startDate: string, endDate: string) {
  const start = `${startDate} 00:00:00`;
  const end = `${endDate} 23:59:59`;

  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as average_order_value
    FROM orders 
    WHERE status = 'closed' AND created_at BETWEEN ? AND ?
  `).get(start, end);

  return summary;
}

export function getItemSalesReport(startDate: string, endDate: string) {
  const start = `${startDate} 00:00:00`;
  const end = `${endDate} 23:59:59`;

  const items = db.prepare(`
    SELECT 
      oi.item_name,
      SUM(oi.quantity) as quantity_sold,
      SUM(oi.total) as revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'closed' AND o.created_at BETWEEN ? AND ?
    GROUP BY oi.item_name
    ORDER BY revenue DESC
  `).all(start, end);

  return items;
}

export function getSalesByDay(startDate: string, endDate: string) {
  const start = `${startDate} 00:00:00`;
  const end = `${endDate} 23:59:59`;
  return db.prepare(`
    SELECT 
      strftime('%Y-%m-%d', created_at) as date,
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue
    FROM orders 
    WHERE status = 'closed' AND created_at BETWEEN ? AND ?
    GROUP BY date
    ORDER BY date ASC
  `).all(start, end);
}

export function getSalesByPaymentMethod(startDate: string, endDate: string) {
  const start = `${startDate} 00:00:00`;
  const end = `${endDate} 23:59:59`;
  return db.prepare(`
    SELECT 
      payment_method,
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue
    FROM orders 
    WHERE status = 'closed' AND created_at BETWEEN ? AND ?
    GROUP BY payment_method
  `).all(start, end);
}

export function getSalesByCategory(startDate: string, endDate: string) {
  const start = `${startDate} 00:00:00`;
  const end = `${endDate} 23:59:59`;
  return db.prepare(`
    SELECT 
      IFNULL(c.name, 'Uncategorized') as category_name,
      SUM(oi.quantity) as quantity_sold,
      SUM(oi.total) as revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN menu_items mi ON oi.item_id = mi.id
    LEFT JOIN categories c ON mi.category_id = c.id
    WHERE o.status = 'closed' AND o.created_at BETWEEN ? AND ?
    GROUP BY category_name
    ORDER BY revenue DESC
  `).all(start, end);
}

export function getExportData(startDate: string, endDate: string) {
  const start = `${startDate} 00:00:00`;
  const end = `${endDate} 23:59:59`;
  return db.prepare(`
    SELECT 
      o.id as order_id,
      o.created_at,
      o.table_id,
      t.name as table_name,
      o.payment_method,
      oi.item_name,
      IFNULL(c.name, 'Uncategorized') as category_name,
      oi.quantity,
      oi.price,
      oi.total
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN menu_items mi ON oi.item_id = mi.id
    LEFT JOIN categories c ON mi.category_id = c.id
    WHERE o.status = 'closed' AND o.created_at BETWEEN ? AND ?
    ORDER BY o.created_at DESC
  `).all(start, end);
}

export default db;