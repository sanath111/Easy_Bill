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
      name TEXT NOT NULL
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
  `;

  db.exec(schema);
  
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

export function addCategory(name: string) {
  const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
  return stmt.run(name);
}

export function deleteCategory(id: number) {
  // Optional: Check if items exist in this category before deleting, or cascade delete
  // For now, simple delete. Items with this category_id will effectively have no category name join.
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

// Orders
export function createOrder(tableId: number | null) {
  const stmt = db.prepare('INSERT INTO orders (table_id) VALUES (?)');
  const info = stmt.run(tableId);
  return { id: info.lastInsertRowid, tableId, status: 'open', total_amount: 0 };
}

export function getOrder(orderId: number) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return null;
    // @ts-ignore
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    return order;
}

export default db;