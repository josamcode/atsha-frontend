import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  FaBars,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
  FaCog,
  FaEnvelope,
  FaFileAlt,
  FaQrcode,
  FaTachometerAlt,
  FaUmbrellaBeach,
  FaUserClock,
  FaUsers
} from 'react-icons/fa';
import { getUserOrganizationRole, isPlatformAdmin, roleMatches } from '../../utils/organization';
import { getDepartmentLabel, getRoleLabel } from '../../utils/organizationUi';

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const { user, organization } = useAuth();
  const { isOpen, toggle } = useSidebar();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';
  const currentRole = getUserOrganizationRole(user);
  const platformAdminView = isPlatformAdmin(user);

  const navLinks = [
    {
      path: '/dashboard',
      label: t('nav.dashboard'),
      icon: FaTachometerAlt,
      roles: ['platform_admin', 'organization_admin', 'supervisor', 'employee']
    },
    {
      path: '/forms',
      label: t('nav.forms'),
      icon: FaFileAlt,
      roles: ['platform_admin', 'organization_admin', 'supervisor']
    },
    {
      path: '/templates',
      label: t('nav.templates'),
      icon: FaClipboardList,
      roles: ['platform_admin', 'organization_admin']
    },
    {
      path: '/admin/qr-attendance',
      label: t('nav.qrAttendance'),
      icon: FaQrcode,
      roles: ['organization_admin']
    },
    {
      path: '/attendance',
      label: t('nav.attendance'),
      icon: FaUserClock,
      roles: ['organization_admin', 'supervisor', 'employee', 'qr_manager']
    },
    {
      path: '/leaves',
      label: t('nav.leaves'),
      icon: FaUmbrellaBeach,
      roles: ['platform_admin', 'organization_admin', 'supervisor', 'employee']
    },
    {
      path: '/users',
      label: t('nav.users'),
      icon: FaUsers,
      roles: ['platform_admin', 'organization_admin', 'supervisor']
    },
    {
      path: '/organization',
      label: t('nav.settings'),
      icon: FaCog,
      roles: ['platform_admin', 'organization_admin']
    },
    {
      path: '/messages',
      label: t('nav.messages'),
      icon: FaEnvelope,
      roles: ['platform_admin', 'organization_admin', 'supervisor', 'employee']
    }
  ];

  const filteredNavLinks = navLinks.filter((link) => roleMatches(user, link.roles));
  const ChevronIcon = isRTL ? FaChevronLeft : FaChevronRight;

  return (
    <aside
      className={`flex-shrink-0 h-[calc(100vh-4rem)] hidden-scrollbar cursor-pointer bg-white shadow-lg sticky top-16 ${isRTL ? 'border-l' : 'border-r'} border-gray-200 overflow-y-auto transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}
    >
      <div className={`p-4 border-b border-gray-200 flex ${isOpen ? 'justify-start w-full' : 'justify-center w-full'}`} onClick={toggle}>
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-primary"
          title={isOpen ? t('common.close') : t('common.open')}
        >
          <FaBars className="text-xl" />
        </button>
      </div>

      <div className={`p-4 ${!isOpen && 'px-2'}`}>
        {isOpen ? (
          <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-lg shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-600">{getRoleLabel(currentRole, t, i18n.language)}</p>
                {(platformAdminView || organization?.name) && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {platformAdminView
                      ? (isRTL ? 'لوحة المنصة' : 'Platform Console')
                      : organization.name}
                  </p>
                )}
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

        <nav className="space-y-1">
          {isOpen && (
            <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
              Menu
            </p>
          )}

          {filteredNavLinks.map((link) => {
            const Icon = link.icon;
            const active = location.pathname.startsWith(link.path);

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

        {isOpen && (
          <>
            <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
              <p className={`text-xs font-semibold text-gray-600 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                Quick Info
              </p>
              <div className="space-y-2">
                <div className={`flex items-center justify-between text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">{platformAdminView ? 'Scope' : 'Organization'}</span>
                  <span className="font-semibold text-gray-800 truncate max-w-[9rem]">
                    {platformAdminView
                      ? (isRTL ? 'النظام بالكامل' : 'Entire System')
                      : (organization?.name || '--')}
                  </span>
                </div>
                <div className={`flex items-center justify-between text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">{platformAdminView ? 'Mode' : 'Department'}</span>
                  <span className="font-semibold text-gray-800">
                    {platformAdminView
                      ? (isRTL ? 'إدارة مركزية' : 'Central Admin')
                      : getDepartmentLabel(user?.department, organization, t, i18n.language)}
                  </span>
                </div>
                <div className={`flex items-center justify-between text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">Language</span>
                  <span className="font-semibold text-gray-800 uppercase">{i18n.language}</span>
                </div>
              </div>
            </div>

            <div className={`mt-6 pt-4 border-t border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-xs text-gray-500">
                {new Date().getFullYear()} AraRM
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {platformAdminView ? 'platform' : (organization?.slug || 'organization')}
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
