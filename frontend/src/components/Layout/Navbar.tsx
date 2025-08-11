import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Bars3Icon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import GlobalSearch from '../GlobalSearch';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-100">
        <div className="px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={onMenuClick} className="p-2 rounded-xl text-gray-400 lg:hidden hover:text-gray-600 hover:bg-gray-50 transition-all" aria-label="Open menu">
                <Bars3Icon className="h-6 w-6" />
              </button>
              <Link to="/dashboard" className="flex items-center ml-2 lg:ml-0">
                <div className="h-8 w-8 bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-medium text-gray-900">RG Vaults</h1>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Global Search */}
              <div className="hidden sm:block">
                <button
                  onClick={() => setShowGlobalSearch(true)}
                  className="flex items-center w-80 text-left px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all group"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3 group-hover:text-gray-600 transition-colors" />
                  <span className="text-gray-500 text-sm">Search everything...</span>
                  <div className="ml-auto">
                    <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded">⌘K</kbd>
                  </div>
                </button>
              </div>

              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setShowGlobalSearch(true)}
                aria-label="Open global search"
                className="sm:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all group">
                  <div className="flex items-center space-x-2">
                    <UserCircleIcon className="h-8 w-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">RG Vault</p>
                    </div>
                  </div>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Global Search Modal */}
      {showGlobalSearch && <GlobalSearch onClose={() => setShowGlobalSearch(false)} />}

      {/* Click outside to close user menu */}
      {showUserMenu && <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />}
    </>
  );
};

export default Navbar;
