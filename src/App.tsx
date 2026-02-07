import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Receipt, Settings, FileText } from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import Billing from './components/Billing';
import Reports from './components/Reports';
import SettingsPage from './components/Settings';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-200 overflow-hidden font-sans">
        {/* Sidebar */}
        <div className="w-16 lg:w-64 bg-white border-r border-gray-400 flex flex-col">
          <div className="p-4 border-b border-gray-400 flex justify-center lg:justify-start">
            <h1 className="text-xl font-bold text-black hidden lg:block">EASY BILL</h1>
            <span className="text-xl font-bold text-black lg:hidden">EB</span>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            <Link to="/" className="flex items-center p-3 text-black hover:bg-gray-200 border border-transparent hover:border-gray-400 transition-colors">
              <LayoutDashboard className="w-6 h-6 lg:mr-3" />
              <span className="hidden lg:block font-bold">DASHBOARD</span>
            </Link>
            <Link to="/billing" className="flex items-center p-3 text-black hover:bg-gray-200 border border-transparent hover:border-gray-400 transition-colors">
              <Receipt className="w-6 h-6 lg:mr-3" />
              <span className="hidden lg:block font-bold">BILLING</span>
            </Link>
            <Link to="/reports" className="flex items-center p-3 text-black hover:bg-gray-200 border border-transparent hover:border-gray-400 transition-colors">
              <FileText className="w-6 h-6 lg:mr-3" />
              <span className="hidden lg:block font-bold">REPORTS</span>
            </Link>
            <Link to="/settings" className="flex items-center p-3 text-black hover:bg-gray-200 border border-transparent hover:border-gray-400 transition-colors">
              <Settings className="w-6 h-6 lg:mr-3" />
              <span className="hidden lg:block font-bold">SETTINGS</span>
            </Link>
          </nav>
          <div className="p-4 border-t border-gray-400 text-xs text-center text-gray-500">
            v1.0.0
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