import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, FileText, Settings as SettingsIcon } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({ orders: 0, revenue: 0 });

  useEffect(() => {
    const loadData = async () => {
      const today = new Date().toISOString().split('T')[0];
      const report = await window.api.getSalesReport({ startDate: today, endDate: today });
      setStats({
        orders: report?.total_orders || 0,
        revenue: report?.total_revenue || 0
      });
    };
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Welcome to Easy Bill</h2>
        <p className="text-gray-600 mt-2">Manage your restaurant operations efficiently.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Today's Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.orders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Today's Revenue</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">₹ {stats.revenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/billing" className="flex items-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md group">
          <div className="p-3 bg-white/20 rounded-lg mr-4">
            <Receipt size={24} />
          </div>
          <div>
            <p className="font-bold">New Billing</p>
            <p className="text-xs text-blue-100">Create new KOT/Bill</p>
          </div>
        </Link>

        <Link to="/reports" className="flex items-center p-4 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors shadow-sm group">
          <div className="p-3 bg-gray-100 rounded-lg mr-4 text-gray-600 group-hover:bg-gray-200">
            <FileText size={24} />
          </div>
          <div>
            <p className="font-bold">Reports</p>
            <p className="text-xs text-gray-500">View sales analytics</p>
          </div>
        </Link>

        <Link to="/settings" className="flex items-center p-4 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors shadow-sm group">
          <div className="p-3 bg-gray-100 rounded-lg mr-4 text-gray-600 group-hover:bg-gray-200">
            <SettingsIcon size={24} />
          </div>
          <div>
            <p className="font-bold">Settings</p>
            <p className="text-xs text-gray-500">Configure app & printers</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;