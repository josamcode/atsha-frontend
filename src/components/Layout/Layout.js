import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const isQRManager = user?.role === 'qr-manager';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100/50 to-gray-50 flex flex-col">
      {!isQRManager && <Navbar />}

      <div className="flex flex-1 pt-16">
        {/* Desktop Sidebar - Hidden for QR Manager */}
        {!isQRManager && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 min-h-[calc(100vh-4rem)] overflow-auto ${isQRManager ? 'pt-0' : ''}`}>
          <div className={`${isQRManager ? 'pr-8 pl-4 pt-0' : 'max-w-7xl mx-auto px-4 py-8'} fade-in`}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Hidden for QR Manager */}
      {!isQRManager && <MobileBottomNav />}
    </div>
  );
};

export default Layout;

