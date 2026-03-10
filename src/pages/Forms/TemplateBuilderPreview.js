import React, { useEffect, useMemo, useRef, useState } from 'react';
import FormDocument from './FormDocument';
import { getLeafTableColumns, getLocalizedText, getSampleValue, normalizeTemplate } from './templateBuilderUtils';

const PREVIEW_FORM_ID = 'preview-template-001';
const PREVIEW_TABLE_ROW_COUNT = 3;

const getPreviewFieldValue = (field, isRTL) => {
  switch (field.type) {
    case 'boolean':
      return true;
    case 'number':
      return 125;
    case 'date':
      return '2026-03-10';
    case 'time':
      return '08:30';
    case 'datetime':
      return '2026-03-10T08:30:00.000Z';
    case 'select':
      return getLocalizedText(field.options?.[0], isRTL, getSampleValue(field.type, isRTL));
    case 'static_text':
      return undefined;
    default:
      return getSampleValue(field.type, isRTL);
  }
};

const getPreviewColumnValue = (column, isRTL, rowIndex) => {
  const fieldType = column.fieldType || 'text';

  if (fieldType === 'number') {
    return rowIndex + 1;
  }

  if (fieldType === 'boolean') {
    return rowIndex % 2 === 0;
  }

  if (fieldType === 'date') {
    return '2026-03-10';
  }

  if (fieldType === 'time') {
    return '08:30';
  }

  if (fieldType === 'datetime') {
    return '2026-03-10T08:30:00.000Z';
  }

  if (fieldType === 'select') {
    return getLocalizedText(column.label, isRTL, getSampleValue(fieldType, isRTL));
  }

  const sampleValue = getSampleValue(fieldType, isRTL);
  return typeof sampleValue === 'string' ? `${sampleValue} ${rowIndex + 1}` : sampleValue;
};

const buildPreviewValues = (sections, isRTL) => {
  const values = {};

  sections.forEach((section) => {
    const fields = Array.isArray(section.fields) ? section.fields.filter((field) => field.visible !== false) : [];
    const advancedLayout = section.advancedLayout || {};
    const tableConfig = advancedLayout.table || {};
    const layoutType = advancedLayout.layoutType || 'simple';

    if (layoutType === 'table' && tableConfig.enabled && Array.isArray(tableConfig.columns)) {
      const leafColumns = getLeafTableColumns(tableConfig.columns);

      if (tableConfig.dynamicRows && tableConfig.rowSource) {
        values[`${section.id}.${tableConfig.rowSource}`] = Array.from(
          { length: PREVIEW_TABLE_ROW_COUNT },
          (_, rowIndex) => leafColumns.reduce((row, column, columnIndex) => {
            const fieldKey = column.fieldKey || column.id || `col${columnIndex + 1}`;
            row[fieldKey] = getPreviewColumnValue(column, isRTL, rowIndex);
            return row;
          }, {})
        );
        return;
      }

      Array.from(
        { length: Math.min(tableConfig.numberOfRows || PREVIEW_TABLE_ROW_COUNT, PREVIEW_TABLE_ROW_COUNT) },
        (_, rowIndex) => rowIndex
      ).forEach((rowIndex) => {
        leafColumns.forEach((column, columnIndex) => {
          const columnId = column.id || `col${columnIndex + 1}`;
          values[`${section.id}.row_${rowIndex}.col_${columnId}`] = getPreviewColumnValue(column, isRTL, rowIndex);
        });
      });

      return;
    }

    fields.forEach((field) => {
      const value = getPreviewFieldValue(field, isRTL);

      if (value !== undefined) {
        values[`${section.id}.${field.key}`] = value;
      }
    });
  });

  return values;
};

const TemplateBuilderPreview = ({ formData, isRTL, activeSectionId = null, onSelectSectionId }) => {
  const sections = useMemo(
    () => formData.sections.filter((section) => section.visible !== false),
    [formData.sections]
  );
  const [previewTab, setPreviewTab] = useState('all');
  const previousActiveSectionIdRef = useRef(null);

  useEffect(() => {
    const hasActiveSection = activeSectionId && sections.some((section) => section.id === activeSectionId);
    const activeSectionChanged = previousActiveSectionIdRef.current !== activeSectionId;

    if (hasActiveSection && activeSectionChanged) {
      setPreviewTab(activeSectionId);
    } else {
      setPreviewTab((currentTab) => {
        if (currentTab === 'all') {
          return currentTab;
        }

        if (sections.some((section) => section.id === currentTab)) {
          return currentTab;
        }

        return hasActiveSection ? activeSectionId : 'all';
      });
    }

    previousActiveSectionIdRef.current = activeSectionId;
  }, [activeSectionId, sections]);

  const sectionsToRender = previewTab === 'all'
    ? sections
    : sections.filter((section) => section.id === previewTab);

  const previewTemplate = useMemo(
    () => normalizeTemplate({
      ...formData,
      sections: sectionsToRender,
      layout: {
        ...formData.layout,
        sectionOrder: sectionsToRender.map((section) => section.id)
      }
    }),
    [formData, sectionsToRender]
  );

  const previewFormInstance = useMemo(() => {
    const now = new Date();
    const previewDepartment = formData.templateDepartment && formData.templateDepartment !== 'all'
      ? formData.templateDepartment
      : 'management';

    return {
      _id: PREVIEW_FORM_ID,
      date: now.toISOString(),
      shift: 'morning',
      department: previewDepartment,
      filledBy: {
        name: isRTL ? 'موظف تجريبي' : 'Preview Employee'
      },
      createdAt: now.toISOString(),
      approvedBy: formData.requiresApproval
        ? { name: isRTL ? 'مدير المراجعة' : 'Review Manager' }
        : null,
      approvalDate: formData.requiresApproval ? now.toISOString() : null,
      approvalNotes: '',
      values: buildPreviewValues(previewTemplate.sections, isRTL),
      images: []
    };
  }, [formData.requiresApproval, formData.templateDepartment, isRTL, previewTemplate.sections]);

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {isRTL ? 'معاينة مباشرة' : 'Live Preview'}
            </p>
            <h3 className="mt-1 text-lg font-bold text-gray-900">
              {getLocalizedText(formData.title, isRTL, isRTL ? 'نموذج بدون عنوان' : 'Untitled Template')}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {sections.length === 0
                ? (isRTL ? 'أضف قسماً لعرض القالب بنفس تصميم صفحة العرض.' : 'Add a section to preview the document with the same View Form layout.')
                : previewTab === 'all'
                  ? (isRTL ? 'معاينة المستند بالكامل بنفس تصميم صفحة العرض.' : 'Previewing the full document using the View Form layout.')
                  : (isRTL ? 'معاينة قسم واحد بنفس تصميم صفحة العرض.' : 'Previewing a single section using the View Form layout.')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {formData.layout.pageSize} / {formData.layout.orientation}
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {sections.length} {isRTL ? 'قسم ظاهر' : 'visible sections'}
            </div>
          </div>
        </div>

        {sections.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setPreviewTab('all')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                previewTab === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary'
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
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  previewTab === section.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary'
                }`}
              >
                {getLocalizedText(section.label, isRTL, isRTL ? `قسم ${index + 1}` : `Section ${index + 1}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <FormDocument
        formInstance={previewFormInstance}
        template={previewTemplate}
        isPrintMode
      />
    </div>
  );
};

export default TemplateBuilderPreview;
