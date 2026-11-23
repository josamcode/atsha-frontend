import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiClipboard,
  FiCoffee,
  FiDroplet,
  FiFileText,
  FiGitBranch,
  FiGlobe,
  FiGrid,
  FiHeart,
  FiLayers,
  FiMenu,
  FiMessageCircle,
  FiPlus,
  FiShield,
  FiShoppingBag,
  FiUser,
  FiUsers,
  FiX
} from 'react-icons/fi';
import {
  FEATURE_FIELDS,
  LIMIT_FIELDS,
  formatLimitValue,
  formatMoney,
  getPlanDescription,
  getPlanName
} from '../components/Platform/planUtils';
import billingService from '../services/billingService';
import {
  ActivityFeed,
  FeatureVisual,
  HeroDashboard,
  HeroToast,
  NewWayVisual,
  OldWayVisual,
  ReportDocument
} from './LandingVisuals';
import './LandingPage.css';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useScrollReveal() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const root = ref.current;

    if (!root || prefersReducedMotion() || !('IntersectionObserver' in window)) {
      return undefined;
    }

    root.classList.add('lp-motion');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.04, rootMargin: '0px 0px -4% 0px' }
    );

    root.querySelectorAll('.lp-reveal').forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return ref;
}

const PlatformStack = ({ modules, tryLabel, Arrow }) => {
  const [active, setActive] = useState(0);
  const anchorsRef = useRef([]);
  const firstItemRef = useRef(null);

  const getStickyTop = useCallback(() => {
    const value = firstItemRef.current ? parseFloat(getComputedStyle(firstItemRef.current).top) : NaN;
    return Number.isFinite(value) ? value : 136;
  }, []);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = getStickyTop() + 140;
      let next = 0;

      anchorsRef.current.forEach((anchor, index) => {
        if (anchor && anchor.getBoundingClientRect().top <= line) {
          next = index;
        }
      });

      setActive(next);
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [getStickyTop]);

  const goTo = (index) => {
    const anchor = anchorsRef.current[index];

    if (anchor) {
      window.scrollTo({
        top: anchor.getBoundingClientRect().top + window.scrollY - getStickyTop(),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });
    }
  };

  return (
    <>
      <nav className="lp-tabs" style={{ '--active': active }}>
        <ol>
          {modules.map((module, index) => (
            <li key={module.key}>
              <button
                type="button"
                aria-current={index === active ? 'true' : undefined}
                onClick={() => goTo(index)}
              >
                {module.icon}
                <span>{module.tab}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="lp-stack">
        {modules.map((module, index) => (
          <React.Fragment key={module.key}>
            <span
              className="lp-stack-anchor"
              ref={(element) => { anchorsRef.current[index] = element; }}
            />
            <article
              className={`lp-stack-item lp-tone-${index + 1}`}
              ref={index === 0 ? firstItemRef : undefined}
            >
              <div className="lp-stack-visual">
                <FeatureVisual type={module.key} />
              </div>
              <div className="lp-stack-copy">
                <span className="lp-stack-icon">{module.icon}</span>
                <span className="lp-script">{module.tab}</span>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <ul className="lp-checks">
                  {module.points.map((point) => (
                    <li key={point}><span className="lp-tick"><FiCheck /></span>{point}</li>
                  ))}
                </ul>
                <Link to="/register" className="lp-text-link">
                  {tryLabel}
                  <Arrow />
                </Link>
              </div>
            </article>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

const LandingPage = ({ initialSection = null }) => {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(1);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [plansData, setPlansData] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(false);
  const pageRef = useScrollReveal();
  const isArabic = i18n.language === 'ar';
  const locale = isArabic ? 'ar-SA' : 'en-US';
  const Arrow = isArabic ? FiArrowLeft : FiArrowRight;

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!initialSection) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const el = document.getElementById(initialSection);
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [initialSection]);

  useEffect(() => {
    let isActive = true;

    const loadPlans = async () => {
      setPlansLoading(true);
      setPlansError(false);

      try {
        const response = await billingService.getPlans();
        const plans = Array.isArray(response.data?.data?.plans) ? response.data.data.plans : [];

        if (!isActive) {
          return;
        }

        setPlansData(
          plans
            .filter((plan) => plan?.isActive !== false)
            .sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))
        );
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error('Error loading landing page plans:', error);
        setPlansData([]);
        setPlansError(true);
      } finally {
        if (isActive) {
          setPlansLoading(false);
        }
      }
    };

    loadPlans();

    return () => {
      isActive = false;
    };
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  const switchLanguage = () => {
    const nextLanguage = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(nextLanguage);
    localStorage.setItem('language', nextLanguage);
    document.documentElement.dir = nextLanguage === 'ar' ? 'rtl' : 'ltr';
    setMobileMenuOpen(false);
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
    freeForever: 'مجانية دائماً',
    loading: 'جاري تحميل الخطط...',
    empty: 'لا توجد خطط نشطة متاحة حالياً.',
    unavailable: 'تعذر تحميل الخطط حالياً. حاول مرة أخرى بعد قليل.'
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
    freeForever: 'Free forever',
    loading: 'Loading plans...',
    empty: 'No active plans are available right now.',
    unavailable: 'Plans are temporarily unavailable. Please try again shortly.'
  };

  const navItems = [
    { id: 'features', label: t('landing.nav.features') },
    { id: 'plans', label: pricingText.nav },
    { id: 'how-it-works', label: t('landing.nav.howItWorks') },
    { id: 'use-cases', label: t('landing.nav.useCases') },
    { id: 'faq', label: t('landing.nav.faq') }
  ];

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

  const modules = useMemo(() => {
    const copy = isArabic ? {
      org: { tab: 'المنظمات', points: ['بيانات معزولة لكل منظمة', 'علامة تجارية مخصصة', 'أقسام ونطاقات مستقلة'] },
      qr: { tab: 'الحضور', points: ['رموز QR محدودة الوقت', 'تسجيل بدون تلاعب', 'بدون أجهزة إضافية'] },
      forms: { tab: 'النماذج', points: ['قوائم تحقق وتقارير فحص', 'نماذج امتثال', 'مراجعة وموافقة المشرفين'] },
      leave: { tab: 'الإجازات', points: ['مرضية أو سنوية أو طارئة', 'موافقة في ثوانٍ', 'من لوحة التحكم مباشرة'] },
      messages: { tab: 'المراسلات', points: ['إعلانات عامة', 'رسائل مباشرة', 'كل شيء داخل المنصة'] },
      reports: { tab: 'التقارير', points: ['تقارير PDF', 'وثائق امتثال', 'بهوية المنظمة'] }
    } : {
      org: { tab: 'Organizations', points: ['Isolated data for each organization', 'Custom branding', 'Separate departments and domains'] },
      qr: { tab: 'Attendance', points: ['Time-limited QR codes', 'Tamper-resistant check-in', 'No extra hardware'] },
      forms: { tab: 'Forms', points: ['Checklists and inspection reports', 'Compliance forms', 'Supervisor review and approval'] },
      leave: { tab: 'Leave', points: ['Sick, annual, or emergency', 'Approve in seconds', 'Right from the dashboard'] },
      messages: { tab: 'Messaging', points: ['Company-wide announcements', 'Direct messages', 'Everything stays on the platform'] },
      reports: { tab: 'Reports', points: ['PDF reports', 'Compliance documents', 'Carrying your organization identity'] }
    };

    return [
      { key: 'org', icon: <FiLayers />, number: 1 },
      { key: 'qr', icon: <FiGrid />, number: 2 },
      { key: 'forms', icon: <FiClipboard />, number: 3 },
      { key: 'leave', icon: <FiCalendar />, number: 4 },
      { key: 'messages', icon: <FiMessageCircle />, number: 5 },
      { key: 'reports', icon: <FiFileText />, number: 6 }
    ].map((module) => ({
      ...module,
      ...copy[module.key],
      title: t(`landing.features.f${module.number}Title`),
      description: t(`landing.features.f${module.number}Desc`)
    }));
  }, [isArabic, t]);

  const industries = [
    { key: 'restaurants', icon: <FiCoffee /> },
    { key: 'retail', icon: <FiShoppingBag /> },
    { key: 'clinics', icon: <FiHeart /> },
    { key: 'franchises', icon: <FiGitBranch /> },
    { key: 'multiBranch', icon: <FiBriefcase /> }
  ];

  const useCases = [
    { key: 'uc1', icon: <FiCoffee /> },
    { key: 'uc2', icon: <FiLayers /> },
    { key: 'uc3', icon: <FiUser /> },
    { key: 'uc4', icon: <FiClipboard /> }
  ];

  const onboardingSteps = [
    { n: 1, points: ['s1Field1', 's1Field2', 's1Field3'] },
    { n: 2, points: ['s2Dept1', 's2Dept2', 's2Dept3'] },
    { n: 3, points: ['s3Toggle1', 's3Toggle2', 's3Toggle3'] },
    { n: 4, points: ['s4Action1', 's4Action2', 's4Action3'] }
  ];

  const marqueeItems = [1, 2, 3, 4, 5, 6].map((n) => t(`landing.replaces.after${n}`));
  const faqKeys = [1, 2, 3, 4, 5, 6];

  const renderMarqueeGroup = (hidden) => (
    <ul aria-hidden={hidden ? 'true' : undefined}>
      {marqueeItems.map((item) => <li key={item}><FiCheck />{item}</li>)}
    </ul>
  );

  return (
    <div className="lp" ref={pageRef}>
      <div className="lp-chrome">
        <div className="lp-announce">
          <span className="lp-script">{t('landing.hero.badge')}</span>
          <span className="lp-announce-detail">{t('landing.cta.support')}</span>
        </div>

        <div className="lp-header-wrap">
          <header className={`lp-header ${scrolled ? 'is-scrolled' : ''}`}>
            <Link to="/" className="lp-brand" aria-label="AraRM">
              <img src="/logo.png" alt="AraRM" />
            </Link>

            <nav className="lp-nav" aria-label={t('landing.footer.product')}>
              {navItems.map((item) => (
                <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(item.id); }}>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="lp-header-actions">
              <button type="button" className="lp-lang" onClick={switchLanguage}>
                <FiGlobe />
                <span>{isArabic ? 'English' : 'العربية'}</span>
              </button>
              <Link to="/login" className="lp-btn lp-btn-quiet lp-btn-sm lp-header-login">{t('landing.nav.login')}</Link>
              <Link to="/register" className="lp-btn lp-btn-primary lp-btn-sm">{t('landing.nav.startFree')}</Link>
              <button
                type="button"
                className="lp-menu-toggle"
                aria-expanded={mobileMenuOpen}
                aria-label="Menu"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            </div>
          </header>
        </div>

        <div className={`lp-mobile ${mobileMenuOpen ? 'is-open' : ''}`}>
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(item.id); }}>
              {item.label}
            </a>
          ))}
          <button type="button" onClick={switchLanguage}><FiGlobe />{isArabic ? 'English' : 'العربية'}</button>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.login')}</Link>
        </div>
      </div>

      <section className="lp-hero lp-round-b">
        <div className="lp-container lp-hero-copy">
          <span className="lp-script lp-enter">{t('landing.hero.badge')}</span>
          <h1 className="lp-enter">
            <span>{t('landing.hero.title1')}</span>
            <span className="lp-mark">
              {t('landing.hero.title2')}
              <svg viewBox="0 0 400 14" preserveAspectRatio="none" aria-hidden="true">
                <path d="M398 7C310 3 228 10 150 8C96 6.5 48 7 2 11" />
              </svg>
            </span>
          </h1>
          <p className="lp-lead lp-enter">{t('landing.hero.subtitle')}</p>
          <div className="lp-hero-cta lp-enter">
            <Link to="/register" className="lp-btn lp-btn-primary">
              {t('landing.hero.cta1')}
              <Arrow />
            </Link>
            <a
              href="#how-it-works"
              className="lp-btn lp-btn-quiet"
              onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
            >
              {t('landing.hero.cta2')}
            </a>
          </div>
          <small className="lp-note lp-enter">{pricingText.noCardRequired}</small>
        </div>

        <div className="lp-hero-media lp-enter-media">
          <HeroDashboard modules={modules} />
          <HeroToast modules={modules} />
        </div>

        <div className="lp-container lp-industries lp-reveal">
          <h2>{t('landing.builtFor.label')}</h2>
          <ul>
            {industries.map((item) => (
              <li key={item.key}>{item.icon}{t(`landing.builtFor.${item.key}`)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lp-platform lp-under" id="features">
        <div className="lp-container">
          <div className="lp-head lp-reveal">
            <span className="lp-script">{t('landing.features.label')}</span>
            <h2>{t('landing.features.title')}</h2>
            <p className="lp-lead">{t('landing.features.subtitle')}</p>
            <Link to="/register" className="lp-btn lp-btn-primary">
              {t('landing.hero.cta1')}
              <Arrow />
            </Link>
          </div>

          <PlatformStack
            modules={modules}
            tryLabel={t('landing.hero.cta1')}
            Arrow={Arrow}
          />
        </div>
      </section>

      <section className="lp-compare lp-round-t lp-round-b">
        <div className="lp-container">
          <div className="lp-head lp-reveal">
            <span className="lp-script">{t('landing.replaces.label')}</span>
            <h2>{t('landing.replaces.title')}</h2>
            <p className="lp-lead">{t('landing.replaces.subtitle')}</p>
          </div>

          <div className="lp-compare-grid">
            <article className="lp-compare-card is-old lp-reveal">
              <h3>{t('landing.replaces.beforeTitle')}</h3>
              <ul className="lp-checks">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n}><span className="lp-tick is-x"><FiX /></span>{t(`landing.replaces.before${n}`)}</li>
                ))}
              </ul>
              <OldWayVisual />
            </article>

            <article className="lp-compare-card is-new lp-reveal" style={{ '--delay': '90ms' }}>
              <h3>{t('landing.replaces.afterTitle')}</h3>
              <ul className="lp-checks">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <li key={n}><span className="lp-tick"><FiCheck /></span>{t(`landing.replaces.after${n}`)}</li>
                ))}
              </ul>
              <NewWayVisual />
            </article>
          </div>

          <div className="lp-solutions">
            <div className="lp-head lp-reveal">
              <span className="lp-script">{t('landing.problems.label')}</span>
              <h2>{t('landing.problems.title')}</h2>
            </div>
            <div className="lp-solution-list">
              {[1, 2, 3, 4].map((n) => (
                <div className="lp-solution-row lp-reveal" key={n}>
                  <div className="is-problem">
                    <small>{t('landing.ui.problem')}</small>
                    <h3>{t(`landing.problems.p${n}Title`)}</h3>
                    <p>{t(`landing.problems.p${n}Desc`)}</p>
                  </div>
                  <span className="lp-solution-arrow"><Arrow /></span>
                  <div className="is-solution">
                    <small>{t('landing.ui.solution')}</small>
                    <h3>{t(`landing.problems.s${n}Title`)}</h3>
                    <p>{t(`landing.problems.s${n}Desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-proof lp-under lp-round-b">
        <div className="lp-container">
          <div className="lp-proof-hero">
            <div className="lp-proof-copy lp-reveal">
              <span className="lp-script">{t('landing.architecture.label')}</span>
              <p className="lp-proof-statement" dangerouslySetInnerHTML={{ __html: t('landing.positioning') }} />
            </div>
            <div className="lp-reveal"><ReportDocument /></div>
          </div>

          <div className="lp-split-head lp-reveal">
            <h2>{t('landing.architecture.title')}</h2>
            <p className="lp-lead">{t('landing.architecture.subtitle')}</p>
          </div>

          <div className="lp-control-grid">
            <article className="lp-control-card is-primary lp-reveal">
              <span className="lp-control-icon"><FiShield /></span>
              <h3>{t('landing.architecture.card1Title')}</h3>
              <p>{t('landing.architecture.card1Desc')}</p>
            </article>
            <article className="lp-control-card lp-reveal" style={{ '--delay': '80ms' }}>
              <span className="lp-control-icon"><FiUsers /></span>
              <h3>{t('landing.architecture.card2Title')}</h3>
              <p>{t('landing.architecture.card2Desc')}</p>
              <ol className="lp-role-list">
                {[1, 2, 3, 4].map((n) => <li key={n}>{t(`landing.architecture.role${n}`)}</li>)}
              </ol>
            </article>
            <article className="lp-control-card lp-reveal" style={{ '--delay': '160ms' }}>
              <span className="lp-control-icon"><FiDroplet /></span>
              <h3>{t('landing.architecture.card3Title')}</h3>
              <p>{t('landing.architecture.card3Desc')}</p>
            </article>
          </div>

          <div className="lp-split-head lp-reveal" id="use-cases">
            <div>
              <span className="lp-script">{t('landing.useCases.label')}</span>
              <h2>{t('landing.useCases.title')}</h2>
            </div>
            <p className="lp-lead">{t('landing.useCases.subtitle')}</p>
          </div>

          <div className="lp-usecases">
            {useCases.map((item, index) => (
              <article
                className={`lp-usecase lp-usecase-${index + 1} lp-reveal`}
                key={item.key}
                style={{ '--delay': `${index * 70}ms` }}
              >
                <span className="lp-usecase-icon">{item.icon}</span>
                <div>
                  <h3>{t(`landing.useCases.${item.key}Title`)}</h3>
                  <p>{t(`landing.useCases.${item.key}Desc`)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="lp-marquee">
          <div className="lp-marquee-track">
            {renderMarqueeGroup(false)}
            {renderMarqueeGroup(true)}
          </div>
        </div>
      </section>

      <section className="lp-onboarding lp-under" id="how-it-works">
        <div className="lp-container">
          <div className="lp-head lp-reveal">
            <span className="lp-script">{t('landing.workflow.label')}</span>
            <h2>{t('landing.workflow.title')}</h2>
            <p className="lp-lead">{t('landing.workflow.subtitle')}</p>
            <Link to="/register" className="lp-btn lp-btn-primary">
              {t('landing.hero.cta1')}
              <Arrow />
            </Link>
          </div>

          <ol className="lp-steps">
            {onboardingSteps.map((step, index) => (
              <li className="lp-step lp-reveal" key={step.n} style={{ '--delay': `${index * 90}ms` }}>
                <span className="lp-step-pill">{step.n}</span>
                <span className="lp-step-dot" />
                <div className={`lp-step-card lp-step-card-${step.n}`}>
                  <h3>{t(`landing.workflow.s${step.n}Title`)}</h3>
                  <p>{t(`landing.workflow.s${step.n}Desc`)}</p>
                  <ul className="lp-checks">
                    {step.points.map((point) => (
                      <li key={point}><span className="lp-tick"><FiCheck /></span>{t(`landing.workflow.${point}`)}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-pricing lp-round-t" id="plans">
        <div className="lp-container">
          <div className="lp-head lp-reveal">
            <span className="lp-script">{pricingText.label}</span>
            <h2>{pricingText.title}</h2>
            <p className="lp-lead">{pricingText.subtitle}</p>

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
                <span>{pricingText.yearlyBadge}</span>
              </button>
            </div>
          </div>

          <div className="lp-pricing-banner lp-reveal">
            <div>
              <span className="lp-script">{pricingText.bannerEyebrow}</span>
              <h3>{pricingText.bannerTitle}</h3>
              <p>{pricingText.bannerText}</p>
            </div>
            <span className="lp-pricing-market">{pricingText.marketLabel}: SAR</span>
          </div>

          <div className="lp-pricing-grid" aria-busy={plansLoading}>
            {plansLoading ? (
              [1, 2, 3].map((card) => (
                <article key={card} className="lp-plan is-loading" aria-label={pricingText.loading}>
                  <i /><i /><i /><i />
                </article>
              ))
            ) : plansData.length > 0 ? (
              plansData.map((plan) => {
                const savingsPercent = getPlanSavingsPercent(plan);
                const isFeatured = plan.code === 'plus';
                const isPremium = plan.code === 'pro';

                return (
                  <article
                    key={plan.code}
                    className={`lp-plan ${isFeatured ? 'is-featured' : ''} ${isPremium ? 'is-premium' : ''}`}
                  >
                    <div className="lp-plan-top">
                      <div className="lp-plan-badges">
                        <span>{plan.code.toUpperCase()}</span>
                        <span>{getPlanBadge(plan)}</span>
                      </div>
                      <span className="lp-plan-market">
                        {plan.market?.primaryRegion} / {plan.market?.primaryCountry}
                      </span>
                    </div>

                    <h3>{getPlanName(plan, i18n.language)}</h3>
                    <p className="lp-plan-desc">{getPlanDescription(plan, i18n.language)}</p>

                    <div className="lp-plan-price">
                      <div>
                        <strong>{getPlanPrice(plan, billingCycle)}</strong>
                        <span>{billingCycle === 'monthly' ? pricingText.perMonth : pricingText.perYear}</span>
                      </div>
                      <p>{getPlanPriceNote(plan)}</p>
                      {billingCycle === 'yearly' && savingsPercent > 0 ? (
                        <em>{pricingText.save} {savingsPercent}%</em>
                      ) : null}
                    </div>

                    <div className="lp-plan-cta">
                      <Link
                        to="/register"
                        className={`lp-btn ${plan.code === 'free' ? 'lp-btn-quiet' : 'lp-btn-primary'}`}
                      >
                        {plan.code === 'free' ? pricingText.startFree : pricingText.choosePlan}
                      </Link>
                      <small>{getPlanCheckoutHint(plan)}</small>
                    </div>

                    <div className="lp-plan-limits">
                      {LIMIT_FIELDS.map((limit) => (
                        <div key={limit.key}>
                          <strong>{formatLimitValue(plan.limits?.[limit.key], t, locale)}</strong>
                          <small>{t(limit.labelKey)}</small>
                        </div>
                      ))}
                    </div>

                    <div className="lp-plan-features">
                      <h4>{pricingText.included}</h4>
                      <ul>
                        {FEATURE_FIELDS.map((feature) => {
                          const enabled = Boolean(plan.features?.[feature.key]);

                          return (
                            <li key={feature.key} className={enabled ? 'enabled' : 'disabled'}>
                              <span>{enabled ? <FiCheck /> : <FiX />}</span>
                              {t(feature.labelKey)}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="lp-pricing-empty">
                {plansError ? pricingText.unavailable : pricingText.empty}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="lp-faq lp-round-t" id="faq">
        <div className="lp-container lp-faq-grid">
          <div className="lp-faq-head lp-reveal">
            <span className="lp-script">{t('landing.faq.label')}</span>
            <h2>{t('landing.faq.title')}</h2>
          </div>

          <div className="lp-faq-list">
            {faqKeys.map((n) => {
              const isOpen = openFaq === n;

              return (
                <div key={n} className={`lp-faq-item ${isOpen ? 'is-open' : ''}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`lp-faq-${n}`}
                      onClick={() => setOpenFaq(isOpen ? null : n)}
                    >
                      <span>{t(`landing.faq.q${n}`)}</span>
                      <FiPlus />
                    </button>
                  </h3>
                  <div className="lp-faq-answer" id={`lp-faq-${n}`}>
                    <div><p>{t(`landing.faq.a${n}`)}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="lp-closing">
        <section className="lp-cta">
          <div className="lp-container lp-cta-grid">
            <div>
              <h2>
                <span>{t('landing.cta.title1')}</span>
                <span>{t('landing.cta.title2')}</span>
              </h2>
              <p>{t('landing.cta.subtitle')}</p>
              <small>{t('landing.cta.support')}</small>
              <div className="lp-cta-buttons">
                <Link to="/register" className="lp-btn lp-btn-white">
                  {t('landing.cta.cta1')}
                  <Arrow />
                </Link>
                <a
                  href="#features"
                  className="lp-btn lp-btn-outline"
                  onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
                >
                  {t('landing.cta.cta2')}
                </a>
              </div>
            </div>
            <ActivityFeed />
          </div>
        </section>

        <footer className="lp-footer">
          <div className="lp-container">
            <div className="lp-footer-grid">
              <div className="lp-footer-brand">
                <img src="/logo.png" alt="AraRM" />
                <p>{t('landing.footer.tagline')}</p>
              </div>
              <nav aria-label={t('landing.footer.product')}>
                <h4>{t('landing.footer.product')}</h4>
                {navItems.map((item) => (
                  <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(item.id); }}>
                    {item.label}
                  </a>
                ))}
              </nav>
              <nav aria-label={t('landing.footer.access')}>
                <h4>{t('landing.footer.access')}</h4>
                <Link to="/login">{t('landing.nav.login')}</Link>
                <Link to="/register">{t('common.register')}</Link>
              </nav>
              <nav aria-label={t('landing.footer.legal')}>
                <h4>{t('landing.footer.legal')}</h4>
                <a href="#privacy">{t('landing.footer.privacy')}</a>
                <a href="#terms">{t('landing.footer.terms')}</a>
              </nav>
            </div>
            <div className="lp-footer-bottom">
              <span>{t('landing.footer.copyright', { year: new Date().getFullYear() })}</span>
              <span>{t('landing.footer.builtFor')}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
