import React, { useState, useEffect } from 'react';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [summary, setSummary] = useState({
    total_orders: 0,
    total_revenue: 0,
    average_order_value: 0
  });

  const [itemSales, setItemSales] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    const s = await window.api.getSalesReport(dateRange);
    setSummary(s || { total_orders: 0, total_revenue: 0, average_order_value: 0 });

    const items = await window.api.getItemSalesReport(dateRange);
    setItemSales(items || []);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sales Reports</h2>
        <div className="flex gap-2 items-center bg-white p-2 rounded shadow">
          <input 
            type="date" 
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="border rounded p-1"
          />
          <span className="text-gray-500">to</span>
          <input 
            type="date" 
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="border rounded p-1"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm font-medium uppercase">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-800">₹{(summary.total_revenue || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <p className="text-gray-500 text-sm font-medium uppercase">Total Orders</p>
          <p className="text-3xl font-bold text-gray-800">{summary.total_orders || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm font-medium uppercase">Avg. Order Value</p>
          <p className="text-3xl font-bold text-gray-800">₹{(summary.average_order_value || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Item Sales Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold mb-4">Sales by Item</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3">Item Name</th>
                <th className="p-3 text-right">Quantity Sold</th>
                <th className="p-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {itemSales.length > 0 ? (
                itemSales.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.item_name}</td>
                    <td className="p-3 text-right">{item.quantity_sold}</td>
                    <td className="p-3 text-right">₹{item.revenue.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">No sales data for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;