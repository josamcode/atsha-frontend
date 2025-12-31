import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../Common/NotificationDropdown';
import {
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaGlobe,
  FaChevronDown
} from 'react-icons/fa';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const profileRef = useRef(null);
  const langRef = useRef(null);
  const isRTL = i18n.language === 'ar';

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    setIsLangOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 z-40">
      <div className="max-w-8xl mx-auto px-4 ">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="Atsha"
              className="h-12 w-32 group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications - All Devices (Admin Only) */}
            {user?.role === 'admin' && (
              <NotificationDropdown />
            )}

            {/* Language Switcher - Desktop */}
            <div ref={langRef} className="relative hidden md:block">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaGlobe className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{i18n.language.toUpperCase()}</span>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
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
                    العربية
                  </button>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left rtl:text-right">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize leading-tight">{user?.role}</p>
                </div>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform hidden lg:block ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-xl shadow-lg py-2 border border-gray-100 animate-fadeIn`}>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <FaUser className="text-primary flex-shrink-0" />
                    <span>{t('nav.myProfile')}</span>
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <FaCog className="text-primary flex-shrink-0" />
                    <span>{t('nav.settings')}</span>
                  </Link>

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

