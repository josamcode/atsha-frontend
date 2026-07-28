import React from 'react';
import {
  FaArrowLeft, FaArrowRight, FaUndo, FaRedo, FaSearchPlus, FaSearchMinus,
  FaBorderAll, FaRulerCombined, FaSave, FaEye, FaPen, FaLanguage,
  FaCheckCircle, FaExclamationCircle, FaSpinner, FaCircle, FaExclamationTriangle
} from 'react-icons/fa';

import { SAVE_STATES } from '../state/builderReducer';

/**
 * Builder toolbar.
 *
 * Save state is deliberately never ambiguous: there is always exactly one pill
 * saying Saved / Unsaved / Saving / Failed, and the failed state offers the retry
 * directly rather than only surfacing a toast that can be missed.
 */
const BuilderToolbar = ({
  language,
  title,
  onTitleChange,
  saveState,
  saveError,
  lastSavedAt,
  canUndo,
  canRedo,
  zoom,
  previewMode,
  previewLanguage,
  sampleData,
  showGrid,
  showMargins,
  overflowCount,
  pageCount,
  onBack,
  onUndo,
  onRedo,
  onZoom,
  onZoomReset,
  onTogglePreview,
  onTogglePreviewLanguage,
  onToggleSampleData,
  onToggleGrid,
  onToggleMargins,
  onSave,
  saving
}) => {
  const isArabic = language === 'ar';
  const T = (en, ar) => (isArabic ? ar : en);

  const savePill = () => {
    switch (saveState) {
      case SAVE_STATES.SAVING:
        return { className: 'saving', icon: <FaSpinner className="animate-spin" />, text: T('Saving…', 'جاري الحفظ…') };
      case SAVE_STATES.SAVED:
        return {
          className: 'saved',
          icon: <FaCheckCircle />,
          text: lastSavedAt
            ? `${T('Saved', 'تم الحفظ')} ${new Date(lastSavedAt).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}`
            : T('Saved', 'تم الحفظ')
        };
      case SAVE_STATES.DIRTY:
        return { className: 'dirty', icon: <FaCircle style={{ fontSize: 8 }} />, text: T('Unsaved changes', 'تغييرات غير محفوظة') };
      case SAVE_STATES.ERROR:
        return { className: 'error', icon: <FaExclamationCircle />, text: saveError || T('Save failed', 'فشل الحفظ') };
      default:
        return { className: 'idle', icon: <FaCheckCircle />, text: T('Up to date', 'محدّث') };
    }
  };

  const pill = savePill();

  return (
    <header className="tb-toolbar">
      <button type="button" className="tb-icon-button" onClick={onBack} aria-label={T('Back to templates', 'العودة للنماذج')}>
        {isArabic ? <FaArrowRight /> : <FaArrowLeft />}
        <span>{T('Templates', 'النماذج')}</span>
      </button>

      <input
        className="tb-title-input"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder={T('Untitled template', 'نموذج بدون عنوان')}
        aria-label={T('Template title', 'عنوان النموذج')}
      />

      <span className={`tb-save-pill tb-save-pill--${pill.className}`} role="status" aria-live="polite">
        {pill.icon}
        {pill.text}
      </span>

      {overflowCount > 0 && (
        <span className="tb-save-pill tb-save-pill--error" title={T('Content overflows the page', 'المحتوى يتجاوز الصفحة')}>
          <FaExclamationTriangle />
          {overflowCount} {T('overflow', 'تجاوز')}
        </span>
      )}

      <div className="tb-toolbar__spacer" style={{ flex: 1 }} />

      <div className="tb-toolbar__group">
        <button type="button" className="tb-icon-button" onClick={onUndo} disabled={!canUndo} aria-label={T('Undo', 'تراجع')} title={`${T('Undo', 'تراجع')} (Ctrl+Z)`}>
          <FaUndo />
        </button>
        <button type="button" className="tb-icon-button" onClick={onRedo} disabled={!canRedo} aria-label={T('Redo', 'إعادة')} title={`${T('Redo', 'إعادة')} (Ctrl+Shift+Z)`}>
          <FaRedo />
        </button>
      </div>

      <span className="tb-toolbar__divider" />

      <div className="tb-toolbar__group">
        <button type="button" className="tb-icon-button" onClick={() => onZoom(-0.1)} aria-label={T('Zoom out', 'تصغير')}>
          <FaSearchMinus />
        </button>
        <button type="button" className="tb-icon-button" onClick={onZoomReset} aria-label={T('Reset zoom', 'إعادة التكبير')} style={{ minWidth: 56 }}>
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" className="tb-icon-button" onClick={() => onZoom(0.1)} aria-label={T('Zoom in', 'تكبير')}>
          <FaSearchPlus />
        </button>
      </div>

      <span className="tb-toolbar__divider" />

      <div className="tb-toolbar__group">
        <button
          type="button"
          className={`tb-icon-button${showGrid ? ' tb-icon-button--active' : ''}`}
          onClick={onToggleGrid}
          aria-pressed={showGrid}
          aria-label={T('Toggle column grid', 'إظهار شبكة الأعمدة')}
          title={T('Column grid', 'شبكة الأعمدة')}
        >
          <FaBorderAll />
        </button>
        <button
          type="button"
          className={`tb-icon-button${showMargins ? ' tb-icon-button--active' : ''}`}
          onClick={onToggleMargins}
          aria-pressed={showMargins}
          aria-label={T('Toggle margin guides', 'إظهار حدود الهوامش')}
          title={T('Printable bounds', 'حدود الطباعة')}
        >
          <FaRulerCombined />
        </button>
        <button
          type="button"
          className={`tb-icon-button${sampleData ? ' tb-icon-button--active' : ''}`}
          onClick={onToggleSampleData}
          aria-pressed={sampleData}
          title={T('Show sample values', 'عرض بيانات تجريبية')}
        >
          {sampleData ? T('Sample data', 'بيانات تجريبية') : T('Empty form', 'نموذج فارغ')}
        </button>
        <button
          type="button"
          className="tb-icon-button"
          onClick={onTogglePreviewLanguage}
          aria-label={T('Switch document language', 'تبديل لغة المستند')}
          title={T('Document language', 'لغة المستند')}
        >
          <FaLanguage />
          {previewLanguage === 'ar' ? 'AR' : 'EN'}
        </button>
      </div>

      <span className="tb-toolbar__divider" />

      <span className="tb-chip">{pageCount} {T('pages', 'صفحات')}</span>

      <button
        type="button"
        className={`tb-icon-button${previewMode ? ' tb-icon-button--active' : ''}`}
        onClick={onTogglePreview}
        aria-pressed={previewMode}
      >
        {previewMode ? <FaPen /> : <FaEye />}
        {previewMode ? T('Edit', 'تحرير') : T('Preview', 'معاينة')}
      </button>

      <button
        type="button"
        className="tb-icon-button tb-icon-button--active"
        onClick={onSave}
        disabled={saving}
        style={{ paddingInline: 16 }}
      >
        <FaSave />
        {saving ? T('Saving…', 'جاري الحفظ…') : T('Save', 'حفظ')}
      </button>
    </header>
  );
};

export default BuilderToolbar;
