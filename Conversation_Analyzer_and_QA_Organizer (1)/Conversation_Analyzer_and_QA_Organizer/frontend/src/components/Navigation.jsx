import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';
import { BarChart3, Upload, User, LogOut, Briefcase } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, userName, logout } = useRole();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (!role) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <Link to={role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'} className="text-xl font-bold text-gray-800">
              Q&A Analyzer
            </Link>
            <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${
              role === 'hr' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {role === 'hr' ? 'HR' : 'Candidate'}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {role === 'hr' ? (
              <>
                <Link
                  to="/hr/dashboard"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/hr/dashboard')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/hr/upload"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/hr/upload')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </Link>
              </>
            ) : (
              <Link
                to="/candidate/dashboard"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/candidate/dashboard')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Practice</span>
              </Link>
            )}

            {/* User Info and Logout */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              {userName && (
                <span className="text-sm text-gray-600">
                  {userName}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

