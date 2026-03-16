import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const pageRef = useScrollReveal();

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
            <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>{t('landing.nav.features')}</a></li>
            <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>{t('landing.nav.howItWorks')}</a></li>
            <li><a href="#use-cases" onClick={(e) => { e.preventDefault(); scrollToSection('use-cases'); }}>{t('landing.nav.useCases')}</a></li>
            <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>{t('landing.nav.faq')}</a></li>
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
        <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>{t('landing.nav.features')}</a>
        <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>{t('landing.nav.howItWorks')}</a>
        <a href="#use-cases" onClick={(e) => { e.preventDefault(); scrollToSection('use-cases'); }}>{t('landing.nav.useCases')}</a>
        <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>{t('landing.nav.faq')}</a>
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
                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>{t('landing.nav.features')}</a></li>
                <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>{t('landing.nav.howItWorks')}</a></li>
                <li><a href="#use-cases" onClick={(e) => { e.preventDefault(); scrollToSection('use-cases'); }}>{t('landing.nav.useCases')}</a></li>
                <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>{t('landing.nav.faq')}</a></li>
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
