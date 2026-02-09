import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Receipt, Settings, FileText, Menu } from 'lucide-react';
import { useState } from 'react';

// Components
import Dashboard from './components/Dashboard';
import Billing from './components/Billing';
import Reports from './components/Reports';
import SettingsPage from './components/Settings';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <Router>
      <div className="flex h-screen bg-gray-200 overflow-hidden font-sans">
        {/* Sidebar */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-400 flex flex-col`}>
          <div className="p-4 border-b border-gray-400 flex items-center justify-between">
            {!isCollapsed && <h1 className="text-xl font-bold text-black overflow-hidden whitespace-nowrap">EASY BILL</h1>}
            {isCollapsed && <span className="text-xl font-bold text-black mx-auto">EB</span>}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Menu className="w-6 h-6 text-black" />
            </button>
          </div>
          <nav className="flex-1 p-2 space-y-1 overflow-hidden">
            <Link to="/" className="flex items-center p-3 text-black hover:bg-gray-200 border border-transparent hover:border-gray-400 transition-colors group">
              <LayoutDashboard className={`w-6 h-6 flex-shrink-0 ${!isCollapsed ? 'mr-3' : 'mx-auto'}`} />
              {!isCollapsed && <span className="font-bold whitespace-nowrap">DASHBOARD</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-xs invisible group-hover:visible z-50 whitespace-nowrap">
                  DASHBOARD
                </div>
              )}
            </Link>
            <Link to="/billing" className="flex items-center p-3 text-black hover:bg-gray-200 border border-transparent hover:border-gray-400 transition-colors group">
              <Receipt className={`w-6 h-6 flex-shrink-0 ${!isCollapsed ? 'mr-3' : 'mx-auto'}`} />
              {!isCollapsed && <span className="font-bold whitespace-nowrap">BILLING</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-xs invisible group-hover:visible z-50 whitespace-nowrap">
                  BILLING
                </div>
              )}
            </Link>
            <Link to="/reports" className="flex items-center p-3 text-black hover:bg-gray-200 border border-transparent hover:border-gray-400 transition-colors group">
              <FileText className={`w-6 h-6 flex-shrink-0 ${!isCollapsed ? 'mr-3' : 'mx-auto'}`} />
              {!isCollapsed && <span className="font-bold whitespace-nowrap">REPORTS</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-xs invisible group-hover:visible z-50 whitespace-nowrap">
                  REPORTS
                </div>
              )}
            </Link>
            <Link to="/settings" className="flex items-center p-3 text-black hover:bg-gray-200 border border-transparent hover:border-gray-400 transition-colors group">
              <Settings className={`w-6 h-6 flex-shrink-0 ${!isCollapsed ? 'mr-3' : 'mx-auto'}`} />
              {!isCollapsed && <span className="font-bold whitespace-nowrap">SETTINGS</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-xs invisible group-hover:visible z-50 whitespace-nowrap">
                  SETTINGS
                </div>
              )}
            </Link>
          </nav>
          <div className="p-4 border-t border-gray-400 text-xs text-center text-gray-500 whitespace-nowrap overflow-hidden">
            {isCollapsed ? 'v1' : 'v1.0.0'}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;