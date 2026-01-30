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
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-blue-600">Easy Bill</h1>
          </div>
          <nav className="p-4 space-y-2">
            <Link to="/" className="flex items-center p-2 text-gray-700 hover:bg-blue-50 rounded-md">
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link to="/billing" className="flex items-center p-2 text-gray-700 hover:bg-blue-50 rounded-md">
              <Receipt className="w-5 h-5 mr-3" />
              Billing
            </Link>
            <Link to="/reports" className="flex items-center p-2 text-gray-700 hover:bg-blue-50 rounded-md">
              <FileText className="w-5 h-5 mr-3" />
              Reports
            </Link>
            <Link to="/settings" className="flex items-center p-2 text-gray-700 hover:bg-blue-50 rounded-md">
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;