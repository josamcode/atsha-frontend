import React, { useMemo, useState } from 'react';
import { FaMagic, FaFileAlt, FaSearch } from 'react-icons/fa';

import { STARTER_TEMPLATES } from '../../../pages/Forms/templateBuilderUtils';

/**
 * Starter template chooser for a brand-new template.
 *
 * The previous builder showed the starter library inline and only while the
 * document was empty, which made it easy to miss and impossible to reach again.
 * Here it is an explicit first step with a blank option, and the starters
 * themselves are the existing layout-v1 definitions — they are converted by the
 * same read-time adapter every stored template goes through, so there is exactly
 * one conversion path to keep correct.
 */
const StarterTemplatePicker = ({ language, branding, onChoose, onSkip }) => {
  const isArabic = language === 'ar';
  const T = (en, ar) => (isArabic ? ar : en);
  const [query, setQuery] = useState('');

  const starters = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return STARTER_TEMPLATES;
    return STARTER_TEMPLATES.filter((starter) => (
      `${starter.name?.en || ''} ${starter.name?.ar || ''} ${starter.description?.en || ''} ${starter.description?.ar || ''}`
        .toLowerCase()
        .includes(term)
    ));
  }, [query]);

  return (
    <div className="tb-shell" dir={isArabic ? 'rtl' : 'ltr'} style={{ overflow: 'auto' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 20px 60px', width: '100%' }}>
        <div className="tb-eyebrow">{T('New template', 'نموذج جديد')}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 4px' }}>
          {T('Start from a layout', 'ابدأ من تخطيط جاهز')}
        </h1>
        <p style={{ color: '#64748b', marginBottom: 20, fontSize: 14 }}>
          {T(
            'Pick a starting point — you can change everything afterwards on the page canvas.',
            'اختر نقطة البداية — يمكنك تغيير كل شيء لاحقاً على لوحة التصميم.'
          )}
        </p>

        <div className="tb-field" style={{ maxWidth: 380 }}>
          <label className="tb-field__label" htmlFor="tb-starter-search">
            <FaSearch style={{ marginInlineEnd: 6 }} />
            {T('Search layouts', 'ابحث في التخطيطات')}
          </label>
          <input
            id="tb-starter-search"
            className="tb-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={T('e.g. inventory, incident, checklist', 'مثل: جرد، حادث، قائمة تحقق')}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
            marginTop: 16
          }}
        >
          <button
            type="button"
            className="tb-palette__item"
            style={{ minHeight: 116, alignItems: 'center' }}
            onClick={onSkip}
          >
            <span className="tb-palette__icon"><FaFileAlt /></span>
            <span>
              <span className="tb-palette__label">{T('Blank document', 'مستند فارغ')}</span>
              <span className="tb-palette__hint">
                {T('A header, one section, signatures and a footer.', 'ترويسة وقسم واحد وتوقيعات وتذييل.')}
              </span>
            </span>
          </button>

          {starters.map((starter) => (
            <button
              key={starter.id}
              type="button"
              className="tb-palette__item"
              style={{ minHeight: 116 }}
              onClick={() => onChoose(starter.template(branding))}
            >
              <span className="tb-palette__icon"><FaMagic /></span>
              <span>
                <span className="tb-palette__label">
                  {isArabic ? starter.name?.ar : starter.name?.en}
                </span>
                <span className="tb-palette__hint">
                  {isArabic ? starter.description?.ar : starter.description?.en}
                </span>
              </span>
            </button>
          ))}
        </div>

        {starters.length === 0 && (
          <div className="tb-empty">{T('No layouts matched that search.', 'لا توجد تخطيطات مطابقة.')}</div>
        )}
      </div>
    </div>
  );
};

export default StarterTemplatePicker;
