'use client';

import type React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, DocumentTextIcon, LinkIcon, FolderIcon, XMarkIcon, CommandLineIcon, MagnifyingGlassIcon, StarIcon, ClockIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useNoteStore } from '../../store/noteStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { useRef, useState, useEffect } from 'react';
import GlobalSearch from '../GlobalSearch';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuClick: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Notes', href: '/notes', icon: DocumentTextIcon },
  { name: 'Links', href: '/links', icon: LinkIcon },
  { name: 'Files', href: '/files', icon: FolderIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { createNote } = useNoteStore();
  const { user, logout } = useAuthStore();

  const quickNoteRef = useRef<HTMLTextAreaElement>(null);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userButtonRef = useRef<HTMLButtonElement | null>(null);

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

  const handleQuickCapture = async () => {
    const content = quickNoteRef.current?.value.trim();
    if (!content) return;
    try {
      await createNote({
        title: `Quick Note - ${new Date().toLocaleDateString()}`,
        content,
        tags: ['quick-capture'],
      });
      toast.success('Quick note saved!');
      if (quickNoteRef.current) quickNoteRef.current.value = '';
      setShowQuickCapture(false);
    } catch {
      toast.error('Failed to save quick note');
    }
  };

  const handleLogout = async () => {
    try {
      await Promise.resolve(logout());
    } finally {
      setShowUserMenu(false);
      navigate('/login');
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose}>
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" />
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={onMenuClick}
          className="fixed top-4 left-4 z-30 p-2 rounded-xl text-slate-400 lg:hidden hover:text-slate-700 hover:bg-white/70 transition-colors shadow-lg bg-white/80 backdrop-blur-xl"
          aria-label="Open menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar */}
      <div className={clsx('fixed inset-y-0 left-0 z-50 w-72 sm:w-80 transform lg:translate-x-0 lg:static lg:inset-0', 'transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]', isOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="h-full max-h-screen border-r bg-white/80 backdrop-blur-xl border-white/20 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/20 flex-shrink-0">
            <Link to="/dashboard" className="flex items-center group">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md flex items-center justify-center mr-3 transition-transform group-hover:rotate-6">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">RG Vault</h1>
            </Link>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/70 transition-colors lg:hidden" aria-label="Close sidebar">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-white/20 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowGlobalSearch(true)}
              className="group flex items-center w-full text-left px-4 py-3 rounded-xl bg-white/60 hover:bg-white focus:outline-none ring-1 ring-inset ring-slate-200 hover:ring-slate-300 focus:ring-2 focus:ring-blue-500 shadow-inner transition-all duration-200"
              aria-label="Open global search"
            >
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 mr-3 group-hover:text-slate-600 transition-colors" />
              <span className="text-slate-500 text-sm">Search everything...</span>
              <div className="ml-auto">
                <kbd className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded">⌘K</kbd>
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-4 flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1.5">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={clsx(
                        'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                        isActive ? 'bg-gradient-to-r from-blue-50 to-blue-50 text-blue-700 ring-1 ring-blue-500/20 shadow-sm' : 'text-slate-700 hover:bg-white/70 hover:ring-1 hover:ring-slate-200'
                      )}
                    >
                      <item.icon className={clsx('h-5 w-5 transition-all', isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-110')} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Quick Actions */}
          <div className="p-6 border-t border-white/20 space-y-2 flex-shrink-0">
            <button
              onClick={() => setShowQuickCapture(true)}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-all ring-1 ring-orange-200/50"
            >
              <div className="p-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg shadow-sm">
                <CommandLineIcon className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Quick Capture</p>
                <p className="text-xs text-gray-500">Instant note</p>
              </div>
            </button>

            <button
              onClick={() => toast.success('Coming soon!')}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 transition-all ring-1 ring-pink-200/50"
            >
              <div className="p-2 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg shadow-sm">
                <StarIcon className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Favorites</p>
                <p className="text-xs text-gray-500">Quick access</p>
              </div>
            </button>

            <button
              onClick={() => toast.success('Coming soon!')}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 transition-all ring-1 ring-teal-200/50"
            >
              <div className="p-2 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg shadow-sm">
                <ClockIcon className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Recent</p>
                <p className="text-xs text-gray-500">Last viewed</p>
              </div>
            </button>
          </div>

          <div className="p-6 border-t border-white/20 flex-shrink-0">
            <div className="relative">
              <button
                type="button"
                ref={userButtonRef}
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/70 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                aria-controls="user-menu"
              >
                <UserCircleIcon className="h-8 w-8 text-slate-400 group-hover:text-slate-600 transition-colors" />
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || 'user@rgvault.com'}</p>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div
                  id="user-menu"
                  ref={userMenuRef}
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute bottom-full left-0 mb-2 w-full rounded-xl bg-white shadow-xl ring-1 ring-black/5 py-2 z-50 origin-bottom animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>

                  <Link to="/profile" role="menuitem" className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setShowUserMenu(false)}>
                    Profile Settings
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

      {/* Quick Capture Modal */}
      {showQuickCapture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowQuickCapture(false)} />
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative z-10">
            <h4 className="font-medium text-gray-900 mb-3">Quick Capture</h4>
            <textarea
              ref={quickNoteRef}
              placeholder="Jot down a quick thought..."
              className="w-full p-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleQuickCapture();
              }}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-gray-500">Press Ctrl+Enter to save</span>
              <button onClick={handleQuickCapture} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 text-sm shadow-sm">
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {showGlobalSearch && <GlobalSearch onClose={() => setShowGlobalSearch(false)} />}
    </>
  );
};

export default Sidebar;
