import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import {
  FiBell,
  FiCalendar,
  FiCheck,
  FiClipboard,
  FiFileText,
  FiGrid,
  FiLayers,
  FiMessageCircle,
  FiSearch,
  FiUsers
} from 'react-icons/fi';

const MOCK_TEXT = {
  ar: {
    announcementTitle: 'سياسة نظافة جديدة',
    announcementBody: 'يرجى مراجعة السياسة وتأكيد الإقرار قبل بداية الوردية.',
    readBy: 'قرأها 36 من 38',
    acknowledge: 'تأكيد الإقرار',
    reportTitle: 'تقرير الامتثال الشهري',
    reportOrg: 'مطاعم السفير',
    completion: 'نسبة الإنجاز',
    sickLeave: 'إجازة مرضية',
    days: ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'],
    expires: 'ينتهي خلال 00:24',
    shift: 'الوردية الصباحية',
    sheet: 'حضور_الفروع_نهائي_2.xlsx',
    stickyNote: 'لا تنسَ تجميع قوائم الإغلاق!',
    chat: 'مين وافق على الإجازة؟',
    chatSub: 'راجع مجموعة واتساب…'
  },
  en: {
    announcementTitle: 'New hygiene policy',
    announcementBody: 'Please review the policy and confirm before your shift starts.',
    readBy: 'Read by 36 of 38',
    acknowledge: 'Acknowledge',
    reportTitle: 'Monthly compliance report',
    reportOrg: 'Al Safir Restaurants',
    completion: 'Completion',
    sickLeave: 'Sick leave',
    days: ['S', 'S', 'M', 'T', 'W', 'T', 'F'],
    expires: 'Expires in 00:24',
    shift: 'Morning shift',
    sheet: 'branch_attendance_final_2.xlsx',
    stickyNote: "Don't forget to collect closing lists!",
    chat: 'Who approved the leave?',
    chatSub: 'Check the WhatsApp group…'
  }
};

const useMockText = () => {
  const { t, i18n } = useTranslation();
  return { t, mock: MOCK_TEXT[i18n.language === 'ar' ? 'ar' : 'en'] };
};

const Status = ({ kind, children }) => (
  <span className={`lp-status lp-status-${kind}`}>{children}</span>
);

export const BrowserFrame = ({ className = '', children }) => (
  <div className={`lp-frame ${className}`} aria-hidden="true">
    <div className="lp-frame-bar">
      <span className="lp-frame-address" />
      <span className="lp-frame-dots"><i /><i /><i /></span>
    </div>
    <div className="lp-frame-body">{children}</div>
  </div>
);

const FormRows = ({ limit = 3 }) => {
  const { t } = useTranslation();
  const rows = [
    { title: 'form1', sub: 'form1Sub', status: 'approved' },
    { title: 'form2', sub: 'form2Sub', status: 'pending' },
    { title: 'form3', sub: 'form3Sub', status: 'submitted' }
  ].slice(0, limit);

  return (
    <div className="lp-mock-list">
      {rows.map((row) => (
        <div className="lp-mock-row" key={row.title}>
          <span className="lp-mock-icon"><FiFileText /></span>
          <span className="lp-mock-row-text">
            <strong>{t(`landing.ui.${row.title}`)}</strong>
            <small>{t(`landing.ui.${row.sub}`)}</small>
          </span>
          <Status kind={row.status}>{t(`landing.ui.${row.status}`)}</Status>
        </div>
      ))}
    </div>
  );
};

const StatTiles = () => {
  const { t } = useTranslation();
  const stats = [
    { label: t('landing.ui.formsToday'), value: 24, icon: <FiClipboard />, tone: 'mint' },
    { label: t('landing.ui.present'), value: 38, icon: <FiCheck />, tone: 'green' },
    { label: t('landing.ui.pendingLeaves'), value: 5, icon: <FiCalendar />, tone: 'amber' }
  ];

  return (
    <div className="lp-mock-stats">
      {stats.map((stat) => (
        <div className="lp-mock-stat" key={stat.label}>
          <span className={`lp-mock-stat-icon ${stat.tone}`}>{stat.icon}</span>
          <small>{stat.label}</small>
          <strong>{stat.value}</strong>
        </div>
      ))}
    </div>
  );
};

export const HeroDashboard = ({ modules }) => {
  const { t } = useTranslation();
  const icons = [<FiLayers />, <FiGrid />, <FiClipboard />, <FiCalendar />, <FiMessageCircle />, <FiFileText />];

  return (
    <BrowserFrame className="lp-hero-frame">
      <div className="lp-app">
        <div className="lp-app-side">
          <span className="lp-app-logo"><img src="/logo.png" alt="" /></span>
          {modules.map((module, index) => (
            <span key={module.key} className={`lp-app-link ${index === 1 ? 'active' : ''}`}>
              {icons[index]}
              {module.tab}
            </span>
          ))}
        </div>
        <div className="lp-app-main">
          <div className="lp-app-top">
            <span className="lp-app-search"><FiSearch /></span>
            <span className="lp-app-date">{t('landing.ui.dateLabel')}</span>
            <span className="lp-app-bell"><FiBell /></span>
          </div>
          <div className="lp-app-welcome">
            <strong>{t('landing.ui.welcomeName')}</strong>
            <small>{t('landing.ui.roleLabel')}</small>
          </div>
          <StatTiles />
          <div className="lp-mock-panel">
            <div className="lp-mock-panel-head">
              <strong>{t('landing.ui.recentForms')}</strong>
              <small>{t('landing.ui.viewAll')}</small>
            </div>
            <FormRows />
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};

export const HeroToast = ({ modules }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % modules.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [modules.length]);

  const module = modules[index];

  return (
    <div className="lp-hero-toast" aria-hidden="true">
      <span className="lp-hero-toast-icon"><FiCheck /></span>
      <strong key={module.key}>{module.title}</strong>
      <span className="lp-hero-toast-dots">
        {modules.map((item, dot) => <i key={item.key} className={dot === index ? 'active' : ''} />)}
      </span>
    </div>
  );
};

const OrgVisual = () => {
  const { t } = useTranslation();
  const fields = [
    { label: 'landing.workflow.s1Field1', value: 'landing.workflow.s1Value1' },
    { label: 'landing.workflow.s1Field2', value: 'landing.workflow.s1Value2' }
  ];

  return (
    <div className="lp-mock-page">
      <div className="lp-mock-title">{t('landing.features.f1Title')}</div>
      <div className="lp-mock-fields">
        {fields.map((field) => (
          <label key={field.label}>
            <small>{t(field.label)}</small>
            <span>{t(field.value)}</span>
          </label>
        ))}
      </div>
      <div className="lp-mock-panel">
        {[1, 2, 3].map((n) => (
          <div className="lp-mock-row" key={n}>
            <span className="lp-mock-icon"><FiUsers /></span>
            <span className="lp-mock-row-text"><strong>{t(`landing.workflow.s2Dept${n}`)}</strong></span>
            <Status kind="approved">{t('landing.workflow.s2Active')}</Status>
          </div>
        ))}
      </div>
    </div>
  );
};

const QrVisual = () => {
  const { t, mock } = useMockText();

  return (
    <div className="lp-mock-page lp-mock-qr">
      <div className="lp-mock-qr-card">
        <QRCodeSVG value="ararm-demo-shift" size={148} fgColor="#022c22" bgColor="transparent" />
        <strong>{mock.shift}</strong>
        <small>{mock.expires}</small>
      </div>
      <div className="lp-mock-qr-side">
        <div className="lp-mock-stat">
          <span className="lp-mock-stat-icon green"><FiCheck /></span>
          <small>{t('landing.ui.present')}</small>
          <strong>38</strong>
        </div>
        <div className="lp-mock-panel">
          {[1, 2, 3].map((n) => (
            <div className="lp-mock-row" key={n}>
              <span className="lp-mock-icon"><FiCheck /></span>
              <span className="lp-mock-row-text"><strong>{t(`landing.ui.form${n}Sub`)}</strong></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FormsVisual = () => {
  const { t } = useTranslation();

  return (
    <div className="lp-mock-page">
      <div className="lp-mock-title">{t('landing.ui.recentForms')}</div>
      <StatTiles />
      <div className="lp-mock-panel"><FormRows /></div>
    </div>
  );
};

const LeaveVisual = () => {
  const { t, mock } = useMockText();
  const cells = Array.from({ length: 28 }, (_, index) => index + 1);

  return (
    <div className="lp-mock-page">
      <div className="lp-mock-title">{t('landing.ui.pendingLeaves')}</div>
      <div className="lp-mock-calendar">
        {mock.days.map((day, index) => <small key={`${day}-${index}`}>{day}</small>)}
        {cells.map((day) => (
          <span key={day} className={day >= 10 && day <= 13 ? 'selected' : day === 20 ? 'marked' : ''}>{day}</span>
        ))}
      </div>
      <div className="lp-mock-panel">
        <div className="lp-mock-row">
          <span className="lp-mock-icon"><FiCalendar /></span>
          <span className="lp-mock-row-text">
            <strong>{mock.sickLeave}</strong>
            <small>{t('landing.ui.form2Sub')}</small>
          </span>
          <Status kind="approved">{t('landing.ui.approved')}</Status>
        </div>
      </div>
    </div>
  );
};

const MessagesVisual = () => {
  const { t, mock } = useMockText();

  return (
    <div className="lp-mock-page">
      <div className="lp-mock-title">{t('landing.replaces.after4')}</div>
      <div className="lp-mock-chips">
        {[1, 2, 3].map((n) => <span key={n}>{t(`landing.workflow.s2Dept${n}`)}</span>)}
      </div>
      <div className="lp-mock-message">
        <span className="lp-mock-icon"><FiBell /></span>
        <div>
          <strong>{mock.announcementTitle}</strong>
          <p>{mock.announcementBody}</p>
          <small>{mock.readBy}</small>
        </div>
      </div>
      <div className="lp-mock-message-action">{mock.acknowledge}</div>
    </div>
  );
};

const ReportsVisual = () => {
  const { t, mock } = useMockText();
  const bars = [62, 78, 54, 88, 72, 94, 83];

  return (
    <div className="lp-mock-page">
      <div className="lp-mock-report-head">
        <img src="/logo.png" alt="" />
        <span>
          <strong>{mock.reportTitle}</strong>
          <small>{mock.reportOrg}</small>
        </span>
      </div>
      <div className="lp-mock-panel">
        <div className="lp-mock-panel-head">
          <strong>{mock.completion}</strong>
          <small>94%</small>
        </div>
        <div className="lp-mock-bars">
          {bars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
        </div>
      </div>
      <div className="lp-mock-panel"><FormRows limit={1} /></div>
      <small className="lp-mock-caption">{t('landing.replaces.after5')}</small>
    </div>
  );
};

const FEATURE_VISUALS = {
  org: OrgVisual,
  qr: QrVisual,
  forms: FormsVisual,
  leave: LeaveVisual,
  messages: MessagesVisual,
  reports: ReportsVisual
};

export const FeatureVisual = ({ type }) => {
  const Visual = FEATURE_VISUALS[type];
  return <BrowserFrame><Visual /></BrowserFrame>;
};

export const OldWayVisual = () => {
  const { mock } = useMockText();

  return (
    <div className="lp-oldway" aria-hidden="true">
      <div className="lp-oldway-sheet">
        <div className="lp-oldway-sheet-head"><FiFileText />{mock.sheet}</div>
        <div className="lp-oldway-grid">
          {Array.from({ length: 24 }, (_, index) => (
            <i key={index} className={[6, 15].includes(index) ? 'bad' : ''} />
          ))}
        </div>
      </div>
      <div className="lp-oldway-note">{mock.stickyNote}</div>
      <div className="lp-oldway-chat">
        <strong>{mock.chat}</strong>
        <small>{mock.chatSub}</small>
      </div>
    </div>
  );
};

export const NewWayVisual = () => (
  <div className="lp-newway" aria-hidden="true">
    <div className="lp-frame">
      <div className="lp-frame-bar">
        <span className="lp-frame-address" />
        <span className="lp-frame-dots"><i /><i /><i /></span>
      </div>
      <div className="lp-frame-body">
        <div className="lp-mock-page">
          <StatTiles />
          <div className="lp-mock-panel"><FormRows /></div>
        </div>
      </div>
    </div>
  </div>
);

export const ReportDocument = () => {
  const { t, mock } = useMockText();

  return (
    <div className="lp-doc-wrap" aria-hidden="true">
      <div className="lp-doc">
        <div className="lp-doc-head">
          <strong>{mock.reportTitle}</strong>
          <small>{mock.reportOrg}</small>
        </div>
        {[1, 2, 3].map((n) => (
          <div className="lp-doc-row" key={n}>
            <span>{t(`landing.ui.form${n}`)}</span>
            <b><FiCheck /></b>
          </div>
        ))}
        <div className="lp-doc-total">
          <span>{mock.completion}</span>
          <strong>94%</strong>
        </div>
        <div className="lp-doc-qr">
          <QRCodeSVG value="ararm-demo-report" size={88} fgColor="#022c22" bgColor="transparent" />
        </div>
      </div>
      <span className="lp-doc-chip lp-doc-chip-a">QR</span>
      <span className="lp-doc-chip lp-doc-chip-b">PDF</span>
      <span className="lp-doc-chip lp-doc-chip-c">{t('landing.ui.approved')}</span>
    </div>
  );
};

export const ActivityFeed = () => {
  const { t } = useTranslation();
  const items = [
    { title: t('landing.ui.form1'), sub: t('landing.ui.form1Sub') },
    { title: t('landing.workflow.s4Action2'), sub: t('landing.ui.form2Sub') },
    { title: t('landing.ui.form3'), sub: t('landing.ui.form3Sub') },
    { title: t('landing.workflow.s4Action3'), sub: t('landing.ui.form1Sub') },
    { title: t('landing.ui.form2'), sub: t('landing.ui.form2Sub') },
    { title: t('landing.workflow.s4Action4'), sub: t('landing.ui.form3Sub') }
  ];

  return (
    <div className="lp-feed" aria-hidden="true">
      <div className="lp-feed-track">
        {[...items, ...items].map((item, index) => (
          <div className="lp-feed-item" key={index}>
            <span><FiCheck /></span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.sub}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
