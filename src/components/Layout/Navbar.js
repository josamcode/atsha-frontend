import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../Common/NotificationDropdown';
import {
  FaChevronDown,
  FaCog,
  FaGlobe,
  FaSignOutAlt,
  FaUser
} from 'react-icons/fa';
import { getUserOrganizationRole, isPlatformAdmin, roleMatches } from '../../utils/organization';
import { getRoleLabel } from '../../utils/organizationUi';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, organization, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const profileRef = useRef(null);
  const languageRef = useRef(null);
  const isRTL = i18n.language === 'ar';
  const platformAdminView = isPlatformAdmin(user);
  const showNotifications = Boolean(user);
  const showSettingsLink = roleMatches(user, ['platform_admin', 'organization_admin']);

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    setIsLanguageOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }

      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 z-40">
      <div className="max-w-8xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-3 group min-w-0">
            <img
              src="/logo.png"
              alt={organization?.name || 'AraRM'}
              className="h-4 w-auto group-hover:scale-105 transition-transform"
            />
            <div className="hidden lg:block min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {platformAdminView
                  ? (isRTL ? 'لوحة المنصة' : 'Platform Console')
                  : (organization?.name || 'AraRM')}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {platformAdminView ? 'platform' : (organization?.slug || 'organization')}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {showNotifications && <NotificationDropdown />}

            <div ref={languageRef} className="relative hidden md:block">
              <button
                onClick={() => setIsLanguageOpen((previous) => !previous)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaGlobe className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{i18n.language.toUpperCase()}</span>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLanguageOpen && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-40 bg-white rounded-xl shadow-lg py-1 border border-gray-100 animate-fadeIn`}>
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`w-full text-left rtl:text-right px-4 py-2.5 text-sm transition-colors ${i18n.language === 'en'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => changeLanguage('ar')}
                    className={`w-full text-left rtl:text-right px-4 py-2.5 text-sm transition-colors ${i18n.language === 'ar'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Arabic
                  </button>
                </div>
              )}
            </div>

            <div ref={profileRef} className="relative">
              <button
                onClick={() => setIsProfileOpen((previous) => !previous)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left rtl:text-right">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name}</p>
                  <p className="text-xs text-gray-500 leading-tight">
                    {getRoleLabel(getUserOrganizationRole(user), t, i18n.language)}
                  </p>
                </div>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform hidden lg:block ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-xl shadow-lg py-2 border border-gray-100 animate-fadeIn`}>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {platformAdminView
                        ? (isRTL ? 'إدارة النظام بالكامل' : 'System-wide administration')
                        : organization?.name}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <FaUser className="text-primary flex-shrink-0" />
                    <span>{t('nav.myProfile')}</span>
                  </Link>

                  {showSettingsLink && (
                    <Link
                      to="/organization"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FaCog className="text-primary flex-shrink-0" />
                      <span>{t('nav.settings')}</span>
                    </Link>
                  )}

                  <div className="my-1 border-t border-gray-100"></div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-primary hover:bg-primary transition-colors"
                  >
                    <FaSignOutAlt className="flex-shrink-0" />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
