import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { Search, RotateCcw, Printer, Save, Trash2, AlertTriangle } from 'lucide-react';

const Billing = () => {
  const { showToast } = useToast();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Quantity Popup State
  const [showQuantityPopup, setShowQuantityPopup] = useState(false);
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Table Selection Popup State
  const [showTablePopup, setShowTablePopup] = useState(false);
  const [tableInput, setTableInput] = useState('0');

  // Delete Confirmation Popup State
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  // Pending Bills State
  const [pendingBills, setPendingBills] = useState<any[]>([]);
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  const [filteredPendingBills, setFilteredPendingBills] = useState<any[]>([]);
  const [pendingSelectedIndex, setPendingSelectedIndex] = useState(-1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const tableInputRef = useRef<HTMLInputElement>(null);
  const pendingSearchInputRef = useRef<HTMLInputElement>(null);
  const deleteConfirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const items = await window.api.getMenuItems();
      setMenuItems(items);
      setFilteredItems(items);
      
      const t = await window.api.getTables();
      setTables(t);
      
      const s = await window.api.getSettings();
      setSettings(s);

      loadPendingBills();
    };
    loadData();
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const loadPendingBills = async () => {
    const orders = await window.api.getPendingOrders();
    setPendingBills(orders || []);
  };

  useEffect(() => {
    if (!pendingSearchQuery) {
      setFilteredPendingBills(pendingBills);
    } else {
      const lower = pendingSearchQuery.toLowerCase();
      const filtered = pendingBills.filter(order => 
        (order.table_name && order.table_name.toLowerCase().includes(lower)) ||
        order.id.toString().includes(lower) ||
        (order.table_id === null && "takeaway".includes(lower))
      );
      setFilteredPendingBills(filtered);
    }
    setPendingSelectedIndex(-1); // Reset selection on search change
  }, [pendingSearchQuery, pendingBills]);

  // Logic: Auto-load order ONLY for specific tables.
  useEffect(() => {
    const loadTableOrder = async () => {
      if (selectedTable && selectedTable > 0) {
        const order = await window.api.getOpenOrder(selectedTable);
        if (order) {
          loadOrderToCart(order);
        } else {
          setCurrentOrderId(null);
          setCart([]);
        }
      }
    };
    
    // Only verify table order if we aren't already working on a specific order ID loaded from pending
    if (selectedTable && !currentOrderId) {
        loadTableOrder();
    } else if (selectedTable && currentOrderId) {
        // If we have an order ID, double check it matches table if table switched? 
        // Actually, if user manually switches table dropdown, we should probably reset or check.
        // For simplicity, let's assume if currentOrderId is set, we are in "Edit Mode"
    }
  }, [selectedTable]);

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

  // Focus Management
  useEffect(() => {
    if (showQuantityPopup) {
      setTimeout(() => {
        if (quantityInputRef.current) {
          quantityInputRef.current.focus();
          quantityInputRef.current.select();
        }
      }, 50);
    } else if (showTablePopup) {
      setTimeout(() => {
        if (tableInputRef.current) {
          tableInputRef.current.focus();
          tableInputRef.current.select();
        }
      }, 50);
    } else if (showDeletePopup) {
      setTimeout(() => {
        if (deleteConfirmButtonRef.current) {
          deleteConfirmButtonRef.current.focus();
        }
      }, 50);
    } else {
      // Only return focus to main search if we are NOT in pending search
      if (document.activeElement !== pendingSearchInputRef.current) {
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 50);
      }
    }
  }, [showQuantityPopup, showTablePopup, showDeletePopup]);

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const newTableId = val === '' ? null : Number(val);
    
    if (newTableId === 0 || newTableId === null) {
      setCurrentOrderId(null);
      setCart([]);
    }
    
    setSelectedTable(newTableId);
    // Trigger reload if table has existing order is handled by useEffect
  };

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
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const refreshAfterAction = async () => {
    setCart([]);
    setSelectedTable(null);
    setCurrentOrderId(null);
    
    const t = await window.api.getTables();
    setTables(t);
    loadPendingBills();
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleSave = async () => {
    try {
      if (cart.length === 0) {
          showToast('Cart is empty', 'error');
          return;
      }

      if (currentOrderId) {
        await window.api.saveOrder({
          orderId: currentOrderId,
          items: cart,
          tableId: selectedTable === 0 ? null : selectedTable
        });
        await window.api.printBill({ items: cart, tableId: selectedTable, type: 'KOT', total: 0 });
        showToast('Order updated & KOT printed', 'success');
        refreshAfterAction();
        return;
      }

      if (selectedTable && selectedTable > 0) {
        const order = await window.api.createOrder(selectedTable);
        await window.api.saveOrder({
          orderId: order.id,
          items: cart,
          tableId: selectedTable
        });
        await window.api.printBill({ items: cart, tableId: selectedTable, type: 'KOT', total: 0 });
        showToast('Order created & KOT printed', 'success');
        refreshAfterAction();
        return;
      }

      setTableInput('0');
      setShowTablePopup(true);
    } catch (error: any) {
      showToast('Error saving order: ' + error.message, 'error');
      console.error(error);
    }
  };

  const confirmTablePopup = async () => {
    try {
      const tableId = parseInt(tableInput);
      
      if (tableId !== 0) {
        const tableExists = tables.find(t => t.id === tableId);
        if (!tableExists) {
          showToast('Table does not exist!', 'error');
          return;
        }
      }

      const order = await window.api.createOrder(tableId === 0 ? null : tableId);
      
      await window.api.saveOrder({
        orderId: order.id,
        items: cart,
        tableId: tableId === 0 ? null : tableId
      });

      await window.api.printBill({ 
        items: cart, 
        tableId: tableId === 0 ? null : tableId, 
        type: 'KOT', 
        total: 0 
      });

      setShowTablePopup(false);
      showToast('Order created & KOT printed', 'success');
      refreshAfterAction();
    } catch (error: any) {
      showToast('Error confirming order: ' + error.message, 'error');
    }
  };

  const handlePrint = async () => {
    try {
      if (cart.length === 0) {
          showToast('Cart is empty', 'error');
          return;
      }

      if (settings.enable_tables === 'true' && selectedTable === null && !currentOrderId) {
        showToast('Please select a table or save order first', 'error');
        return;
      }
      
      const total = calculateTotal();
      let orderId = currentOrderId;
      const dbTableId = selectedTable === 0 ? null : selectedTable;

      if (!orderId) {
        const order = await window.api.createOrder(dbTableId);
        orderId = order.id;
      }

      await window.api.closeOrder({
        orderId: orderId!,
        total: total,
        items: cart,
        paymentMethod: 'Cash',
        tableId: dbTableId
      });

      const billData = {
        items: cart,
        total: total,
        tableId: dbTableId
      };

      const result = await window.api.printBill(billData);
      
      if (result.success) {
        console.log('Bill printed successfully!');
        showToast('Bill printed successfully!', 'success');
        refreshAfterAction();
      } else {
        showToast('Printing failed: ' + result.error, 'error');
      }
    } catch (error: any) {
      showToast('Error printing bill: ' + error.message, 'error');
      console.error(error);
    }
  };

  const handleDeleteOrder = (orderId: number) => {
    setOrderToDelete(orderId);
    setShowDeletePopup(true);
  };

  const confirmDeleteOrder = async () => {
    if (orderToDelete) {
      await window.api.deleteOrder(orderToDelete);
      showToast('Order deleted', 'success');
      loadPendingBills();
      if (currentOrderId === orderToDelete) {
        refreshAfterAction();
      }
      setShowDeletePopup(false);
      setOrderToDelete(null);
    }
  };

  const handleMainKeyDown = (e: React.KeyboardEvent) => {
    if (showQuantityPopup || showTablePopup || showDeletePopup) return;

    // F1: Focus Search
    if (e.key === 'F1') {
      e.preventDefault();
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
      return;
    }

    // F2: Focus Pending Orders
    if (e.key === 'F2') {
      e.preventDefault();
      if (pendingSearchInputRef.current) {
        pendingSearchInputRef.current.focus();
        if (filteredPendingBills.length > 0) {
          setPendingSelectedIndex(0);
        }
      }
      return;
    }

    // F4: Save / Print KOT
    if (e.key === 'F4') {
      e.preventDefault();
      handleSave();
      return;
    }

    // F5: Print Bill
    if (e.key === 'F5') {
      e.preventDefault();
      handlePrint();
      return;
    }

    // Arrow Keys for Menu Search (only if search input is focused)
    if (document.activeElement === searchInputRef.current) {
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
          handleSave(); // Enter on empty search saves/prints KOT
        }
      }
    }
  };

  const handlePendingKeyDown = (e: React.KeyboardEvent) => {
    // Only handle nav if we have bills
    if (filteredPendingBills.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPendingSelectedIndex(prev => (prev + 1) % filteredPendingBills.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPendingSelectedIndex(prev => (prev - 1 + filteredPendingBills.length) % filteredPendingBills.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (pendingSelectedIndex !== -1) {
        loadOrderToCart(filteredPendingBills[pendingSelectedIndex]);
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    } else if (e.key === 'Delete') {
      e.preventDefault();
      if (pendingSelectedIndex !== -1) {
        handleDeleteOrder(filteredPendingBills[pendingSelectedIndex].id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (searchInputRef.current) searchInputRef.current.focus();
      setPendingSelectedIndex(-1);
    }
  };

  const handlePopupKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();

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
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  };

  const handleTablePopupKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      confirmTablePopup();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowTablePopup(false);
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  };

  const handleDeletePopupKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      confirmDeleteOrder();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowDeletePopup(false);
      setOrderToDelete(null);
      if (pendingSearchInputRef.current) pendingSearchInputRef.current.focus();
    }
  };

  const loadOrderToCart = (order: any) => {
    const normalizedItems = order.items.map((item: any) => ({
      ...item,
      name: item.item_name || item.name,
      id: item.item_id || item.id
    }));

    setCurrentOrderId(order.id);
    setCart(normalizedItems);
    setSelectedTable(order.table_id === null ? 0 : order.table_id);
  };

  return (
    <div className="flex h-full gap-4 relative bg-gray-200 p-4 overflow-hidden" onKeyDown={handleMainKeyDown}>
      
      {/* Quantity Popup Overlay */}
      {showQuantityPopup && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <div 
            className="bg-white border-2 border-black p-6 w-80 shadow-none"
            onKeyDown={handlePopupKeyDown}
          >
            <h3 className="text-lg font-bold text-black mb-2 border-b border-gray-300 pb-2">Add Item</h3>
            <p className="text-black mb-4 font-mono">{pendingItem?.name}</p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 border border-black bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-black"
              >
                -
              </button>
              <input
                ref={quantityInputRef}
                type="number"
                min="1"
                className="w-20 text-center text-xl font-bold border border-black p-1 focus:outline-none focus:ring-1 focus:ring-black"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 border border-black bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-black"
              >
                +
              </button>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowQuantityPopup(false)}
                className="flex-1 py-1 border border-black text-black hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAddToCart}
                className="flex-1 py-1 border border-black bg-black text-white hover:bg-gray-800"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Selection Popup */}
      {showTablePopup && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <div 
            className="bg-white border-2 border-black p-6 w-80 shadow-none"
            onKeyDown={handleTablePopupKeyDown}
          >
            <h3 className="text-lg font-bold text-black mb-4 border-b border-gray-300 pb-2">Enter Table Number</h3>
            <p className="text-sm text-gray-600 mb-4 font-mono">0 = Takeaway</p>
            
            <input
              ref={tableInputRef}
              type="number"
              className="w-full p-2 border border-black text-2xl font-bold text-center mb-6 focus:outline-none focus:ring-1 focus:ring-black"
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setShowTablePopup(false)}
                className="flex-1 py-1 border border-black text-black hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={confirmTablePopup}
                className="flex-1 py-1 border border-black bg-black text-white hover:bg-gray-800"
              >
                Print KOT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <div 
            className="bg-white border-2 border-black p-6 w-80 shadow-none text-center"
            onKeyDown={handleDeletePopupKeyDown}
          >
            <div className="flex justify-center mb-3">
              <AlertTriangle className="text-red-600" size={48} />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Delete Order?</h3>
            <p className="text-gray-600 mb-6 font-mono text-sm">
              Are you sure you want to delete order #{orderToDelete}? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowDeletePopup(false); setOrderToDelete(null); }}
                className="flex-1 py-2 border border-black text-black hover:bg-gray-100 font-bold uppercase"
              >
                Cancel
              </button>
              <button 
                ref={deleteConfirmButtonRef}
                onClick={confirmDeleteOrder}
                className="flex-1 py-2 border border-black bg-red-600 text-white hover:bg-red-700 font-bold uppercase"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Column: Menu & Pending Bills */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        
        {/* Menu Selection */}
        <div className="flex-1 bg-white border border-gray-400 p-4 flex flex-col min-h-0 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-3 flex-shrink-0">
             <h2 className="text-lg font-bold text-black uppercase tracking-wide flex items-center gap-2">
               <Search size={20} />
               Menu Search
             </h2>
             <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-bold">F1</span>
          </div>
          
          <div className="mb-2 relative flex-shrink-0">
            <input
              ref={searchInputRef}
              type="text"
              className="w-full p-2 border border-gray-400 text-lg focus:outline-none focus:border-black font-mono transition-colors focus:bg-blue-50"
              placeholder="Search item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={showQuantityPopup || showTablePopup || showDeletePopup}
            />
            {searchQuery === '' && cart.length > 0 && (
              <div className="absolute right-3 top-3 text-gray-500 text-xs font-bold">
                [ENTER] to Save
              </div>
            )}
          </div>

          {/* Only show list if searching */}
          {searchQuery ? (
            <div className="flex-1 overflow-y-auto border border-gray-200 bg-gray-50">
              <div className="flex flex-col">
                {filteredItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    onClick={() => initiateAddToCart(item)}
                    className={`p-2 border-b border-gray-200 cursor-pointer flex justify-between items-center font-mono text-sm transition-colors ${
                      index === selectedIndex 
                        ? 'bg-black text-white' 
                        : 'hover:bg-gray-200 text-black'
                    }`}
                  >
                    <div>
                      <span className="font-bold">{item.name}</span>
                      <span className={`ml-2 text-xs ${index === selectedIndex ? 'text-gray-300' : 'text-gray-500'}`}>
                        {item.category_name}
                      </span>
                    </div>
                    <span className="font-bold">₹{item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {filteredItems.length === 0 && (
                <p className="text-center text-gray-500 mt-4 font-mono">No items found.</p>
              )}
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-gray-400 font-mono text-sm">
               Type to search (F1)
             </div>
          )}
        </div>

        {/* Pending Bills Section */}
        <div className="flex-1 bg-white border border-gray-400 p-4 flex flex-col min-h-0 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-3 flex-shrink-0">
            <h2 className="text-lg font-bold text-black uppercase tracking-wide flex items-center gap-2">
              <RotateCcw size={20} />
              Pending Orders
            </h2>
            <div className="flex items-center gap-2">
                <input 
                  ref={pendingSearchInputRef}
                  type="text" 
                  placeholder="Search..." 
                  className="p-1 border border-gray-400 text-xs font-mono w-32 focus:outline-none focus:border-black focus:bg-yellow-50"
                  value={pendingSearchQuery}
                  onChange={(e) => setPendingSearchQuery(e.target.value)}
                  onKeyDown={handlePendingKeyDown}
                  disabled={showDeletePopup}
                />
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-bold">F2</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-gray-50 border border-gray-200">
            {filteredPendingBills.length === 0 ? (
              <p className="text-gray-400 text-center mt-4 font-mono text-sm">No pending orders</p>
            ) : (
              <table className="w-full text-sm font-mono text-left border-collapse">
                <thead className="bg-gray-200 text-black font-bold sticky top-0">
                  <tr>
                    <th className="p-2 border-b border-gray-400">Table</th>
                    <th className="p-2 border-b border-gray-400">Token</th>
                    <th className="p-2 border-b border-gray-400">Items</th>
                    <th className="p-2 border-b border-gray-400 text-right">Total</th>
                    <th className="p-2 border-b border-gray-400 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingBills.map(order => (
                    <tr 
                      key={order.id}
                      onClick={() => loadOrderToCart(order)}
                      className={`cursor-pointer border-b border-gray-300 ${
                        currentOrderId === order.id 
                          ? 'bg-blue-100' 
                          : filteredPendingBills.indexOf(order) === pendingSelectedIndex 
                            ? 'bg-black text-white' 
                            : 'hover:bg-gray-200'
                      }`}
                    >
                      <td className="p-2 font-bold">{order.table_name || 'TKWY'}</td>
                      <td className="p-2">#{order.id}</td>
                      <td className="p-2">{order.items.length}</td>
                      <td className="p-2 font-bold text-right">₹{order.total_amount.toFixed(2)}</td>
                      <td className="p-2 text-right">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete Order (Del)"
                            disabled={showDeletePopup}
                          >
                              <Trash2 size={14} />
                          </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Cart & Billing */}
      <div className="w-96 bg-white border border-gray-400 p-4 flex flex-col overflow-hidden shadow-sm">
        <h2 className="text-lg font-bold mb-3 text-black uppercase tracking-wide border-b border-gray-300 pb-2 flex-shrink-0 flex justify-between items-center">
            <span>Current Bill</span>
            {currentOrderId && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">#{currentOrderId}</span>}
        </h2>
        
        {settings.enable_tables === 'true' && (
          <div className="mb-3 flex-shrink-0">
            <select 
              className="w-full p-2 border border-gray-400 bg-gray-50 text-sm font-mono focus:outline-none focus:border-black font-bold"
              value={selectedTable === null ? '' : selectedTable}
              onChange={handleTableChange}
              disabled={showQuantityPopup || showTablePopup || showDeletePopup}
            >
              <option value="">Select Table...</option>
              <option value="0">Takeaway</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.status === 'occupied' ? '(Occupied)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-3 border border-gray-200 bg-gray-50 p-2">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center mt-10 font-mono text-sm">Cart is empty</p>
          ) : (
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-gray-300 text-left">
                  <th className="pb-1">Item</th>
                  <th className="pb-1 text-right">Qty</th>
                  <th className="pb-1 text-right">Total</th>
                  <th className="w-4"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right font-bold">{(item.price * item.quantity).toFixed(2)}</td>
                    <td className="py-2 text-right">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-600 font-bold px-1 transition-colors"
                        disabled={showQuantityPopup || showTablePopup || showDeletePopup}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t-2 border-black pt-3 flex-shrink-0">
          <div className="flex justify-between text-xl font-bold mb-4 font-mono">
            <span>TOTAL:</span>
            <span>₹{calculateTotal().toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
             <button 
              onClick={handleSave}
              disabled={cart.length === 0 || showQuantityPopup || showTablePopup || showDeletePopup}
              className="w-full py-3 border border-black bg-gray-200 text-black hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 font-bold uppercase text-sm flex justify-between px-4 items-center group transition-all"
            >
              <span className="flex items-center gap-2"><Save size={18} /> Save & Print KOT</span>
              <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded group-hover:bg-gray-400">F4</span>
            </button>
            <button 
              onClick={handlePrint}
              disabled={cart.length === 0 || (settings.enable_tables === 'true' && selectedTable === null && !currentOrderId) || showDeletePopup}
              className="w-full py-3 border border-black bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:border-gray-400 font-bold uppercase text-sm flex justify-between px-4 items-center group transition-all"
            >
               <span className="flex items-center gap-2"><Printer size={18} /> Print Bill</span>
               <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded group-hover:bg-gray-600">F5</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;