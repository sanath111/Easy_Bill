import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, CreditCard, ShoppingBag, Calendar } from 'lucide-react';

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
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [s, items, daily, payments, categories] = await Promise.all([
        window.api.getSalesReport(dateRange),
        window.api.getItemSalesReport(dateRange),
        window.api.getSalesByDay(dateRange),
        window.api.getSalesByPaymentMethod(dateRange),
        window.api.getSalesByCategory(dateRange)
      ]);

      setSummary(s || { total_orders: 0, total_revenue: 0, average_order_value: 0 });
      setItemSales(items || []);
      setDailySales(daily || []);
      setPaymentStats(payments || []);
      setCategoryStats(categories || []);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const handleExportCSV = async () => {
    try {
      const data = await window.api.getExportData(dateRange);
      if (!data || data.length === 0) {
        alert("No data to export for this period.");
        return;
      }

      // Define CSV headers
      const headers = [
        "Order ID", "Date", "Table", "Category", "Item Name", 
        "Quantity", "Unit Price", "Total Price", "Payment Method"
      ];

      // Convert data to CSV rows
      const rows = data.map(row => [
        row.order_id,
        new Date(row.created_at).toLocaleString(),
        row.table_name || 'N/A',
        row.category_name,
        `"${row.item_name}"`, // Quote item name in case of commas
        row.quantity,
        row.price.toFixed(2),
        row.total.toFixed(2),
        row.payment_method
      ].join(","));

      const csvContent = [headers.join(","), ...rows].join("\n");
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `sales_report_${dateRange.startDate}_${dateRange.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data.");
    }
  };

  return (
    <div className="h-full bg-gray-200 p-4 overflow-y-auto space-y-4 font-mono">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold uppercase tracking-wide text-black">Sales Reports</h2>
        
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-2 items-center bg-white border border-gray-400 p-2 shadow-none">
            <input 
              type="date" 
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="border border-gray-300 p-1 text-sm font-mono focus:outline-none focus:border-black"
            />
            <span className="text-gray-500 font-bold">to</span>
            <input 
              type="date" 
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="border border-gray-300 p-1 text-sm font-mono focus:outline-none focus:border-black"
            />
          </div>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 border border-black bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors font-bold uppercase text-sm shadow-none"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-gray-400 shadow-none border-l-4 border-l-blue-600">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-black">₹{(summary.total_revenue || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 border border-gray-400 shadow-none border-l-4 border-l-green-600">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-black">{summary.total_orders || 0}</p>
        </div>
        <div className="bg-white p-4 border border-gray-400 shadow-none border-l-4 border-l-purple-600">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Avg. Order Value</p>
          <p className="text-3xl font-bold text-black">₹{(summary.average_order_value || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Methods */}
        <div className="bg-white p-4 border border-gray-400 shadow-none">
          <div className="flex items-center gap-2 mb-3 border-b border-gray-300 pb-2">
            <CreditCard className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold uppercase tracking-wide">Sales by Payment Method</h3>
          </div>
          <div className="space-y-2">
            {paymentStats.map((stat, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 hover:bg-gray-50 p-1">
                <span className="font-bold text-black">{stat.payment_method || 'Unknown'}</span>
                <div className="text-right">
                  <p className="font-bold text-black">₹{stat.total_revenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{stat.total_orders} orders</p>
                </div>
              </div>
            ))}
            {paymentStats.length === 0 && <p className="text-gray-500 text-center py-4 font-mono text-sm">No data available.</p>}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-4 border border-gray-400 shadow-none">
          <div className="flex items-center gap-2 mb-3 border-b border-gray-300 pb-2">
            <ShoppingBag className="text-orange-600" size={20} />
            <h3 className="text-lg font-bold uppercase tracking-wide">Sales by Category</h3>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {categoryStats.map((stat, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 hover:bg-gray-50 p-1">
                <span className="font-bold text-black">{stat.category_name}</span>
                <div className="text-right">
                  <p className="font-bold text-black">₹{stat.revenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{stat.quantity_sold} items sold</p>
                </div>
              </div>
            ))}
            {categoryStats.length === 0 && <p className="text-gray-500 text-center py-4 font-mono text-sm">No data available.</p>}
          </div>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="bg-white p-4 border border-gray-400 shadow-none">
        <div className="flex items-center gap-2 mb-3 border-b border-gray-300 pb-2">
          <Calendar className="text-indigo-600" size={20} />
          <h3 className="text-lg font-bold uppercase tracking-wide">Daily Sales Trend</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-2 font-bold text-black">Date</th>
                <th className="p-2 text-right font-bold text-black">Orders</th>
                <th className="p-2 text-right font-bold text-black">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {dailySales.length > 0 ? (
                dailySales.map((day, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-100 transition-colors">
                    <td className="p-2 font-mono">{day.date}</td>
                    <td className="p-2 text-right font-mono">{day.total_orders}</td>
                    <td className="p-2 text-right font-bold font-mono">₹{day.total_revenue.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500 font-mono">No sales data for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Sales Table */}
      <div className="bg-white p-4 border border-gray-400 shadow-none">
        <div className="flex items-center gap-2 mb-3 border-b border-gray-300 pb-2">
          <TrendingUp className="text-green-600" size={20} />
          <h3 className="text-lg font-bold uppercase tracking-wide">Top Selling Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-2 font-bold text-black">Item Name</th>
                <th className="p-2 text-right font-bold text-black">Quantity Sold</th>
                <th className="p-2 text-right font-bold text-black">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {itemSales.length > 0 ? (
                itemSales.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-100 transition-colors">
                    <td className="p-2 font-mono">{item.item_name}</td>
                    <td className="p-2 text-right font-mono">{item.quantity_sold}</td>
                    <td className="p-2 text-right font-bold font-mono">₹{item.revenue.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500 font-mono">No sales data for this period.</td>
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