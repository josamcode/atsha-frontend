import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  FaChevronUp,
  FaClipboardList,
  FaCog,
  FaEllipsisH,
  FaFileAlt,
  FaGlobe,
  FaQrcode,
  FaTachometerAlt,
  FaUmbrellaBeach,
  FaUserClock,
  FaUsers
} from 'react-icons/fa';
import { roleMatches } from '../../utils/organization';

const MobileBottomNav = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    setShowLanguageMenu(false);
  };

  const mainNavLinks = [
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
    }
  ];

  const moreNavLinks = [
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
    }
  ];

  const filteredMainNavLinks = mainNavLinks.filter((link) => roleMatches(user, link.roles));
  const filteredMoreNavLinks = moreNavLinks.filter((link) => roleMatches(user, link.roles));

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="grid grid-cols-5 h-16">
          {filteredMainNavLinks.map((link) => {
            const Icon = link.icon;
            const active = location.pathname.startsWith(link.path);

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${active ? 'text-primary' : 'text-gray-500'}`}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full"></div>
                )}
                <div className={`transition-transform ${active ? 'scale-110' : 'scale-100'}`}>
                  <Icon className="text-xl" />
                </div>
                <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setShowMore((previous) => !previous)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${showMore ? 'text-primary' : 'text-gray-500'}`}
          >
            <div className={`transition-transform ${showMore ? 'scale-110 rotate-180' : 'scale-100'}`}>
              <FaEllipsisH className="text-xl" />
            </div>
            <span className={`text-xs font-medium ${showMore ? 'font-semibold' : ''}`}>
              {t('common.more')}
            </span>
          </button>
        </div>
      </nav>

      {showMore && (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" onClick={() => setShowMore(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-slideUp safe-area-bottom"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">{t('common.more')}</h3>
              <button
                onClick={() => setShowMore(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaEllipsisH className="text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredMoreNavLinks.map((link) => {
                const Icon = link.icon;
                const active = location.pathname.startsWith(link.path);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setShowMore(false)}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${active
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? 'bg-primary text-white' : 'bg-white text-primary'}`}>
                      <Icon className="text-xl" />
                    </div>
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowLanguageMenu((previous) => !previous)}
                  className="flex items-center gap-4 w-full p-4 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white text-primary">
                    <FaGlobe className="text-xl" />
                  </div>
                  <div className="flex-1 text-left rtl:text-right">
                    <span className="font-medium">{t('users.language')}</span>
                    <p className="text-xs text-gray-500">{i18n.language === 'ar' ? 'Arabic' : 'English'}</p>
                  </div>
                  <FaChevronUp className={`text-gray-400 transition-transform ${showLanguageMenu ? '' : 'rotate-180'}`} />
                </button>

                {showLanguageMenu && (
                  <div className="mt-2 space-y-2 animate-fadeIn">
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${i18n.language === 'en'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span>English</span>
                      {i18n.language === 'en' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                    </button>
                    <button
                      onClick={() => changeLanguage('ar')}
                      className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${i18n.language === 'ar'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span>Arabic</span>
                      {i18n.language === 'ar' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="h-4"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNav;
