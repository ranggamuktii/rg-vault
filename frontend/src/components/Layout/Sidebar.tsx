import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, DocumentTextIcon, LinkIcon, FolderIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

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

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose}>
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <div className={clsx('fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0', isOpen ? 'translate-x-0' : '-translate-x-full')}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 lg:hidden">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900">Personal Hub</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all" aria-label="Close sidebar">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-6">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={clsx('group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all', isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900')}
                  >
                    <item.icon className={clsx('mr-4 h-6 w-6 transition-colors', isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Need Help?</h3>
            <p className="text-xs text-blue-700 mb-3">Check out our documentation and guides</p>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Learn more →</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
