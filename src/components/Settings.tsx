import React, { useState, useEffect } from 'react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    hotel_name: '',
    hotel_address: '',
    printer_name: '',
    bill_footer: '',
    enable_tables: 'true'
  });
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  
  const [newItem, setNewItem] = useState({ name: '', price: '', category_id: '' });
  const [newTable, setNewTable] = useState({ name: '', capacity: '' });
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // @ts-ignore
    const s = await window.api.getSettings();
    setSettings(s);
    // @ts-ignore
    const items = await window.api.getMenuItems();
    setMenuItems(items);
    // @ts-ignore
    const cats = await window.api.getCategories();
    setCategories(cats);
    // @ts-ignore
    const t = await window.api.getTables();
    setTables(t);
  };

  const handleSaveSettings = async () => {
    // @ts-ignore
    await window.api.saveSettings(settings);
    console.log('Settings saved!');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory) return;
    // @ts-ignore
    await window.api.addCategory(newCategory);
    setNewCategory('');
    loadData();
  };

  const handleDeleteCategory = async (id: number) => {
    // @ts-ignore
    await window.api.deleteCategory(id);
    loadData();
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.category_id) {
      console.error('Please fill all fields including category');
      return;
    }
    
    // @ts-ignore
    await window.api.addMenuItem({
      ...newItem,
      price: parseFloat(newItem.price),
      category_id: parseInt(newItem.category_id)
    });
    setNewItem({ name: '', price: '', category_id: '' });
    loadData();
  };

  const handleDeleteItem = async (id: number) => {
    // @ts-ignore
    await window.api.deleteMenuItem(id);
    loadData();
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.name || !newTable.capacity) return;

    // @ts-ignore
    await window.api.addTable({
      ...newTable,
      capacity: parseInt(newTable.capacity)
    });
    setNewTable({ name: '', capacity: '' });
    loadData();
  };

  const handleDeleteTable = async (id: number) => {
    // @ts-ignore
    await window.api.deleteTable(id);
    loadData();
  };

  return (
    <div className="space-y-8 pb-8">
      {/* General Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">General Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md"
              value={settings.hotel_name || ''}
              onChange={e => setSettings({...settings, hotel_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md"
              value={settings.hotel_address || ''}
              onChange={e => setSettings({...settings, hotel_address: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Printer Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md"
              value={settings.printer_name || ''}
              onChange={e => setSettings({...settings, printer_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Footer</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md"
              value={settings.bill_footer || ''}
              onChange={e => setSettings({...settings, bill_footer: e.target.value})}
            />
          </div>
          <div className="flex items-center mt-6">
            <input 
              type="checkbox" 
              id="enableTables"
              className="w-4 h-4 text-blue-600 rounded"
              checked={settings.enable_tables === 'true'}
              onChange={e => setSettings({...settings, enable_tables: e.target.checked ? 'true' : 'false'})}
            />
            <label htmlFor="enableTables" className="ml-2 text-sm font-medium text-gray-700">Enable Table Management</label>
          </div>
        </div>
        <button 
          onClick={handleSaveSettings}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Settings
        </button>
      </div>

      {/* Table Management (Conditional) */}
      {settings.enable_tables === 'true' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Table Management</h2>
          
          <form onSubmit={handleAddTable} className="flex gap-4 mb-6 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md"
                value={newTable.name}
                onChange={e => setNewTable({...newTable, name: e.target.value})}
                placeholder="e.g. Table 5"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded-md"
                value={newTable.capacity}
                onChange={e => setNewTable({...newTable, capacity: e.target.value})}
                placeholder="4"
              />
            </div>
            <button 
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 h-[42px]"
            >
              Add Table
            </button>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tables.map(table => (
              <div key={table.id} className="border p-3 rounded flex justify-between items-center bg-gray-50">
                <div>
                  <p className="font-semibold">{table.name}</p>
                  <p className="text-xs text-gray-500">Cap: {table.capacity}</p>
                </div>
                <button 
                  onClick={() => handleDeleteTable(table.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Management */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Category Management</h2>
        <form onSubmit={handleAddCategory} className="flex gap-4 mb-6 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="e.g. Desserts"
            />
          </div>
          <button 
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 h-[42px]"
          >
            Add Category
          </button>
        </form>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <div key={cat.id} className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
              <span>{cat.name}</span>
              <button 
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Management */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Menu Management</h2>
        
        <form onSubmit={handleAddMenuItem} className="flex gap-4 mb-6 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md"
              value={newItem.name}
              onChange={e => setNewItem({...newItem, name: e.target.value})}
              placeholder="e.g. Chicken Burger"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full p-2 border rounded-md"
              value={newItem.category_id}
              onChange={e => setNewItem({...newItem, category_id: e.target.value})}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full p-2 border rounded-md"
              value={newItem.price}
              onChange={e => setNewItem({...newItem, price: e.target.value})}
              placeholder="0.00"
            />
          </div>
          <button 
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 h-[42px]"
          >
            Add Item
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.category_name || <span className="text-gray-400 italic">Uncategorized</span>}</td>
                  <td className="p-3">₹{item.price.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;