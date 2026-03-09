import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import { useAuth } from '../../context/AuthContext';
import { isQrManager } from '../../utils/organization';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const qrManagerView = isQrManager(user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100/50 to-gray-50 flex flex-col">
      {!qrManagerView && <Navbar />}

      <div className="flex flex-1 pt-16">
        {!qrManagerView && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}

        <main className={`flex-1 min-h-[calc(100vh-4rem)] overflow-auto ${qrManagerView ? 'pt-0' : ''}`}>
          <div className={`${qrManagerView ? 'pr-8 pl-4 pt-0' : 'max-w-7xl mx-auto px-4 py-8'} fade-in`}>
            {children}
          </div>
        </main>
      </div>

      {!qrManagerView && <MobileBottomNav />}
    </div>
  );
};

export default Layout;
