import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
  FaTachometerAlt, 
  FaFileAlt, 
  FaClipboardList, 
  FaUserClock, 
  FaUmbrellaBeach, 
  FaUsers,
  FaTimes
} from 'react-icons/fa';

const MobileSidebar = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: FaTachometerAlt, roles: ['admin', 'supervisor', 'employee'] },
    { path: '/forms', label: t('nav.forms'), icon: FaFileAlt, roles: ['admin', 'supervisor', 'employee'] },
    { path: '/templates', label: t('nav.templates'), icon: FaClipboardList, roles: ['admin'] },
    { path: '/attendance', label: t('nav.attendance'), icon: FaUserClock, roles: ['admin', 'supervisor', 'employee'] },
    { path: '/leaves', label: t('nav.leaves'), icon: FaUmbrellaBeach, roles: ['admin', 'supervisor', 'employee'] },
    { path: '/users', label: t('nav.users'), icon: FaUsers, roles: ['admin', 'supervisor'] },
  ];

  const filteredNavLinks = navLinks.filter(link => 
    link.roles.includes(user?.role)
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-64 bg-white shadow-2xl z-50 md:hidden overflow-y-auto transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')
        }`}
      >
        <div className="p-4">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Menu
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaTimes className="text-xl text-gray-600" />
            </button>
          </div>

          {/* User Info Card */}
          <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-lg shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {filteredNavLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`text-lg ${active ? 'text-white' : 'text-primary'}`} />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <p className={`text-xs font-semibold text-gray-600 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL ? 'معلومات' : 'Info'}
            </p>
            <div className="space-y-2">
              <div className={`flex items-center justify-between text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">{isRTL ? 'القسم' : 'Department'}</span>
                <span className="font-semibold text-gray-800 capitalize">{user?.department}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;

