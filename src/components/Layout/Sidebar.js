import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  FaTachometerAlt,
  FaFileAlt,
  FaClipboardList,
  FaUserClock,
  FaUmbrellaBeach,
  FaUsers,
  FaChevronRight,
  FaChevronLeft,
  FaBars,
  FaQrcode,
  FaEnvelope
} from 'react-icons/fa';

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isOpen, toggle } = useSidebar();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: FaTachometerAlt, roles: ['admin', 'supervisor', 'employee'] },
    { path: '/forms', label: t('nav.forms'), icon: FaFileAlt, roles: ['admin', 'supervisor'] },
    { path: '/templates', label: t('nav.templates'), icon: FaClipboardList, roles: ['admin'], department: 'management' },
    { path: '/admin/qr-attendance', label: t('nav.qrAttendance'), icon: FaQrcode, roles: ['admin'] },
    { path: '/attendance', label: t('nav.attendance'), icon: FaUserClock, roles: ['admin', 'supervisor', 'employee'] },
    { path: '/leaves', label: t('nav.leaves'), icon: FaUmbrellaBeach, roles: ['admin', 'supervisor', 'employee'] },
    { path: '/users', label: t('nav.users'), icon: FaUsers, roles: ['admin', 'supervisor'] },
    { path: '/messages', label: t('nav.messages'), icon: FaEnvelope, roles: ['admin', 'supervisor', 'employee'] },
  ];

  const filteredNavLinks = navLinks.filter(link => {
    if (!link.roles.includes(user?.role)) return false;
    // For templates, only show to management department admins
    if (link.path === '/templates' && link.department === 'management') {
      return user?.role === 'admin' && user?.department === 'management';
    }
    return true;
  });

  const ChevronIcon = isRTL ? FaChevronLeft : FaChevronRight;

  return (
    <aside
      className={`flex-shrink-0 h-[calc(100vh-4rem)] hidden-scrollbar cursor-pointer bg-white shadow-lg sticky top-16 ${isRTL ? 'border-l' : 'border-r'} border-gray-200 overflow-y-auto transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}
    >
      {/* Toggle Button */}
      <div className={`p-4 border-b border-gray-200 flex ${isOpen ? 'justify-start w-full' : 'justify-center w-full'}`} onClick={toggle}>
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-primary"
          title={isOpen ? t('common.close') : t('common.open')}
        >
          <FaBars className="text-xl" />
        </button>
      </div>

      <div className={`p-4 ${!isOpen && 'px-2'}`}>
        {/* User Info Card */}
        {isOpen ? (
          <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-lg shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-lg shadow-md">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          {isOpen && (
            <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL ? 'القائمة' : 'Menu'}
            </p>
          )}
          {filteredNavLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center ${isOpen ? 'justify-between px-4' : 'justify-center px-2'} py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${active
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                  }`}
                title={!isOpen ? link.label : ''}
              >
                {isOpen ? (
                  <>
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className={`text-lg flex-shrink-0 ${active ? 'text-white' : 'text-primary'} transition-transform group-hover:scale-110`} />
                      <span className="truncate">{link.label}</span>
                    </div>
                    <ChevronIcon className={`text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${active ? 'opacity-100' : ''}`} />
                  </>
                ) : (
                  <Icon className={`text-xl ${active ? 'text-white' : 'text-primary'} transition-transform group-hover:scale-110`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats */}
        {isOpen && (
          <>
            <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
              <p className={`text-xs font-semibold text-gray-600 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? 'معلومات سريعة' : 'Quick Info'}
              </p>
              <div className="space-y-2">
                <div className={`flex items-center justify-between text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">{isRTL ? 'القسم' : 'Department'}</span>
                  <span className="font-semibold text-gray-800 capitalize">{user?.department}</span>
                </div>
                <div className={`flex items-center justify-between text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">{isRTL ? 'اللغة' : 'Language'}</span>
                  <span className="font-semibold text-gray-800 uppercase">{i18n.language}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`mt-6 pt-4 border-t border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} atsha
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isRTL ? 'نظام إدارة atsha' : 'atsha Management System'}
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

