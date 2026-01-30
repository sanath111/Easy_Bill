import React, { useState, useEffect, useRef } from 'react';

const Billing = () => {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Quantity Popup State
  const [showQuantityPopup, setShowQuantityPopup] = useState(false);
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      // @ts-ignore
      const items = await window.api.getMenuItems();
      setMenuItems(items);
      setFilteredItems(items);
      // @ts-ignore
      const t = await window.api.getTables();
      setTables(t);
      // @ts-ignore
      const s = await window.api.getSettings();
      setSettings(s);
    };
    loadData();
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredItems(menuItems);
      setSelectedIndex(-1);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = menuItems.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) || 
        (item.category_name && item.category_name.toLowerCase().includes(lowerQuery))
      );
      setFilteredItems(filtered);
      setSelectedIndex(0);
    }
  }, [searchQuery, menuItems]);

  // Focus quantity input when popup opens
  useEffect(() => {
    if (showQuantityPopup && quantityInputRef.current) {
      quantityInputRef.current.focus();
      quantityInputRef.current.select();
    } else if (!showQuantityPopup && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showQuantityPopup]);

  const initiateAddToCart = (item: any) => {
    setPendingItem(item);
    setQuantity(1);
    setShowQuantityPopup(true);
  };

  const confirmAddToCart = () => {
    if (!pendingItem) return;

    setCart(prev => {
      const existing = prev.find(i => i.id === pendingItem.id);
      if (existing) {
        return prev.map(i => i.id === pendingItem.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...pendingItem, quantity: quantity }];
    });

    setShowQuantityPopup(false);
    setPendingItem(null);
    setSearchQuery('');
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePrint = async () => {
    if (cart.length === 0) return;

    if (settings.enable_tables === 'true' && !selectedTable) {
      alert('Please select a table first');
      return;
    }
    
    const billData = {
      items: cart,
      total: calculateTotal(),
      tableId: selectedTable
    };

    // @ts-ignore
    const result = await window.api.printBill(billData);
    if (result.success) {
      console.log('Bill printed successfully!');
      setCart([]);
      setSelectedTable(null);
    } else {
      alert('Printing failed: ' + result.error);
    }
  };

  const handleMainKeyDown = (e: React.KeyboardEvent) => {
    if (showQuantityPopup) return; // Let popup handle its own keys

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedIndex === -1) {
        setSelectedIndex(0);
      } else {
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedIndex === -1) {
        setSelectedIndex(filteredItems.length - 1);
      } else {
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      
      if (selectedIndex !== -1 && filteredItems.length > 0) {
        initiateAddToCart(filteredItems[selectedIndex]);
      } else if (searchQuery === '' && cart.length > 0) {
        handlePrint();
      }
    }
  };

  const handlePopupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setQuantity(prev => prev + 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setQuantity(prev => Math.max(1, prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      confirmAddToCart();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowQuantityPopup(false);
      setPendingItem(null);
    }
  };

  return (
    <div className="flex h-full gap-6 relative" onKeyDown={handleMainKeyDown}>
      
      {/* Quantity Popup Overlay */}
      {showQuantityPopup && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 w-80 transform transition-all scale-100"
            onKeyDown={handlePopupKeyDown}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-2">Add Item</h3>
            <p className="text-gray-600 mb-4">{pendingItem?.name}</p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600"
              >
                -
              </button>
              <input
                ref={quantityInputRef}
                type="number"
                min="1"
                className="w-20 text-center text-2xl font-bold border-b-2 border-blue-500 focus:outline-none"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600"
              >
                +
              </button>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowQuantityPopup(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel (Esc)
              </button>
              <button 
                onClick={confirmAddToCart}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold"
              >
                Add (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Selection */}
      <div className="flex-1 bg-white p-6 rounded-lg shadow-md flex flex-col">
        <h2 className="text-xl font-bold mb-4">Menu</h2>
        
        <div className="mb-4 relative">
          <input
            ref={searchInputRef}
            type="text"
            className="w-full p-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={showQuantityPopup}
          />
          {searchQuery === '' && cart.length > 0 && (
            <div className="absolute right-3 top-3 text-gray-400 text-sm">
              Press Enter to Print
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, index) => (
              <div 
                key={item.id} 
                onClick={() => initiateAddToCart(item)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  index === selectedIndex 
                    ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300' 
                    : 'hover:bg-blue-50 border-gray-200'
                }`}
              >
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-600">₹{item.price.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{item.category_name}</p>
              </div>
            ))}
          </div>
          {filteredItems.length === 0 && (
            <p className="text-center text-gray-500 mt-10">No items found.</p>
          )}
        </div>
      </div>

      {/* Cart & Billing */}
      <div className="w-96 bg-white p-6 rounded-lg shadow-md flex flex-col">
        <h2 className="text-xl font-bold mb-4">Current Order</h2>
        
        {settings.enable_tables === 'true' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Table</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={selectedTable || ''}
              onChange={(e) => setSelectedTable(Number(e.target.value))}
              disabled={showQuantityPopup}
            >
              <option value="">Choose a table...</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-4">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.quantity} x ₹{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 px-2"
                    disabled={showQuantityPopup}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between text-xl font-bold mb-4">
            <span>Total:</span>
            <span>₹{calculateTotal().toFixed(2)}</span>
          </div>
          <button 
            onClick={handlePrint}
            disabled={cart.length === 0 || (settings.enable_tables === 'true' && !selectedTable) || showQuantityPopup}
            className={`w-full py-3 rounded-lg text-white transition-colors ${
               cart.length > 0 && (!settings.enable_tables || selectedTable)
               ? 'bg-green-600 hover:bg-green-700 shadow-lg transform scale-105' 
               : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
            }`}
          >
            {cart.length > 0 && searchQuery === '' ? 'Print Bill (Enter)' : 'Print Bill'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billing;