import React, { useEffect, useMemo, useState } from 'react';
import { FaImage, FaPhone, FaQrcode } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import { getLocalizedText, getSampleValue, normalizePdfStyle } from './templateBuilderUtils';

const MetadataPill = ({ label, value }) => (
  <div className="rounded-2xl border border-primary/15 bg-white px-4 py-3 shadow-sm">
    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{label}</div>
    <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
  </div>
);

const PreviewField = ({ field, isRTL, borderColor, pdfStyle }) => (
  <div className="rounded-2xl border bg-white p-3 shadow-sm" style={{ borderColor }}>
    {field.pdfDisplay?.showLabel !== false && (
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: pdfStyle.colors.text }}>
        {getLocalizedText(field.label, isRTL, isRTL ? 'حقل' : 'Field')}
      </div>
    )}
    {field.pdfDisplay?.showValue !== false && (
      <div
        className="whitespace-pre-wrap"
        style={{
          color: pdfStyle.colors.text,
          fontSize: `${field.pdfDisplay?.fontSize || pdfStyle.fontSize.field}px`,
          fontWeight: field.pdfDisplay?.bold ? 700 : 400,
          textAlign: field.pdfDisplay?.alignment || 'left'
        }}
      >
        {field.type === 'static_text'
          ? getLocalizedText(field.defaultValue, isRTL, getSampleValue(field.type, isRTL))
          : getSampleValue(field.type, isRTL)}
      </div>
    )}
  </div>
);

const PreviewSection = ({ section, isRTL, pdfStyle }) => {
  const layoutType = section.advancedLayout?.layoutType || 'simple';
  const sectionStyle = section.pdfStyle || {};
  const borderColor = section.advancedLayout?.styling?.borderColor || sectionStyle.borderColor || pdfStyle.colors.border;
  const backgroundColor = sectionStyle.showBackground ? (sectionStyle.backgroundColor || '#ffffff') : '#ffffff';
  const fields = (section.fields || []).filter((field) => field.visible !== false);
  const titleBackgroundColor = section.sectionType === 'totals'
    ? pdfStyle.colors.primary
    : pdfStyle.colors.secondary || pdfStyle.branding.secondaryColor || pdfStyle.colors.primary;

  return (
    <section
      className="overflow-hidden rounded-[28px] border shadow-sm"
      style={{
        borderColor: sectionStyle.showBorder === false ? 'transparent' : borderColor,
        borderWidth: sectionStyle.showBorder === false ? 0 : sectionStyle.borderWidth || 1,
        backgroundColor
      }}
    >
      {section.advancedLayout?.styling?.showTitle !== false && (
        <div
          className="px-5 py-4"
          style={{
            backgroundColor: titleBackgroundColor,
            color: '#ffffff'
          }}
        >
          <div className="text-sm font-semibold uppercase tracking-[0.24em] opacity-80">
            {getLocalizedText(section.label, isRTL, isRTL ? 'قسم' : 'Section')}
          </div>
        </div>
      )}

      <div className="p-5">
        {layoutType === 'table' && section.advancedLayout?.table?.enabled ? (
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor }}>
            <table className="w-full border-collapse">
              {section.advancedLayout.table.showHeader !== false && (
                <thead>
                  <tr>
                    {section.advancedLayout.table.columns.map((column) => (
                      <th
                        key={column.id}
                        className="px-3 py-3 text-sm font-semibold"
                        style={{
                          backgroundColor: column.headerStyle?.backgroundColor,
                          color: column.headerStyle?.textColor,
                          textAlign: column.alignment || 'left'
                        }}
                      >
                        {getLocalizedText(column.label, isRTL, isRTL ? 'عمود' : 'Column')}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {Array.from({ length: Math.max(3, section.advancedLayout.table.numberOfRows || 3) }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {section.advancedLayout.table.columns.map((column) => (
                      <td
                        key={`${column.id}_${rowIndex}`}
                        className="px-3 py-3 text-sm"
                        style={{
                          borderTop: `1px solid ${borderColor}`,
                          color: section.advancedLayout.table.cellStyle?.textColor || pdfStyle.colors.text,
                          backgroundColor: rowIndex % 2 === 1 && section.advancedLayout.table.stripedRows
                            ? '#f9fafb'
                            : section.advancedLayout.table.cellStyle?.backgroundColor || '#ffffff',
                          textAlign: column.alignment || 'left'
                        }}
                      >
                        {getSampleValue(column.fieldType || 'text', isRTL)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : layoutType === 'columns' && section.advancedLayout?.columns?.enabled ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${section.advancedLayout.columns.columnCount || 2}, minmax(0, 1fr))` }}>
            {fields.map((field) => (
              <PreviewField key={field.key} field={field} isRTL={isRTL} borderColor={borderColor} pdfStyle={pdfStyle} />
            ))}
          </div>
        ) : layoutType === 'grid' && section.advancedLayout?.grid?.enabled ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: section.advancedLayout.grid.template || `repeat(${section.advancedLayout.grid.columns || 2}, minmax(0, 1fr))` }}>
            {fields.map((field) => (
              <PreviewField key={field.key} field={field} isRTL={isRTL} borderColor={borderColor} pdfStyle={pdfStyle} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.key}
                className={field.width === 'full' || field.width === 'two-thirds' || field.width === 'three-quarters' ? 'md:col-span-2' : ''}
              >
                <PreviewField field={field} isRTL={isRTL} borderColor={borderColor} pdfStyle={pdfStyle} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const TemplateBuilderPreview = ({ formData, isRTL, activeSectionId = null, onSelectSectionId }) => {
  const pdfStyle = normalizePdfStyle(formData.pdfStyle);
  const sections = useMemo(
    () => formData.sections.filter((section) => section.visible !== false),
    [formData.sections]
  );
  const previewDate = new Date().toISOString().slice(0, 10);
  const [previewTab, setPreviewTab] = useState('all');

  useEffect(() => {
    if (activeSectionId && sections.some((section) => section.id === activeSectionId)) {
      setPreviewTab(activeSectionId);
      return;
    }

    if (previewTab !== 'all' && !sections.some((section) => section.id === previewTab)) {
      setPreviewTab('all');
    }
  }, [activeSectionId, previewTab, sections]);

  const sectionsToRender = previewTab === 'all'
    ? sections
    : sections.filter((section) => section.id === previewTab);

  return (
    <Card className="overflow-hidden border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            {isRTL ? 'معاينة مباشرة' : 'Live Preview'}
          </p>
          <h3 className="mt-1 text-xl font-bold text-gray-900">
            {getLocalizedText(formData.title, isRTL, isRTL ? 'نموذج بدون عنوان' : 'Untitled Template')}
          </h3>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
          {formData.layout.pageSize} / {formData.layout.orientation}
        </div>
      </div>

      {sections.length > 0 && (
        <div className="mb-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              {previewTab === 'all'
                ? (isRTL ? 'معاينة الوثيقة كاملة' : 'Previewing the full document')
                : (isRTL ? 'معاينة قسم واحد داخل تبويبه' : 'Previewing a single section tab')}
            </p>
            <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              {sections.length} {isRTL ? 'قسم ظاهر' : 'visible sections'}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 hidden-scrollbar">
            <button
              type="button"
              onClick={() => setPreviewTab('all')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                previewTab === 'all'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-primary'
              }`}
            >
              {isRTL ? 'كل الأقسام' : 'All Sections'}
            </button>

            {sections.map((section, index) => (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setPreviewTab(section.id);
                  if (onSelectSectionId) {
                    onSelectSectionId(section.id);
                  }
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  previewTab === section.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-primary'
                }`}
              >
                {getLocalizedText(section.label, isRTL, isRTL ? `قسم ${index + 1}` : `Section ${index + 1}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[34px] bg-gradient-to-br from-primary/10 via-white to-primary/5 p-4 ring-1 ring-primary/10">
        <div className="mx-auto overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          {pdfStyle.header.enabled && (
            <div
              className="px-6 py-5"
              style={{
                minHeight: `${pdfStyle.header.height}px`,
                backgroundColor: pdfStyle.header.backgroundColor,
                color: pdfStyle.header.textColor,
                borderBottom: pdfStyle.header.border?.show !== false ? `${pdfStyle.header.border?.width || 0}px ${pdfStyle.header.border?.style || 'solid'} ${pdfStyle.header.border?.color || pdfStyle.colors.primary}` : 'none'
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {pdfStyle.header.showLogo && (
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white/85 text-sm font-bold text-gray-500 shadow-sm">
                      {pdfStyle.branding.logoUrl ? (
                        <img src={pdfStyle.branding.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <FaImage />
                      )}
                    </div>
                  )}
                  <div className="space-y-1">
                    {pdfStyle.header.showCompanyName !== false && (
                      <div className="text-sm font-semibold uppercase tracking-[0.28em]">
                        {getLocalizedText(pdfStyle.branding.companyName, isRTL, 'Company')}
                      </div>
                    )}
                    {pdfStyle.header.showCompanyAddress !== false && getLocalizedText(pdfStyle.branding.companyAddress, isRTL) && (
                      <div className="max-w-md text-sm opacity-80">
                        {getLocalizedText(pdfStyle.branding.companyAddress, isRTL)}
                      </div>
                    )}
                  </div>
                </div>

                <div className={isRTL ? 'space-y-1 text-right' : 'space-y-1 text-left'}>
                  {pdfStyle.header.showTitle !== false && (
                    <div className="text-2xl font-bold" style={{ color: pdfStyle.header.titleColor || pdfStyle.colors.primary }}>
                      {getLocalizedText(formData.title, isRTL, isRTL ? 'عنوان النموذج' : 'Template title')}
                    </div>
                  )}
                  {pdfStyle.header.showSubtitle && getLocalizedText(pdfStyle.header.subtitle, isRTL) && (
                    <div className="text-sm opacity-80">{getLocalizedText(pdfStyle.header.subtitle, isRTL)}</div>
                  )}
                  {pdfStyle.header.showDate !== false && (
                    <div className="text-xs uppercase tracking-[0.2em] opacity-70">
                      {isRTL ? `التاريخ: ${previewDate}` : `Date: ${previewDate}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div
            className="space-y-5"
            style={{
              paddingTop: `${formData.layout.margins.top / 2}px`,
              paddingRight: `${formData.layout.margins.right / 2}px`,
              paddingBottom: `${formData.layout.margins.bottom / 2}px`,
              paddingLeft: `${formData.layout.margins.left / 2}px`,
              backgroundColor: pdfStyle.colors.background
            }}
          >
            {pdfStyle.metadata?.enabled !== false && (
              <div className="grid gap-3 rounded-[28px] border border-dashed border-primary/20 bg-white/80 p-5 md:grid-cols-3">
                {pdfStyle.metadata.showFormId !== false && (
                  <MetadataPill label={isRTL ? 'رقم النموذج' : 'Form ID'} value="TMP-001" />
                )}
                {pdfStyle.metadata.showDepartment !== false && (
                  <MetadataPill label={isRTL ? 'القسم' : 'Department'} value={formData.templateDepartment === 'all' ? (isRTL ? 'كل الأقسام' : 'All departments') : formData.templateDepartment} />
                )}
                {pdfStyle.metadata.showFilledBy !== false && (
                  <MetadataPill label={isRTL ? 'أُدخل بواسطة' : 'Filled by'} value={isRTL ? 'اسم الموظف' : 'Employee name'} />
                )}
              </div>
            )}

            {sections.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-primary/20 bg-white/70 px-6 py-12 text-center text-gray-500">
                {isRTL ? 'أضف قسمًا لرؤية تصميم الـ PDF.' : 'Add a section to see the PDF layout.'}
              </div>
            ) : (
              sectionsToRender.map((section) => (
                <PreviewSection key={section.id} section={section} isRTL={isRTL} pdfStyle={pdfStyle} />
              ))
            )}
          </div>

          {pdfStyle.footer.enabled && (
            <div className="px-6 py-4" style={{ minHeight: `${pdfStyle.footer.height}px`, backgroundColor: pdfStyle.footer.backgroundColor, color: pdfStyle.footer.textColor }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 text-sm">
                  {pdfStyle.footer.showCompanyInfo && (
                    <div className="font-semibold">
                      {getLocalizedText(pdfStyle.branding.companyName, isRTL, pdfStyle.footer.companyName || 'Company')}
                    </div>
                  )}
                  {getLocalizedText(pdfStyle.footer.content, isRTL) && (
                    <div className="opacity-90">{getLocalizedText(pdfStyle.footer.content, isRTL)}</div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {pdfStyle.footer.showPhoneNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaPhone />
                      <span>{pdfStyle.footer.phoneNumber || pdfStyle.branding.companyPhone || '0000000000'}</span>
                    </div>
                  )}
                  {pdfStyle.footer.showQRCode && (
                    <div className="rounded-2xl bg-white p-3 text-gray-900">
                      <FaQrcode />
                    </div>
                  )}
                  {pdfStyle.footer.showPageNumbers && (
                    <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">1 / 1</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TemplateBuilderPreview;
