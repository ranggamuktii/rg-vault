import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, DocumentTextIcon, LinkIcon, FolderIcon, XMarkIcon, CommandLineIcon, MagnifyingGlassIcon, StarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useNoteStore } from '../../store/noteStore';
import { toast } from 'react-hot-toast';
import { useRef, useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Notes', href: '/notes', icon: DocumentTextIcon },
  { name: 'Links', href: '/links', icon: LinkIcon },
  { name: 'Files', href: '/files', icon: FolderIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { createNote } = useNoteStore();

  const quickNoteRef = useRef<HTMLTextAreaElement>(null);
  const [showQuickCapture, setShowQuickCapture] = useState(false);

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

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose}>
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" />
        </div>
      )}

      {/* Sidebar (no shadow) */}
      <div className={clsx('fixed inset-y-0 left-0 z-50 w-72 transform lg:translate-x-0 lg:static lg:inset-0', 'transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]', isOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="h-full border-r bg-white/80 backdrop-blur-xl border-white/20 flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/20 lg:hidden">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Personal Hub</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/70 transition-colors" aria-label="Close sidebar">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-4 flex-1">
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
                        isActive ? 'bg-white text-blue-700 ring-1 ring-blue-500/20' : 'text-slate-700 hover:bg-white/70 hover:ring-1 hover:ring-slate-200'
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

          {/* Quick Actions (no shadow) */}
          <div className="p-6 border-t border-white/20 space-y-2">
            <button onClick={() => setShowQuickCapture(true)} className="flex items-center gap-3 w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CommandLineIcon className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Quick Capture</p>
                <p className="text-xs text-gray-500">Instant note</p>
              </div>
            </button>

            <button onClick={() => navigate('/search')} className="flex items-center gap-3 w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MagnifyingGlassIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Search All</p>
                <p className="text-xs text-gray-500">Find anything</p>
              </div>
            </button>

            <button onClick={() => toast.success('Coming soon!')} className="flex items-center gap-3 w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
              <div className="p-2 bg-pink-100 rounded-lg">
                <StarIcon className="h-4 w-4 text-pink-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Favorites</p>
                <p className="text-xs text-gray-500">Quick access</p>
              </div>
            </button>

            <button onClick={() => toast.success('Coming soon!')} className="flex items-center gap-3 w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
              <div className="p-2 bg-teal-100 rounded-lg">
                <ClockIcon className="h-4 w-4 text-teal-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Recent</p>
                <p className="text-xs text-gray-500">Last viewed</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Capture Modal (tetap pakai shadow supaya focus jelas) */}
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
              <button onClick={handleQuickCapture} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
