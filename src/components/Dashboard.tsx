import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const loadData = async () => {
      // @ts-ignore
      const t = await window.api.getTables();
      setTables(t);
      // @ts-ignore
      const s = await window.api.getSettings();
      setSettings(s);
    };
    loadData();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      {settings.enable_tables === 'true' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div 
              key={table.id} 
              className={`p-6 rounded-lg shadow-md ${
                table.status === 'available' ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'
              } border`}
            >
              <h3 className="text-xl font-semibold mb-2">{table.name}</h3>
              <p className="text-gray-600 mb-4">Capacity: {table.capacity}</p>
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-sm ${
                  table.status === 'available' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {table.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600">Table management is currently disabled. You can enable it in Settings.</p>
          <p className="mt-4 text-lg font-semibold">Quick Actions</p>
          <div className="mt-2 flex gap-4">
             <Link to="/billing" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Go to Billing</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;