import React, { useState, useEffect } from 'react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    hotel_name: '',
    hotel_address: '',
    printer_name: '',
    bill_footer: '',
    enable_tables: 'true',
    paper_size: '80mm',
    font_size_header: '16px',
    font_size_body: '12px',
    line_pattern: 'dashed',
    show_token: 'true',
    show_logo: 'false'
  });
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  
  const [newItem, setNewItem] = useState({ name: '', price: '', category_id: '' });
  const [newTable, setNewTable] = useState({ name: '', capacity: '' });
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await window.api.getSettings();
    setSettings(prev => ({ ...prev, ...s })); // Merge with defaults
    const items = await window.api.getMenuItems();
    setMenuItems(items);
    const cats = await window.api.getCategories();
    setCategories(cats);
    const t = await window.api.getTables();
    setTables(t);
    const p = await window.api.getPrinters();
    setPrinters(p);
  };

  const handleSaveSettings = async () => {
    await window.api.saveSettings(settings);
    alert('Settings saved!');
  };

  // ... (Keep existing handlers for Menu/Table/Category) ...
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory) return;
    await window.api.addCategory(newCategory);
    setNewCategory('');
    loadData();
  };

  const handleDeleteCategory = async (id: number) => {
    await window.api.deleteCategory(id);
    loadData();
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.category_id) {
      alert('Please fill all fields including category');
      return;
    }
    await window.api.addMenuItem({ ...newItem, price: parseFloat(newItem.price), category_id: parseInt(newItem.category_id) });
    setNewItem({ name: '', price: '', category_id: '' });
    loadData();
  };

  const handleDeleteItem = async (id: number) => {
    await window.api.deleteMenuItem(id);
    loadData();
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.name || !newTable.capacity) return;
    await window.api.addTable({ ...newTable, capacity: parseInt(newTable.capacity) });
    setNewTable({ name: '', capacity: '' });
    loadData();
  };

  const handleDeleteTable = async (id: number) => {
    await window.api.deleteTable(id);
    loadData();
  };

  // --- Bill Preview Component ---
  const BillPreview = () => {
    const width = settings.paper_size === '58mm' ? '200px' : settings.paper_size === '100mm' ? '350px' : '280px';
    const borderStyle = settings.line_pattern === 'solid' ? '1px solid #000' : settings.line_pattern === 'double' ? '3px double #000' : '1px dashed #000';

    return (
      <div className="bg-gray-100 p-4 rounded border flex justify-center">
        <div style={{ 
          width: width, 
          backgroundColor: 'white', 
          padding: '10px', 
          fontFamily: 'monospace', 
          fontSize: settings.font_size_body,
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <div className="text-center mb-2">
            {settings.show_logo === 'true' && <div className="mb-1">[LOGO]</div>}
            <div style={{ fontSize: settings.font_size_header, fontWeight: 'bold', textTransform: 'uppercase' }}>
              {settings.hotel_name || 'HOTEL NAME'}
            </div>
            <div>{settings.hotel_address || 'Address Line 1'}</div>
            <div>Date: {new Date().toLocaleDateString()}</div>
          </div>

          {settings.show_token === 'true' && (
            <div className="text-center font-bold my-2">Token: #42</div>
          )}

          <div style={{ borderTop: borderStyle, margin: '5px 0' }}></div>

          <div className="flex justify-between font-bold">
            <span>Item</span>
            <span>Qty</span>
            <span>Price</span>
          </div>
          
          <div className="flex justify-between">
            <span>Burger</span>
            <span>2</span>
            <span>120.00</span>
          </div>
          <div className="flex justify-between">
            <span>Coke</span>
            <span>1</span>
            <span>40.00</span>
          </div>

          <div style={{ borderTop: borderStyle, margin: '5px 0' }}></div>

          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>₹160.00</span>
          </div>

          <div className="text-center mt-4 text-xs">
            {settings.bill_footer || 'Thank you!'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Tabs */}
      <div className="flex border-b">
        <button 
          className={`px-4 py-2 ${activeTab === 'general' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('general')}
        >
          General & Menu
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'bill' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('bill')}
        >
          Bill Settings
        </button>
      </div>

      {/* General Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-8">
          {/* General Settings Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">General Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                <input type="text" className="w-full p-2 border rounded-md" value={settings.hotel_name || ''} onChange={e => setSettings({...settings, hotel_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" className="w-full p-2 border rounded-md" value={settings.hotel_address || ''} onChange={e => setSettings({...settings, hotel_address: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Printer Name</label>
                <select className="w-full p-2 border rounded-md" value={settings.printer_name || ''} onChange={e => setSettings({...settings, printer_name: e.target.value})}>
                  <option value="">Select Printer</option>
                  {printers.map((p: any) => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex items-center mt-6">
                <input type="checkbox" id="enableTables" className="w-4 h-4" checked={settings.enable_tables === 'true'} onChange={e => setSettings({...settings, enable_tables: e.target.checked ? 'true' : 'false'})} />
                <label htmlFor="enableTables" className="ml-2 text-sm font-medium text-gray-700">Enable Table Management</label>
              </div>
            </div>
            <button onClick={handleSaveSettings} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Settings</button>
          </div>

          {/* Table Management */}
          {settings.enable_tables === 'true' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Table Management</h2>
              <form onSubmit={handleAddTable} className="flex gap-4 mb-6 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
                  <input type="text" className="w-full p-2 border rounded-md" value={newTable.name} onChange={e => setNewTable({...newTable, name: e.target.value})} placeholder="e.g. Table 5" />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input type="number" className="w-full p-2 border rounded-md" value={newTable.capacity} onChange={e => setNewTable({...newTable, capacity: e.target.value})} placeholder="4" />
                </div>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 h-[42px]">Add Table</button>
              </form>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tables.map(table => (
                  <div key={table.id} className="border p-3 rounded flex justify-between items-center bg-gray-50">
                    <div><p className="font-semibold">{table.name}</p><p className="text-xs text-gray-500">Cap: {table.capacity}</p></div>
                    <button onClick={() => handleDeleteTable(table.id)} className="text-red-500 hover:text-red-700">×</button>
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
                <input type="text" className="w-full p-2 border rounded-md" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Desserts" />
              </div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 h-[42px]">Add Category</button>
            </form>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <div key={cat.id} className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
                  <span>{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700 font-bold">×</button>
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
                <input type="text" className="w-full p-2 border rounded-md" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Chicken Burger" />
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full p-2 border rounded-md" value={newItem.category_id} onChange={e => setNewItem({...newItem, category_id: e.target.value})}>
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input type="number" step="0.01" className="w-full p-2 border rounded-md" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} placeholder="0.00" />
              </div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 h-[42px]">Add Item</button>
            </form>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map(item => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3">{item.category_name || <span className="text-gray-400 italic">Uncategorized</span>}</td>
                      <td className="p-3">₹{item.price.toFixed(2)}</td>
                      <td className="p-3 text-right"><button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-800">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bill Settings Tab */}
      {activeTab === 'bill' && (
        <div className="flex gap-6">
          {/* Settings Form */}
          <div className="flex-1 bg-white p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-bold mb-4">Bill Configuration</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
              <select className="w-full p-2 border rounded-md" value={settings.paper_size || '80mm'} onChange={e => setSettings({...settings, paper_size: e.target.value})}>
                <option value="58mm">2 Inch (58mm)</option>
                <option value="80mm">3 Inch (80mm)</option>
                <option value="100mm">4 Inch (100mm)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Header Font Size</label>
                <select className="w-full p-2 border rounded-md" value={settings.font_size_header || '16px'} onChange={e => setSettings({...settings, font_size_header: e.target.value})}>
                  <option value="14px">Small (14px)</option>
                  <option value="16px">Medium (16px)</option>
                  <option value="18px">Large (18px)</option>
                  <option value="20px">Extra Large (20px)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Font Size</label>
                <select className="w-full p-2 border rounded-md" value={settings.font_size_body || '12px'} onChange={e => setSettings({...settings, font_size_body: e.target.value})}>
                  <option value="10px">Small (10px)</option>
                  <option value="12px">Medium (12px)</option>
                  <option value="14px">Large (14px)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Line Pattern</label>
              <select className="w-full p-2 border rounded-md" value={settings.line_pattern || 'dashed'} onChange={e => setSettings({...settings, line_pattern: e.target.value})}>
                <option value="dashed">Dashed (---)</option>
                <option value="solid">Solid (___)</option>
                <option value="double">Double (===)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill Footer Text</label>
              <textarea 
                className="w-full p-2 border rounded-md" 
                rows={3}
                value={settings.bill_footer || ''} 
                onChange={e => setSettings({...settings, bill_footer: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input type="checkbox" id="showToken" className="w-4 h-4" checked={settings.show_token === 'true'} onChange={e => setSettings({...settings, show_token: e.target.checked ? 'true' : 'false'})} />
                <label htmlFor="showToken" className="ml-2 text-sm font-medium text-gray-700">Show Token Number</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="showLogo" className="w-4 h-4" checked={settings.show_logo === 'true'} onChange={e => setSettings({...settings, show_logo: e.target.checked ? 'true' : 'false'})} />
                <label htmlFor="showLogo" className="ml-2 text-sm font-medium text-gray-700">Show Logo (Placeholder)</label>
              </div>
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Bill Settings</button>
          </div>

          {/* Live Preview */}
          <div className="w-96">
            <h2 className="text-xl font-bold mb-4">Live Preview</h2>
            <BillPreview />
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;