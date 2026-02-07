import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const SettingsPage = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General
    hotel_name: '',
    hotel_address: '',
    printer_name: '',
    enable_tables: 'true',
    
    // Bill Config
    paper_size: '80mm',
    line_pattern: 'dashed', // or solid, double
    divider_type: 'css', // 'css' or 'text'
    divider_character: '-',
    
    // Fonts (Global defaults if specific ones missing)
    font_family_header: 'monospace',
    font_size_header: '16px',
    
    font_family_address: 'monospace',
    font_size_address: '12px',
    
    font_family_body: 'monospace',
    font_size_body: '12px',
    
    font_family_footer: 'monospace',
    font_size_footer: '12px',
    
    // Toggles
    show_token: 'true',
    show_logo: 'false',
    show_cashier: 'true',
    cashier_name: 'Cashier',
    bill_footer: '',
  });
  
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  
  const [newItem, setNewItem] = useState({ name: '', price: '', category_id: '' });
  const [newTable, setNewTable] = useState({ name: '', capacity: '' });
  const [newCategory, setNewCategory] = useState('');

  const fontSizes = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '28px', '32px', '36px'];
  const fontFamilies = [
    { label: 'Monospace (Courier)', value: 'monospace' },
    { label: 'Sans Serif (Arial)', value: 'sans-serif' },
    { label: 'Serif (Times)', value: 'serif' },
    { label: 'Courier New', value: "'Courier New', Courier, monospace" },
    { label: 'Lucida Console', value: "'Lucida Console', Monaco, monospace" },
    { label: 'Consolas', value: "Consolas, monospace" },
  ];

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
    showToast('Settings saved!', 'success');
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
      showToast('Please fill all fields including category', 'error');
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

  // --- Helpers ---
  const FontControl = ({ label, sizeKey, familyKey }: { label: string, sizeKey: string, familyKey: string }) => (
    <div className="border p-3 rounded-md bg-gray-50 mb-2">
      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">{label}</label>
      <div className="flex gap-2">
        <div className="flex-1">
          <select 
            className="w-full p-2 border rounded-md text-sm bg-white" 
            value={settings[sizeKey as keyof typeof settings] || '12px'} 
            onChange={e => setSettings({...settings, [sizeKey]: e.target.value})}
          >
            {fontSizes.map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
        <div className="flex-[2]">
          <select 
            className="w-full p-2 border rounded-md text-sm bg-white" 
            value={settings[familyKey as keyof typeof settings] || 'monospace'} 
            onChange={e => setSettings({...settings, [familyKey]: e.target.value})}
          >
             {fontFamilies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  // --- Bill Preview Component ---
  const BillPreview = () => {
    // Printable areas: 2"->58mm, 3"->76mm, 4"->110mm
    const width = settings.paper_size === '58mm' ? '52mm' : settings.paper_size === '100mm' ? '104mm' : '70mm';
    
    const dividerType = settings.divider_type || 'css';
    const dividerChar = settings.divider_character || '-';
    
    let Divider;
    if (dividerType === 'text') {
       const repeatCount = settings.paper_size === '58mm' ? 32 : settings.paper_size === '100mm' ? 64 : 42;
       Divider = () => <div className="text-center overflow-hidden font-mono whitespace-nowrap">{dividerChar.repeat(repeatCount)}</div>;
    } else {
       const borderStyle = settings.line_pattern === 'solid' ? '1px solid #000' : settings.line_pattern === 'double' ? '3px double #000' : '1px dashed #000';
       Divider = () => <div style={{ borderTop: borderStyle, width: '100%' }}></div>;
    }

    return (
      <div className="bg-gray-100 p-4 rounded border flex justify-center overflow-auto max-h-[600px]">
        <div style={{ 
          width: width, 
          backgroundColor: 'white', 
          padding: '0', 
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          color: 'black',
          boxSizing: 'border-box'
        }}>
          {/* Header */}
          <div className="text-center mb-1" style={{ fontFamily: settings.font_family_header, fontSize: settings.font_size_header }}>
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', wordWrap: 'break-word' }}>
              {settings.hotel_name || 'HOTEL NAME'}
            </div>
          </div>
          <div className="text-center mb-2" style={{ fontFamily: settings.font_family_address, fontSize: settings.font_size_address }}>
            <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{settings.hotel_address || 'Address Line 1'}</div>
          </div>

          <div className="my-1"><Divider /></div>

          {/* Body Section */}
          <div style={{ fontFamily: settings.font_family_body, fontSize: settings.font_size_body }}>
            {/* Name Field */}
            <div className="mb-2 flex">
              <span>Name: </span>
            </div>

            <div className="my-1"><Divider /></div>

            {/* Metadata Grid */}
            <div className="flex flex-wrap justify-between mb-2 leading-snug">
              <div style={{ width: '50%' }}>Date: {new Date().toLocaleDateString('en-GB')}</div>
              <div style={{ width: '50%', textAlign: 'right', fontWeight: 'bold' }}>Dine In: T5</div>
              
              <div style={{ width: '50%' }}>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              <div style={{ width: '50%', textAlign: 'right' }}>Bill No.: 7656</div>
              
              {settings.show_cashier === 'true' && (
                <div style={{ width: '100%', marginTop: '2px' }}>Cashier: {settings.cashier_name}</div>
              )}
            </div>

            <div className="my-1"><Divider /></div>

            {/* Items Header */}
            <div className="flex font-bold mb-1">
              <span style={{ width: '40%' }}>Item</span>
              <span style={{ width: '15%', textAlign: 'right' }}>Qty</span>
              <span style={{ width: '22%', textAlign: 'right' }}>Price</span>
              <span style={{ width: '23%', textAlign: 'right' }}>Amount</span>
            </div>

            <div className="my-1"><Divider /></div>

            {/* Items List */}
            <div className="space-y-1">
               <div className="flex">
                 <span style={{ width: '40%', wordBreak: 'break-all' }}>Crispy Chicken Burger</span>
                 <span style={{ width: '15%', textAlign: 'right' }}>1</span>
                 <span style={{ width: '22%', textAlign: 'right' }}>130.00</span>
                 <span style={{ width: '23%', textAlign: 'right' }}>130.00</span>
               </div>
               <div className="flex">
                 <span style={{ width: '40%', wordBreak: 'break-all' }}>Pepsi-250ml</span>
                 <span style={{ width: '15%', textAlign: 'right' }}>1</span>
                 <span style={{ width: '22%', textAlign: 'right' }}>20.00</span>
                 <span style={{ width: '23%', textAlign: 'right' }}>20.00</span>
               </div>
            </div>

            <div className="my-1"><Divider /></div>

            {/* Totals */}
            <div className="flex justify-between font-bold mb-2">
              <span>Total Qty: 2</span>
              <span>Sub Total: 150.00</span>
            </div>

            <div className="my-1"><Divider /></div>

            {/* Grand Total */}
            <div className="flex justify-between items-center text-lg font-bold my-2">
              <span>Grand Total</span>
              <span>₹ 150.00</span>
            </div>

             <div className="my-1"><Divider /></div>
          </div>

          {/* Footer */}
          <div className="text-center mt-2" style={{ fontFamily: settings.font_family_footer, fontSize: settings.font_size_footer }}>
            {settings.bill_footer && <div>{settings.bill_footer}</div>}
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
          <div className="flex-1 bg-white p-6 rounded-lg shadow-md space-y-4 max-h-[700px] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Bill Configuration</h2>
            
            {/* Paper & Layout */}
            <div className="border-b pb-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
              <select className="w-full p-2 border rounded-md mb-2" value={settings.paper_size || '80mm'} onChange={e => setSettings({...settings, paper_size: e.target.value})}>
                <option value="58mm">2 Inch (58mm)</option>
                <option value="80mm">3 Inch (80mm)</option>
                <option value="100mm">4 Inch (100mm)</option>
              </select>
            </div>

            {/* Typography Section */}
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold text-gray-600 mb-2">Typography</h3>
              <FontControl label="Header (Hotel Name)" sizeKey="font_size_header" familyKey="font_family_header" />
              <FontControl label="Sub-Header (Address)" sizeKey="font_size_address" familyKey="font_family_address" />
              <FontControl label="Body (Items/Table)" sizeKey="font_size_body" familyKey="font_family_body" />
              <FontControl label="Footer" sizeKey="font_size_footer" familyKey="font_family_footer" />
            </div>

            {/* Divider Settings */}
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold text-gray-600 mb-2">Divider/Lines</h3>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                   <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                   <select 
                     className="w-full p-2 border rounded-md text-sm" 
                     value={settings.divider_type || 'css'} 
                     onChange={e => setSettings({...settings, divider_type: e.target.value})}
                   >
                     <option value="css">Line (CSS)</option>
                     <option value="text">Character (Text)</option>
                   </select>
                </div>
                <div className="flex-1">
                  {settings.divider_type === 'text' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Character</label>
                      <input 
                        type="text" 
                        maxLength={1}
                        className="w-full p-2 border rounded-md text-sm text-center font-mono" 
                        value={settings.divider_character || '-'} 
                        onChange={e => setSettings({...settings, divider_character: e.target.value})} 
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Style</label>
                      <select 
                        className="w-full p-2 border rounded-md text-sm" 
                        value={settings.line_pattern || 'dashed'} 
                        onChange={e => setSettings({...settings, line_pattern: e.target.value})}
                      >
                        <option value="dashed">Dashed (---)</option>
                        <option value="solid">Solid (___)</option>
                        <option value="double">Double (===)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content & Metadata */}
            <div>
              <h3 className="font-semibold text-gray-600 mb-2">Content</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cashier Name (Display)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md text-sm" 
                    value={settings.cashier_name || ''} 
                    onChange={e => setSettings({...settings, cashier_name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bill Footer Text</label>
                  <textarea 
                    className="w-full p-2 border rounded-md text-sm" 
                    rows={2}
                    value={settings.bill_footer || ''} 
                    onChange={e => setSettings({...settings, bill_footer: e.target.value})}
                  />
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="showCashier" className="w-4 h-4" checked={settings.show_cashier === 'true'} onChange={e => setSettings({...settings, show_cashier: e.target.checked ? 'true' : 'false'})} />
                    <label htmlFor="showCashier" className="ml-2 text-sm text-gray-700">Show Cashier Name</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="showToken" className="w-4 h-4" checked={settings.show_token === 'true'} onChange={e => setSettings({...settings, show_token: e.target.checked ? 'true' : 'false'})} />
                    <label htmlFor="showToken" className="ml-2 text-sm text-gray-700">Show Token Number</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="showLogo" className="w-4 h-4" checked={settings.show_logo === 'true'} onChange={e => setSettings({...settings, show_logo: e.target.checked ? 'true' : 'false'})} />
                    <label htmlFor="showLogo" className="ml-2 text-sm text-gray-700">Show Logo (Placeholder)</label>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 sticky bottom-0">Save Bill Settings</button>
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