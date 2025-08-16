import { useEffect, useRef, useState } from 'react';
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

  // Refs for click-outside handling
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close on outside click (no overlay needed)
  useEffect(() => {
    if (!showUserMenu) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target) && userButtonRef.current && !userButtonRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [showUserMenu]);

  // Close on Escape; open GlobalSearch on ⌘/Ctrl + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowGlobalSearch(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    try {
      // Support both sync/async logout implementations
      await Promise.resolve(logout());
    } finally {
      setShowUserMenu(false);
      navigate('/');
    }
  };

  return (
    <>
      <nav
        className={`
          sticky top-0 z-50
          border-b border-white/20
          bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60
          shadow-sm
        `}
        aria-label="Top navigation"
      >
        <div className="px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between h-16">
            {/* Left: brand + menu */}
            <div className="flex items-center">
              <button type="button" onClick={onMenuClick} className="p-2 rounded-xl text-slate-400 lg:hidden hover:text-slate-700 hover:bg-white/70 transition-colors" aria-label="Open menu">
                <Bars3Icon className="h-6 w-6" />
              </button>

              <Link to="/dashboard" className="flex items-center ml-2 lg:ml-0 group">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-md flex items-center justify-center mr-3 transition-transform group-hover:rotate-6">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">RG Vaults</h1>
              </Link>
            </div>

            {/* Right: search + profile */}
            <div className="flex items-center space-x-4">
              {/* Global Search (desktop) */}
              <div className="hidden sm:block">
                <button
                  type="button"
                  onClick={() => setShowGlobalSearch(true)}
                  className={`
                    group flex items-center w-80 text-left px-4 py-2 rounded-xl
                    bg-white/60 hover:bg-white focus:outline-none
                    ring-1 ring-inset ring-slate-200 hover:ring-slate-300 focus:ring-2 focus:ring-blue-500
                    shadow-inner transition-all duration-200
                  `}
                  aria-label="Open global search"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 mr-3 group-hover:text-slate-600 transition-colors" />
                  <span className="text-slate-500 text-sm">Search everything...</span>
                  <div className="ml-auto">
                    <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded">⌘K</kbd>
                  </div>
                </button>
              </div>

              {/* Global Search (mobile) */}
              <button
                type="button"
                onClick={() => setShowGlobalSearch(true)}
                aria-label="Open global search"
                className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  type="button"
                  ref={userButtonRef}
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/70 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                  aria-controls="user-menu"
                >
                  {/* Avatar (fallback to icon) */}
                  <UserCircleIcon className="h-8 w-8 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500">RG Vault</p>
                  </div>
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div
                    id="user-menu"
                    ref={userMenuRef}
                    role="menu"
                    aria-orientation="vertical"
                    className={`
                      absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl
                      ring-1 ring-black/5 py-2 z-50 origin-top-right
                      animate-in fade-in zoom-in-95 duration-150
                    `}
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <Link to="/profile" role="menuitem" className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setShowUserMenu(false)}>
                      Profile
                    </Link>

                    <button type="button" role="menuitem" onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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
    </>
  );
};

export default Navbar;
