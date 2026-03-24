import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FEATURE_FIELDS,
  LIMIT_FIELDS,
  formatLimitValue,
  formatMoney,
  getPlanDescription,
  getPlanName
} from '../components/Platform/planUtils';
import './LandingPage.css';

/* ─── SVG Icon Components ─── */
const IconGrid = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
);
const IconQR = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3m4 0v-3h-3m0 6h3m-7 0h1" /></svg>
);
const IconForms = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
);
const IconLeave = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const IconMsg = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
);
const IconReport = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path d="M11 3v5a2 2 0 002 2h5M9 17v-4m4 4v-6m4 6v-2" /></svg>
);
const IconShield = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
);
const IconHierarchy = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 00-9.288 0M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const IconBranding = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
);
const IconChevron = () => (
  <svg className="lp-faq-chevron" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
);
const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
);
const IconCheck = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
  </svg>
);

const LANDING_PLANS = [
  {
    code: 'free',
    name: {
      en: 'Free',
      ar: 'مجاني'
    },
    description: {
      en: 'Entry plan for pilots and very small teams.',
      ar: 'خطة أولية للتجربة والفرق الصغيرة جدا.'
    },
    market: {
      primaryRegion: 'MENA',
      primaryCountry: 'SA',
      currency: 'SAR'
    },
    pricing: {
      monthly: {
        amount: 0,
        currency: 'SAR'
      },
      yearly: {
        amount: 0,
        currency: 'SAR'
      }
    },
    features: {
      qrCode: false,
      attendanceManagement: false,
      leaveManagement: false,
      messaging: false
    },
    limits: {
      formsPerMonth: 100,
      templatesTotal: 3,
      usersTotal: 5,
      messagesPerMonth: 0
    },
    isActive: true,
    sortOrder: 0,
    isDefault: true,
    source: 'default',
    checkout: {
      monthly: false,
      annual: false
    }
  },
  {
    code: 'plus',
    name: {
      en: 'Plus',
      ar: 'بلس'
    },
    description: {
      en: 'For growing teams that need operational workflows and messaging.',
      ar: 'للفرق المتنامية التي تحتاج إلى سير عمل تشغيلي ونظام مراسلة.'
    },
    market: {
      primaryRegion: 'MENA',
      primaryCountry: 'SA',
      currency: 'SAR'
    },
    pricing: {
      monthly: {
        amount: 149,
        currency: 'SAR'
      },
      yearly: {
        amount: 1490,
        currency: 'SAR'
      }
    },
    features: {
      qrCode: true,
      attendanceManagement: true,
      leaveManagement: false,
      messaging: true
    },
    limits: {
      formsPerMonth: 1000,
      templatesTotal: 15,
      usersTotal: 25,
      messagesPerMonth: 1000
    },
    isActive: true,
    sortOrder: 1,
    isDefault: true,
    source: 'default',
    checkout: {
      monthly: true,
      annual: true
    }
  },
  {
    code: 'pro',
    name: {
      en: 'Pro',
      ar: 'برو'
    },
    description: {
      en: 'Full operating suite for larger organizations and regional rollout.',
      ar: 'باقة تشغيل متكاملة للمنظمات الأكبر وللتوسع الإقليمي.'
    },
    market: {
      primaryRegion: 'MENA',
      primaryCountry: 'SA',
      currency: 'SAR'
    },
    pricing: {
      monthly: {
        amount: 349,
        currency: 'SAR'
      },
      yearly: {
        amount: 3490,
        currency: 'SAR'
      }
    },
    features: {
      qrCode: true,
      attendanceManagement: true,
      leaveManagement: true,
      messaging: true
    },
    limits: {
      formsPerMonth: 10000,
      templatesTotal: 150,
      usersTotal: 3,
      messagesPerMonth: 20000
    },
    isActive: true,
    sortOrder: 2,
    isDefault: true,
    source: 'customized_default',
    checkout: {
      monthly: true,
      annual: true
    }
  }
];

/* ─── Scroll Reveal Hook ─── */
function useScrollReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    const el = ref.current;
    if (el) {
      const items = el.querySelectorAll('.lp-reveal');
      items.forEach((item) => observer.observe(item));
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ═══════════════════════════════════════════
   LANDING PAGE COMPONENT
   ═══════════════════════════════════════════ */
const LandingPage = () => {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const pageRef = useScrollReveal();
  const isArabic = i18n.language === 'ar';
  const locale = isArabic ? 'ar-SA' : 'en-US';

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pricingText = isArabic ? {
    nav: 'الخطط',
    label: 'الأسعار',
    title: 'اختر الخطة المناسبة لحجم فريقك.',
    subtitle: 'ابدأ مجاناً للتجربة، انتقل إلى بلس لتشغيل العمليات اليومية، وفعّل برو عندما تحتاج إلى باقة تشغيل كاملة.',
    monthly: 'شهري',
    yearly: 'سنوي',
    yearlyBadge: 'وفر حتى 17%',
    bannerEyebrow: 'تسعير واضح',
    bannerTitle: 'خطط جاهزة لفرق التشغيل في الشرق الأوسط',
    bannerText: 'جميع الأسعار بالريال السعودي، وكل الخطط تدعم العربية وواجهة RTL وعزل المنظمات من اليوم الأول.',
    marketLabel: 'السوق الأساسي',
    mostPopular: 'الأكثر اختياراً',
    fullSuite: 'الباقة الكاملة',
    startHere: 'ابدأ من هنا',
    included: 'الميزات المضمنة',
    noCardRequired: 'بدون بطاقة ائتمان',
    checkoutReady: 'الدفع الإلكتروني متاح بعد التسجيل',
    contactUs: 'يمكننا تهيئة الخطة معك',
    choosePlan: 'اختر الخطة',
    startFree: 'ابدأ مجاناً',
    save: 'وفر',
    perMonth: 'شهرياً',
    perYear: 'سنوياً',
    equivalentTo: 'يعادل',
    monthlyEquivalentSuffix: 'شهرياً',
    billedMonthly: 'يمكنك التحويل إلى السنوي لتوفير أكثر',
    freeForever: 'مجانية دائماً'
  } : {
    nav: 'Plans',
    label: 'Pricing',
    title: 'Choose the rollout that fits your team.',
    subtitle: 'Start free for pilots, move to Plus for daily operations, and unlock Pro when you need the full operating suite.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    yearlyBadge: 'Save up to 17%',
    bannerEyebrow: 'Simple pricing',
    bannerTitle: 'Purpose-built plans for operations teams in MENA',
    bannerText: 'All prices are listed in SAR, and every plan includes Arabic, RTL, and multi-organization foundations from day one.',
    marketLabel: 'Primary market',
    mostPopular: 'Most popular',
    fullSuite: 'Full suite',
    startHere: 'Start here',
    included: 'Included modules',
    noCardRequired: 'No card required',
    checkoutReady: 'Checkout available after signup',
    contactUs: 'Onboarding support available',
    choosePlan: 'Choose plan',
    startFree: 'Start free',
    save: 'Save',
    perMonth: 'per month',
    perYear: 'per year',
    equivalentTo: 'Equivalent to',
    monthlyEquivalentSuffix: 'each month',
    billedMonthly: 'Switch to yearly billing to save more',
    freeForever: 'Free forever'
  };

  const navItems = [
    { id: 'features', label: t('landing.nav.features') },
    { id: 'plans', label: pricingText.nav },
    { id: 'how-it-works', label: t('landing.nav.howItWorks') },
    { id: 'use-cases', label: t('landing.nav.useCases') },
    { id: 'faq', label: t('landing.nav.faq') }
  ];

  const plansData = LANDING_PLANS
    .filter((plan) => plan.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const selectedCheckoutKey = billingCycle === 'monthly' ? 'monthly' : 'annual';

  const getPlanPrice = (plan, cycle) => (
    formatMoney(
      plan.pricing?.[cycle]?.amount,
      plan.market?.currency || plan.pricing?.[cycle]?.currency || 'SAR',
      locale
    )
  );

  const getPlanPriceNote = (plan) => {
    const monthlyAmount = Number(plan.pricing?.monthly?.amount) || 0;

    if (monthlyAmount <= 0) {
      return pricingText.freeForever;
    }

    if (billingCycle === 'monthly') {
      return pricingText.billedMonthly;
    }

    const yearlyAmount = Number(plan.pricing?.yearly?.amount) || 0;
    const currency = plan.market?.currency || plan.pricing?.yearly?.currency || 'SAR';

    if (yearlyAmount <= 0) {
      return pricingText.freeForever;
    }

    return `${pricingText.equivalentTo} ${formatMoney(yearlyAmount / 12, currency, locale)} ${pricingText.monthlyEquivalentSuffix}`;
  };

  const getPlanSavingsPercent = (plan) => {
    const monthlyAmount = Number(plan.pricing?.monthly?.amount) || 0;
    const yearlyAmount = Number(plan.pricing?.yearly?.amount) || 0;
    const monthlyAnnualized = monthlyAmount * 12;

    if (monthlyAnnualized <= 0 || yearlyAmount <= 0 || yearlyAmount >= monthlyAnnualized) {
      return 0;
    }

    return Math.round(((monthlyAnnualized - yearlyAmount) / monthlyAnnualized) * 100);
  };

  const getPlanBadge = (plan) => {
    if (plan.code === 'plus') return pricingText.mostPopular;
    if (plan.code === 'pro') return pricingText.fullSuite;
    return pricingText.startHere;
  };

  const getPlanCheckoutHint = (plan) => {
    if (plan.code === 'free') return pricingText.noCardRequired;
    return plan.checkout?.[selectedCheckoutKey] ? pricingText.checkoutReady : pricingText.contactUs;
  };

  const featuresData = [
    { icon: <IconGrid />, color: 'green', titleKey: 'landing.features.f1Title', descKey: 'landing.features.f1Desc' },
    { icon: <IconQR />, color: 'blue', titleKey: 'landing.features.f2Title', descKey: 'landing.features.f2Desc' },
    { icon: <IconForms />, color: 'amber', titleKey: 'landing.features.f3Title', descKey: 'landing.features.f3Desc' },
    { icon: <IconLeave />, color: 'purple', titleKey: 'landing.features.f4Title', descKey: 'landing.features.f4Desc' },
    { icon: <IconMsg />, color: 'rose', titleKey: 'landing.features.f5Title', descKey: 'landing.features.f5Desc' },
    { icon: <IconReport />, color: 'teal', titleKey: 'landing.features.f6Title', descKey: 'landing.features.f6Desc' },
  ];

  const faqKeys = [1, 2, 3, 4, 5, 6];

  return (
    <div className="lp" ref={pageRef}>

      {/* ──────────────── NAVBAR ──────────────── */}
      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <img src="/logo.png" alt="AraRM" className="lp-nav-logo" />

          <ul className="lp-nav-links">
            {navItems.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(item.id); }}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="lp-nav-right">
            <Link to="/login" className="lp-nav-login">{t('landing.nav.login')}</Link>
            <Link to="/register" className="lp-btn lp-btn-primary lp-btn-sm">{t('landing.nav.startFree')}</Link>
            <button className="lp-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              {mobileMenuOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`lp-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(item.id); }}>
            {item.label}
          </a>
        ))}
        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.login')}</Link>
        <Link to="/register" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.startFree')} →</Link>
      </div>

      {/* ──────────────── HERO ──────────────── */}
      <section className="lp-hero">
        <div className="lp-container">
          <div className="lp-hero-inner">
            <div className="lp-hero-content lp-reveal">
              <span className="lp-badge">{t('landing.hero.badge')}</span>
              <h1>
                {t('landing.hero.title1')} <span className="lp-hero-accent">{t('landing.hero.title2')}</span>
              </h1>
              <p className="lp-hero-sub">{t('landing.hero.subtitle')}</p>
              <div className="lp-hero-cta">
                <Link to="/register" className="lp-btn lp-btn-primary">{t('landing.hero.cta1')}</Link>
                <a href="#how-it-works" className="lp-btn lp-btn-secondary" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>{t('landing.hero.cta2')}</a>
              </div>
            </div>

            {/* Hero Visual — Dashboard Preview */}
            <div className="lp-hero-visual lp-reveal lp-reveal-delay-2">
              <div className="lp-ui-dashboard">
                <div className="lp-ui-dashboard-header">
                  <div className="lp-ui-dashboard-welcome">
                    <div className="lp-ui-avatar">👤</div>
                    <div className="lp-ui-welcome-text">
                      <h3>{t('landing.ui.welcomeName')}</h3>
                      <p>{t('landing.ui.roleLabel')}</p>
                    </div>
                  </div>
                  <div className="lp-ui-time-badge">{t('landing.ui.dateLabel')}</div>
                </div>

                <div className="lp-ui-stats-row">
                  <div className="lp-ui-stat-card">
                    <div>
                      <p className="lp-ui-stat-label">{t('landing.ui.formsToday')}</p>
                      <p className="lp-ui-stat-value">24</p>
                    </div>
                    <div className="lp-ui-stat-icon blue">📋</div>
                  </div>
                  <div className="lp-ui-stat-card">
                    <div>
                      <p className="lp-ui-stat-label">{t('landing.ui.present')}</p>
                      <p className="lp-ui-stat-value">38</p>
                    </div>
                    <div className="lp-ui-stat-icon green">✓</div>
                  </div>
                  <div className="lp-ui-stat-card">
                    <div>
                      <p className="lp-ui-stat-label">{t('landing.ui.pendingLeaves')}</p>
                      <p className="lp-ui-stat-value">5</p>
                    </div>
                    <div className="lp-ui-stat-icon purple">🏖</div>
                  </div>
                </div>

                <div className="lp-ui-table">
                  <div className="lp-ui-table-header">
                    <span className="lp-ui-table-title">
                      <span className="lp-ui-table-title-icon">📄</span>
                      {t('landing.ui.recentForms')}
                    </span>
                    <span className="lp-ui-table-link">{t('landing.ui.viewAll')}</span>
                  </div>
                  <div className="lp-ui-row">
                    <div className="lp-ui-row-left">
                      <div className="lp-ui-row-icon">📄</div>
                      <div>
                        <div className="lp-ui-row-text">{t('landing.ui.form1')}</div>
                        <div className="lp-ui-row-sub">{t('landing.ui.form1Sub')}</div>
                      </div>
                    </div>
                    <span className="lp-ui-status approved">{t('landing.ui.approved')}</span>
                  </div>
                  <div className="lp-ui-row">
                    <div className="lp-ui-row-left">
                      <div className="lp-ui-row-icon">📄</div>
                      <div>
                        <div className="lp-ui-row-text">{t('landing.ui.form2')}</div>
                        <div className="lp-ui-row-sub">{t('landing.ui.form2Sub')}</div>
                      </div>
                    </div>
                    <span className="lp-ui-status pending">{t('landing.ui.pending')}</span>
                  </div>
                  <div className="lp-ui-row">
                    <div className="lp-ui-row-left">
                      <div className="lp-ui-row-icon">📄</div>
                      <div>
                        <div className="lp-ui-row-text">{t('landing.ui.form3')}</div>
                        <div className="lp-ui-row-sub">{t('landing.ui.form3Sub')}</div>
                      </div>
                    </div>
                    <span className="lp-ui-status submitted">{t('landing.ui.submitted')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── BUILT FOR ──────────────── */}
      <section className="lp-built-for">
        <div className="lp-container">
          <div className="lp-built-for-inner lp-reveal">
            <span className="lp-built-for-label">{t('landing.builtFor.label')}</span>
            <span className="lp-built-for-tag">🏪 {t('landing.builtFor.restaurants')}</span>
            <span className="lp-built-for-tag">🏢 {t('landing.builtFor.retail')}</span>
            <span className="lp-built-for-tag">🏥 {t('landing.builtFor.clinics')}</span>
            <span className="lp-built-for-tag">🔗 {t('landing.builtFor.franchises')}</span>
            <span className="lp-built-for-tag">🏗 {t('landing.builtFor.multiBranch')}</span>
          </div>
        </div>
      </section>

      {/* ──────────────── POSITIONING ──────────────── */}
      <section className="lp-positioning lp-section-sm">
        <div className="lp-container">
          <p className="lp-positioning-text lp-reveal" dangerouslySetInnerHTML={{ __html: t('landing.positioning') }} />
        </div>
      </section>

      {/* ──────────────── WHAT AraRM REPLACES ──────────────── */}
      <section className="lp-section lp-replaces">
        <div className="lp-container">
          <div className="lp-section-center lp-reveal">
            <span className="lp-section-label">{t('landing.replaces.label')}</span>
            <h2 className="lp-section-title">{t('landing.replaces.title')}</h2>
            <p className="lp-section-subtitle">{t('landing.replaces.subtitle')}</p>
          </div>

          <div className="lp-replaces-grid" style={{ marginTop: 48 }}>
            <div className="lp-replaces-before lp-reveal lp-reveal-delay-1">
              <h3>{t('landing.replaces.beforeTitle')}</h3>
              <ul className="lp-replaces-list">
                <li><span className="lp-x-icon">✕</span> {t('landing.replaces.before1')}</li>
                <li><span className="lp-x-icon">✕</span> {t('landing.replaces.before2')}</li>
                <li><span className="lp-x-icon">✕</span> {t('landing.replaces.before3')}</li>
                <li><span className="lp-x-icon">✕</span> {t('landing.replaces.before4')}</li>
                <li><span className="lp-x-icon">✕</span> {t('landing.replaces.before5')}</li>
              </ul>
            </div>

            <div className="lp-replaces-after lp-reveal lp-reveal-delay-2">
              <h3>✦ {t('landing.replaces.afterTitle')}</h3>
              <div className="lp-replaces-modules">
                <div className="lp-replaces-module"><span className="lp-replaces-module-icon">📊</span> {t('landing.replaces.after1')}</div>
                <div className="lp-replaces-module"><span className="lp-replaces-module-icon">📝</span> {t('landing.replaces.after2')}</div>
                <div className="lp-replaces-module"><span className="lp-replaces-module-icon">🏖️</span> {t('landing.replaces.after3')}</div>
                <div className="lp-replaces-module"><span className="lp-replaces-module-icon">💬</span> {t('landing.replaces.after4')}</div>
                <div className="lp-replaces-module"><span className="lp-replaces-module-icon">📄</span> {t('landing.replaces.after5')}</div>
                <div className="lp-replaces-module"><span className="lp-replaces-module-icon">🏢</span> {t('landing.replaces.after6')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── FEATURES ──────────────── */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <div className="lp-section-center lp-reveal">
            <span className="lp-section-label">{t('landing.features.label')}</span>
            <h2 className="lp-section-title">{t('landing.features.title')}</h2>
            <p className="lp-section-subtitle">{t('landing.features.subtitle')}</p>
          </div>

          <div className="lp-features-grid">
            {featuresData.map((f, i) => (
              <div key={i} className={`lp-feature-card lp-reveal lp-reveal-delay-${(i % 3) + 1}`}>
                <div className={`lp-feature-icon ${f.color}`}>{f.icon}</div>
                <h3>{t(f.titleKey)}</h3>
                <p>{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── HOW IT WORKS ──────────────── */}
      <section className="lp-section lp-workflow" id="how-it-works">
        <div className="lp-container">
          <div className="lp-section-center lp-reveal">
            <span className="lp-section-label">{t('landing.workflow.label')}</span>
            <h2 className="lp-section-title">{t('landing.workflow.title')}</h2>
            <p className="lp-section-subtitle">{t('landing.workflow.subtitle')}</p>
          </div>

          <div className="lp-timeline">
            {/* Step 1 */}
            <div className="lp-timeline-step lp-reveal">
              <div className="lp-timeline-number">1</div>
              <div className="lp-timeline-content">
                <h3>{t('landing.workflow.s1Title')}</h3>
                <p>{t('landing.workflow.s1Desc')}</p>
              </div>
              <div className="lp-ui-mini">
                <div className="lp-ui-mini-header">
                  <div className="lp-ui-mini-dot red" /><div className="lp-ui-mini-dot yellow" /><div className="lp-ui-mini-dot green" />
                </div>
                <div className="lp-ui-mini-body">
                  <div className="lp-ui-mini-field">
                    <span className="lp-ui-mini-label">{t('landing.workflow.s1Field1')}</span>
                    <div className="lp-ui-mini-input">{t('landing.workflow.s1Value1')}</div>
                  </div>
                  <div className="lp-ui-mini-field">
                    <span className="lp-ui-mini-label">{t('landing.workflow.s1Field2')}</span>
                    <div className="lp-ui-mini-input">{t('landing.workflow.s1Value2')}</div>
                  </div>
                  <div className="lp-ui-mini-field">
                    <span className="lp-ui-mini-label">{t('landing.workflow.s1Field3')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="lp-ui-mini-color" style={{ background: '#059669' }} />
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>#059669</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="lp-timeline-step lp-reveal lp-reveal-delay-1">
              <div className="lp-timeline-number">2</div>
              <div className="lp-timeline-content">
                <h3>{t('landing.workflow.s2Title')}</h3>
                <p>{t('landing.workflow.s2Desc')}</p>
              </div>
              <div className="lp-ui-mini">
                <div className="lp-ui-mini-header">
                  <div className="lp-ui-mini-dot red" /><div className="lp-ui-mini-dot yellow" /><div className="lp-ui-mini-dot green" />
                </div>
                <div className="lp-ui-mini-body">
                  <div className="lp-ui-mini-row">
                    <span style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.7rem' }}>{t('landing.workflow.s2Dept1')}</span>
                    <span style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 600 }}>{t('landing.workflow.s2Active')}</span>
                  </div>
                  <div className="lp-ui-mini-row">
                    <span style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.7rem' }}>{t('landing.workflow.s2Dept2')}</span>
                    <span style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 600 }}>{t('landing.workflow.s2Active')}</span>
                  </div>
                  <div className="lp-ui-mini-row">
                    <span style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.7rem' }}>{t('landing.workflow.s2Dept3')}</span>
                    <span style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 600 }}>{t('landing.workflow.s2Active')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="lp-timeline-step lp-reveal lp-reveal-delay-2">
              <div className="lp-timeline-number">3</div>
              <div className="lp-timeline-content">
                <h3>{t('landing.workflow.s3Title')}</h3>
                <p>{t('landing.workflow.s3Desc')}</p>
              </div>
              <div className="lp-ui-mini">
                <div className="lp-ui-mini-header">
                  <div className="lp-ui-mini-dot red" /><div className="lp-ui-mini-dot yellow" /><div className="lp-ui-mini-dot green" />
                </div>
                <div className="lp-ui-mini-body">
                  <div className="lp-ui-mini-row">
                    <span style={{ fontSize: '0.7rem', color: '#374151' }}>{t('landing.workflow.s3Toggle1')}</span>
                    <div className="lp-ui-mini-toggle" />
                  </div>
                  <div className="lp-ui-mini-row">
                    <span style={{ fontSize: '0.7rem', color: '#374151' }}>{t('landing.workflow.s3Toggle2')}</span>
                    <div className="lp-ui-mini-toggle" />
                  </div>
                  <div className="lp-ui-mini-row">
                    <span style={{ fontSize: '0.7rem', color: '#374151' }}>{t('landing.workflow.s3Toggle3')}</span>
                    <div className="lp-ui-mini-toggle" />
                  </div>
                  <div className="lp-ui-mini-row">
                    <span style={{ fontSize: '0.7rem', color: '#374151' }}>{t('landing.workflow.s3Toggle4')}</span>
                    <div className="lp-ui-mini-toggle off" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="lp-timeline-step lp-reveal lp-reveal-delay-3">
              <div className="lp-timeline-number">4</div>
              <div className="lp-timeline-content">
                <h3>{t('landing.workflow.s4Title')}</h3>
                <p>{t('landing.workflow.s4Desc')}</p>
              </div>
              <div className="lp-ui-mini">
                <div className="lp-ui-mini-header">
                  <div className="lp-ui-mini-dot red" /><div className="lp-ui-mini-dot yellow" /><div className="lp-ui-mini-dot green" />
                </div>
                <div className="lp-ui-mini-body">
                  <div className="lp-ui-mini-actions">
                    <div className="lp-ui-mini-action">
                      <span className="lp-ui-mini-action-icon" style={{ background: '#059669' }}>✏️</span>
                      {t('landing.workflow.s4Action1')}
                    </div>
                    <div className="lp-ui-mini-action">
                      <span className="lp-ui-mini-action-icon" style={{ background: '#10b981' }}>✓</span>
                      {t('landing.workflow.s4Action2')}
                    </div>
                    <div className="lp-ui-mini-action">
                      <span className="lp-ui-mini-action-icon" style={{ background: '#8b5cf6' }}>✈</span>
                      {t('landing.workflow.s4Action3')}
                    </div>
                    <div className="lp-ui-mini-action">
                      <span className="lp-ui-mini-action-icon" style={{ background: '#3b82f6' }}>📊</span>
                      {t('landing.workflow.s4Action4')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── PROBLEMS → SOLUTIONS ──────────────── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-center lp-reveal">
            <span className="lp-section-label">{t('landing.problems.label')}</span>
            <h2 className="lp-section-title">{t('landing.problems.title')}</h2>
          </div>

          <div className="lp-problems-grid">
            {[1, 2, 3, 4].map((n) => (
              <React.Fragment key={n}>
                <div className="lp-problem-card lp-reveal">
                  <span className="lp-problem-label problem">{t('landing.ui.problem')}</span>
                  <h3>{t(`landing.problems.p${n}Title`)}</h3>
                  <p>{t(`landing.problems.p${n}Desc`)}</p>
                </div>
                <div className="lp-problem-card lp-reveal lp-reveal-delay-1">
                  <span className="lp-problem-label solution">{t('landing.ui.solution')}</span>
                  <h3>{t(`landing.problems.s${n}Title`)}</h3>
                  <p>{t(`landing.problems.s${n}Desc`)}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── USE CASES ──────────────── */}
      <section className="lp-section lp-usecases" id="use-cases">
        <div className="lp-container">
          <div className="lp-section-center lp-reveal">
            <span className="lp-section-label">{t('landing.useCases.label')}</span>
            <h2 className="lp-section-title">{t('landing.useCases.title')}</h2>
            <p className="lp-section-subtitle">{t('landing.useCases.subtitle')}</p>
          </div>

          <div className="lp-usecases-grid">
            {[
              { emoji: '🏪', key: 'uc1' },
              { emoji: '🏢', key: 'uc2' },
              { emoji: '👤', key: 'uc3' },
              { emoji: '📋', key: 'uc4' },
            ].map((uc, i) => (
              <div key={i} className={`lp-usecase-card lp-reveal lp-reveal-delay-${i}`}>
                <span className="lp-usecase-emoji">{uc.emoji}</span>
                <h3>{t(`landing.useCases.${uc.key}Title`)}</h3>
                <p>{t(`landing.useCases.${uc.key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── MULTI-ORG CONTROL ──────────────── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-center lp-reveal">
            <span className="lp-section-label">{t('landing.architecture.label')}</span>
            <h2 className="lp-section-title">{t('landing.architecture.title')}</h2>
            <p className="lp-section-subtitle">{t('landing.architecture.subtitle')}</p>
          </div>

          <div className="lp-control-grid">
            <div className="lp-control-card lp-reveal">
              <div className="lp-control-icon"><IconShield /></div>
              <h3>{t('landing.architecture.card1Title')}</h3>
              <p>{t('landing.architecture.card1Desc')}</p>
            </div>

            <div className="lp-control-card lp-reveal lp-reveal-delay-1">
              <div className="lp-control-icon"><IconHierarchy /></div>
              <h3>{t('landing.architecture.card2Title')}</h3>
              <p>{t('landing.architecture.card2Desc')}</p>
              <div className="lp-role-chain">
                <div className="lp-role-item"><span className="lp-role-dot admin" />{t('landing.architecture.role1')}</div>
                <div className="lp-role-item"><span className="lp-role-dot org" />{t('landing.architecture.role2')}</div>
                <div className="lp-role-item"><span className="lp-role-dot sup" />{t('landing.architecture.role3')}</div>
                <div className="lp-role-item"><span className="lp-role-dot emp" />{t('landing.architecture.role4')}</div>
              </div>
            </div>

            <div className="lp-control-card lp-reveal lp-reveal-delay-2">
              <div className="lp-control-icon"><IconBranding /></div>
              <h3>{t('landing.architecture.card3Title')}</h3>
              <p>{t('landing.architecture.card3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── FAQ ──────────────── */}
      <section className="lp-section lp-pricing" id="plans">
        <div className="lp-container">
          <div className="lp-section-center lp-reveal">
            <span className="lp-section-label">{pricingText.label}</span>
            <h2 className="lp-section-title">{pricingText.title}</h2>
            <p className="lp-section-subtitle">{pricingText.subtitle}</p>

            <div className="lp-pricing-toggle" role="group" aria-label={pricingText.label}>
              <button
                type="button"
                aria-pressed={billingCycle === 'monthly'}
                className={billingCycle === 'monthly' ? 'active' : ''}
                onClick={() => setBillingCycle('monthly')}
              >
                {pricingText.monthly}
              </button>
              <button
                type="button"
                aria-pressed={billingCycle === 'yearly'}
                className={billingCycle === 'yearly' ? 'active' : ''}
                onClick={() => setBillingCycle('yearly')}
              >
                {pricingText.yearly}
                <span className="lp-pricing-toggle-badge">{pricingText.yearlyBadge}</span>
              </button>
            </div>
          </div>

          <div className="lp-pricing-banner lp-reveal lp-reveal-delay-1">
            <div>
              <span className="lp-pricing-banner-eyebrow">{pricingText.bannerEyebrow}</span>
              <h3>{pricingText.bannerTitle}</h3>
              <p>{pricingText.bannerText}</p>
            </div>
            <span className="lp-pricing-banner-market">
              {pricingText.marketLabel}: SAR
            </span>
          </div>

          <div className="lp-pricing-grid">
            {plansData.map((plan, index) => {
              const savingsPercent = getPlanSavingsPercent(plan);
              const isFeatured = plan.code === 'plus';
              const isPremium = plan.code === 'pro';

              return (
                <article
                  key={plan.code}
                  className={`lp-plan-card ${isFeatured ? 'featured' : ''} ${isPremium ? 'premium' : ''} lp-reveal lp-reveal-delay-${Math.min(index + 1, 3)}`}
                >
                  <div className="lp-plan-top">
                    <div>
                      <div className="lp-plan-badges">
                        <span className="lp-plan-code">{plan.code.toUpperCase()}</span>
                        <span className="lp-plan-badge">{getPlanBadge(plan)}</span>
                      </div>
                      <h3>{getPlanName(plan, i18n.language)}</h3>
                      <p>{getPlanDescription(plan, i18n.language)}</p>
                    </div>

                    <span className="lp-plan-market">
                      {plan.market?.primaryRegion} / {plan.market?.primaryCountry}
                    </span>
                  </div>

                  <div className="lp-plan-price-block">
                    <div className="lp-plan-price-row">
                      <span className="lp-plan-price">{getPlanPrice(plan, billingCycle)}</span>
                      <span className="lp-plan-price-cycle">
                        {billingCycle === 'monthly' ? pricingText.perMonth : pricingText.perYear}
                      </span>
                    </div>
                    <p className="lp-plan-price-note">{getPlanPriceNote(plan)}</p>
                    {billingCycle === 'yearly' && savingsPercent > 0 ? (
                      <span className="lp-plan-savings">{pricingText.save} {savingsPercent}%</span>
                    ) : null}
                  </div>

                  <div className="lp-plan-cta">
                    <Link
                      to="/register"
                      className={`lp-btn ${plan.code === 'free' ? 'lp-btn-secondary' : 'lp-btn-primary'} lp-plan-btn`}
                    >
                      {plan.code === 'free' ? pricingText.startFree : pricingText.choosePlan}
                    </Link>
                    <span className="lp-plan-checkout">{getPlanCheckoutHint(plan)}</span>
                  </div>

                  <div className="lp-plan-limits">
                    {LIMIT_FIELDS.map((limit) => (
                      <div key={limit.key} className="lp-plan-limit">
                        <span className="lp-plan-limit-value">
                          {formatLimitValue(plan.limits?.[limit.key], t, locale)}
                        </span>
                        <span className="lp-plan-limit-label">{t(limit.labelKey)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="lp-plan-features">
                    <h4>{pricingText.included}</h4>
                    <ul className="lp-plan-feature-list">
                      {FEATURE_FIELDS.map((feature) => {
                        const enabled = Boolean(plan.features?.[feature.key]);

                        return (
                          <li key={feature.key} className={enabled ? 'enabled' : 'disabled'}>
                            <span className="lp-plan-feature-icon">
                              {enabled ? <IconCheck /> : null}
                            </span>
                            <span>{t(feature.labelKey)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp-section lp-faq" id="faq">
        <div className="lp-container">
          <div className="lp-section-center lp-reveal">
            <span className="lp-section-label">{t('landing.faq.label')}</span>
            <h2 className="lp-section-title">{t('landing.faq.title')}</h2>
          </div>

          <div className="lp-faq-list">
            {faqKeys.map((n) => (
              <div key={n} className={`lp-faq-item lp-reveal ${openFaq === n ? 'open' : ''}`}>
                <button className="lp-faq-question" onClick={() => setOpenFaq(openFaq === n ? null : n)}>
                  <span>{t(`landing.faq.q${n}`)}</span>
                  <IconChevron />
                </button>
                <div className="lp-faq-answer">
                  <p>{t(`landing.faq.a${n}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── FINAL CTA ──────────────── */}
      <section className="lp-cta">
        <div className="lp-container">
          <div className="lp-cta-content lp-reveal">
            <h2>{t('landing.cta.title1')}<br />{t('landing.cta.title2')}</h2>
            <p className="lp-cta-sub">{t('landing.cta.subtitle')}</p>
            <p className="lp-cta-support">{t('landing.cta.support')}</p>
            <div className="lp-cta-btns">
              <Link to="/register" className="lp-btn lp-btn-primary">{t('landing.cta.cta1')}</Link>
              <a href="#features" className="lp-btn lp-btn-secondary" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>{t('landing.cta.cta2')}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── FOOTER ──────────────── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <img src="/logo.png" alt="AraRM" className="lp-footer-logo" />
              <p>{t('landing.footer.tagline')}</p>
            </div>
            <div className="lp-footer-col">
              <h4>{t('landing.footer.product')}</h4>
              <ul>
                {navItems.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(item.id); }}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>{t('landing.footer.access')}</h4>
              <ul>
                <li><Link to="/login">{t('landing.nav.login')}</Link></li>
                <li><Link to="/register">{t('common.register')}</Link></li>
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>{t('landing.footer.legal')}</h4>
              <ul>
                <li><a href="#privacy">{t('landing.footer.privacy')}</a></li>
                <li><a href="#terms">{t('landing.footer.terms')}</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>{t('landing.footer.copyright', { year: new Date().getFullYear() })}</span>
            <span>{t('landing.footer.builtFor')}</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
