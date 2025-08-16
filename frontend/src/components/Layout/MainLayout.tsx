import type React from 'react';
import { useState } from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex flex-col w-0 flex-1 overflow-hidden lg:pl-0">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-10 lg:px-12">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
