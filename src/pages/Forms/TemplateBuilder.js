import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaEye, FaEyeSlash, FaMagic, FaSave } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import { showError, showSuccess, showWarning } from '../../utils/toast';
import { getDepartmentOptions } from '../../utils/organizationUi';
import SectionEditor, {
  Checkbox,
  ColorInput,
  EmptyEditorState,
  NumberInput,
  SelectField,
  TextAreaInput,
  TextInput
} from './TemplateBuilderEditor';
import TemplateBuilderPreview from './TemplateBuilderPreview';
import {
  SECTION_PRESETS,
  STARTER_TEMPLATES,
  THEMES,
  cloneData,
  createColumn,
  createField,
  createSectionFromPreset,
  finalizeTemplateForSave,
  generateId,
  getDefaultTemplate,
  getLocalizedText,
  mirrorEnglishToArabic,
  moveItem,
  normalizeColumn,
  normalizeField,
  normalizePdfStyle,
  normalizeSection,
  normalizeTemplate,
  reindexFields,
  reindexSections
} from './templateBuilderUtils';

const TemplateBuilder = () => {
  const { t, i18n } = useTranslation();
  const { organization } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const isRTL = i18n.language === 'ar';

  const departmentOptions = useMemo(
    () => getDepartmentOptions(organization, t, i18n.language, { includeAll: true }),
    [organization, t, i18n.language]
  );

  const [formData, setFormData] = useState(() => normalizeTemplate(getDefaultTemplate()));
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    let mounted = true;

    const fetchTemplate = async () => {
      try {
        const response = await api.get(`/form-templates/${id}`);
        if (!mounted) {
          return;
        }

        const normalized = normalizeTemplate(response.data.data);
        setFormData(normalized);
        setSelectedSectionId(normalized.sections[0]?.id || null);
      } catch (error) {
        console.error('Error fetching template:', error);
        showError(isRTL ? 'تعذر تحميل القالب.' : 'Unable to load the template.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTemplate();

    return () => {
      mounted = false;
    };
  }, [id, isEditMode, isRTL]);

  useEffect(() => {
    if (selectedSectionId && formData.sections.some((section) => section.id === selectedSectionId)) {
      return;
    }

    setSelectedSectionId(formData.sections[0]?.id || null);
  }, [formData.sections, selectedSectionId]);

  const selectedSection = useMemo(
    () => formData.sections.find((section) => section.id === selectedSectionId) || null,
    [formData.sections, selectedSectionId]
  );

  const validate = () => {
    const nextErrors = {};

    if (!getLocalizedText(formData.title, false) && !getLocalizedText(formData.title, true)) {
      nextErrors.title = isRTL ? 'أدخل عنوانًا للقالب.' : 'Template title is required.';
    }

    if (formData.sections.length === 0) {
      nextErrors.sections = isRTL ? 'أضف قسمًا واحدًا على الأقل.' : 'Add at least one section.';
    }

    formData.sections.forEach((section) => {
      if (!getLocalizedText(section.label, false) && !getLocalizedText(section.label, true)) {
        nextErrors[`section_${section.id}`] = isRTL ? 'كل قسم يحتاج اسمًا.' : 'Each section needs a name.';
      }

      if ((section.advancedLayout?.layoutType || 'simple') === 'table') {
        if (!(section.advancedLayout?.table?.columns || []).length) {
          nextErrors[`section_table_${section.id}`] = isRTL ? 'هذا القسم الجدولي يحتاج عمودًا واحدًا على الأقل.' : 'A table section needs at least one column.';
        }
      } else if (!(section.fields || []).length) {
        nextErrors[`section_fields_${section.id}`] = isRTL ? 'أضف حقلًا واحدًا على الأقل.' : 'Add at least one field.';
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const applyStarterTemplate = (starterId) => {
    const starter = STARTER_TEMPLATES.find((item) => item.id === starterId);
    if (!starter) {
      return;
    }

    const template = normalizeTemplate(starter.template());
    setFormData(template);
    setSelectedSectionId(template.sections[0]?.id || null);
    setErrors({});
    showSuccess(isRTL ? 'تم تحميل القالب المبدئي.' : 'Starter template loaded.');
  };

  const askNumber = (message, fallbackValue, min = 1) => {
    const raw = window.prompt(message, String(fallbackValue));
    if (raw === null) {
      return null;
    }

    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < min) {
      return fallbackValue;
    }

    return parsed;
  };

  const addSection = (preset = 'simple') => {
    const nextSection = createSectionFromPreset(preset);

    if (preset === 'table') {
      const columnCount = askNumber(
        isRTL ? 'كم عدد الأعمدة في الجدول؟' : 'How many columns should the table have?',
        4
      );
      if (columnCount === null) {
        return;
      }

      const rowCount = askNumber(
        isRTL ? 'كم عدد الصفوف الفارغة للطباعة؟' : 'How many printable rows do you want?',
        6
      );
      if (rowCount === null) {
        return;
      }

      nextSection.advancedLayout.table.columns = Array.from({ length: columnCount }).map((_, index) => createColumn({
        label: {
          en: `Column ${index + 1}`,
          ar: `Column ${index + 1}`
        },
        width: index === 0 ? '2fr' : '1fr'
      }));
      nextSection.advancedLayout.table.numberOfRows = rowCount;
    }

    if (preset === 'columns') {
      const columnCount = askNumber(
        isRTL ? 'كم عدد الأعمدة في هذا القسم؟' : 'How many columns should this section have?',
        2
      );
      if (columnCount === null) {
        return;
      }

      nextSection.advancedLayout.columns.columnCount = columnCount;
      nextSection.fields = Array.from({ length: columnCount }).map((_, index) => createField({
        label: {
          en: `Column ${index + 1}`,
          ar: `Column ${index + 1}`
        },
        width: 'full'
      }));
    }

    const normalizedSection = normalizeSection(nextSection, formData.sections.length);
    setFormData((prev) => {
      const sections = reindexSections([...prev.sections, normalizedSection]);
      return {
        ...prev,
        sections,
        layout: {
          ...prev.layout,
          sectionOrder: sections.map((section) => section.id)
        }
      };
    });
    setSelectedSectionId(normalizedSection.id);
  };

  const updateSection = (sectionId, nextSection) => {
    setFormData((prev) => {
      const sections = reindexSections(prev.sections.map((section) => (
        section.id === sectionId ? normalizeSection(nextSection, section.order || 0) : section
      )));
      return {
        ...prev,
        sections,
        layout: {
          ...prev.layout,
          sectionOrder: sections.map((section) => section.id)
        }
      };
    });
  };

  const duplicateSection = (sectionId) => {
    setFormData((prev) => {
      const index = prev.sections.findIndex((section) => section.id === sectionId);
      if (index === -1) {
        return prev;
      }

      const duplicated = cloneData(prev.sections[index]);
      duplicated.id = generateId('section');
      duplicated.label = {
        en: `${duplicated.label.en || duplicated.label.ar || 'Section'} Copy`,
        ar: `${duplicated.label.ar || duplicated.label.en || 'قسم'} نسخة`
      };
      duplicated.fields = (duplicated.fields || []).map((field) => ({ ...field, key: generateId('field') }));
      duplicated.advancedLayout = {
        ...duplicated.advancedLayout,
        table: {
          ...duplicated.advancedLayout.table,
          columns: (duplicated.advancedLayout.table?.columns || []).map((column) => ({ ...column, id: generateId('col') }))
        }
      };

      const sections = reindexSections([
        ...prev.sections.slice(0, index + 1),
        duplicated,
        ...prev.sections.slice(index + 1)
      ]);
      setSelectedSectionId(duplicated.id);
      return {
        ...prev,
        sections,
        layout: {
          ...prev.layout,
          sectionOrder: sections.map((section) => section.id)
        }
      };
    });
  };

  const deleteSection = (sectionId) => {
    setFormData((prev) => {
      const sections = reindexSections(prev.sections.filter((section) => section.id !== sectionId));
      return {
        ...prev,
        sections,
        layout: {
          ...prev.layout,
          sectionOrder: sections.map((section) => section.id)
        }
      };
    });
  };

  const moveSection = (sectionId, direction) => {
    setFormData((prev) => {
      const currentIndex = prev.sections.findIndex((section) => section.id === sectionId);
      if (currentIndex === -1) {
        return prev;
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.sections.length) {
        return prev;
      }

      const sections = reindexSections(moveItem(prev.sections, currentIndex, targetIndex));
      return {
        ...prev,
        sections,
        layout: {
          ...prev.layout,
          sectionOrder: sections.map((section) => section.id)
        }
      };
    });
  };

  const addFieldToSection = (sectionId) => {
    const section = formData.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    updateSection(sectionId, {
      ...section,
      fields: reindexFields([...(section.fields || []), createField({ label: { en: 'New Field', ar: 'حقل جديد' } })])
    });
  };

  const updateField = (sectionId, fieldKey, nextField) => {
    const section = formData.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    updateSection(sectionId, {
      ...section,
      fields: reindexFields(section.fields.map((field) => (
        field.key === fieldKey ? normalizeField(nextField, field.order || 0) : field
      )))
    });
  };

  const duplicateField = (sectionId, fieldKey) => {
    const section = formData.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const index = section.fields.findIndex((field) => field.key === fieldKey);
    if (index === -1) {
      return;
    }

    const duplicated = cloneData(section.fields[index]);
    duplicated.key = generateId('field');
    duplicated.label = {
      en: `${duplicated.label.en || duplicated.label.ar || 'Field'} Copy`,
      ar: `${duplicated.label.ar || duplicated.label.en || 'حقل'} نسخة`
    };

    updateSection(sectionId, {
      ...section,
      fields: reindexFields([
        ...section.fields.slice(0, index + 1),
        duplicated,
        ...section.fields.slice(index + 1)
      ])
    });
  };

  const deleteField = (sectionId, fieldKey) => {
    const section = formData.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    updateSection(sectionId, {
      ...section,
      fields: reindexFields(section.fields.filter((field) => field.key !== fieldKey))
    });
  };

  const moveField = (sectionId, fieldIndex, direction) => {
    const section = formData.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    if (targetIndex < 0 || targetIndex >= section.fields.length) {
      return;
    }

    updateSection(sectionId, {
      ...section,
      fields: reindexFields(moveItem(section.fields, fieldIndex, targetIndex))
    });
  };

  const addColumnToSection = (sectionId) => {
    const section = formData.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    updateSection(sectionId, {
      ...section,
      advancedLayout: {
        ...section.advancedLayout,
        table: {
          ...section.advancedLayout.table,
          enabled: true,
          columns: [...(section.advancedLayout.table?.columns || []), createColumn({ label: { en: 'New Column', ar: 'عمود جديد' } })]
        }
      }
    });
  };

  const updateColumn = (sectionId, columnId, nextColumn) => {
    const section = formData.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    updateSection(sectionId, {
      ...section,
      advancedLayout: {
        ...section.advancedLayout,
        table: {
          ...section.advancedLayout.table,
          enabled: true,
          columns: (section.advancedLayout.table?.columns || []).map((column) => (
            column.id === columnId ? normalizeColumn(nextColumn) : column
          ))
        }
      }
    });
  };

  const deleteColumn = (sectionId, columnId) => {
    const section = formData.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    updateSection(sectionId, {
      ...section,
      advancedLayout: {
        ...section.advancedLayout,
        table: {
          ...section.advancedLayout.table,
          enabled: true,
          columns: (section.advancedLayout.table?.columns || []).filter((column) => column.id !== columnId)
        }
      }
    });
  };

  const moveColumn = (sectionId, columnIndex, direction) => {
    const section = formData.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const columns = section.advancedLayout?.table?.columns || [];
    const targetIndex = direction === 'up' ? columnIndex - 1 : columnIndex + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) {
      return;
    }

    updateSection(sectionId, {
      ...section,
      advancedLayout: {
        ...section.advancedLayout,
        table: {
          ...section.advancedLayout.table,
          enabled: true,
          columns: moveItem(columns, columnIndex, targetIndex)
        }
      }
    });
  };

  const applyTheme = (themeKey) => {
    const theme = THEMES[themeKey];
    if (!theme) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      pdfStyle: normalizePdfStyle({
        ...prev.pdfStyle,
        colors: { ...prev.pdfStyle.colors, ...theme.colors },
        branding: {
          ...prev.pdfStyle.branding,
          primaryColor: theme.colors.primary,
          secondaryColor: theme.colors.secondary
        },
        header: {
          ...prev.pdfStyle.header,
          ...theme.header,
          border: {
            ...prev.pdfStyle.header.border,
            ...(theme.header.border || {})
          }
        },
        footer: {
          ...prev.pdfStyle.footer,
          ...theme.footer
        }
      })
    }));
  };

  const handleSave = async () => {
    if (!validate()) {
      showWarning(isRTL ? 'أكمل البيانات المطلوبة أولاً.' : 'Complete the required information first.');
      return;
    }

    const payload = finalizeTemplateForSave(formData);
    setSaving(true);
    try {
      if (isEditMode) {
        await api.put(`/form-templates/${id}`, payload);
      } else {
        await api.post('/form-templates', payload);
      }
      showSuccess(isRTL ? 'تم حفظ القالب بنجاح.' : 'Template saved successfully.');
      navigate('/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      showError(error.response?.data?.message || (isRTL ? 'تعذر حفظ القالب.' : 'Unable to save the template.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-gray-600">{isRTL ? 'جاري تحميل القالب...' : 'Loading template...'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1f2937] via-[#422006] to-[#8f3b1f] p-6 text-white shadow-2xl">
          <button
            type="button"
            onClick={() => navigate('/templates')}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/15"
          >
            <FaArrowLeft />
            <span>{isRTL ? 'الرجوع للقوالب' : 'Back to templates'}</span>
          </button>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                {isRTL ? 'منشئ PDF سهل' : 'Easy PDF Builder'}
              </p>
              <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                {isEditMode
                  ? (isRTL ? 'حرر القالب بسهولة وعدّل شكله فورًا' : 'Edit the template with a much easier builder')
                  : (isRTL ? 'أنشئ أي شكل PDF من شاشة واحدة واضحة' : 'Create almost any PDF layout from one clear screen')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
                {isRTL
                  ? 'استخدم قوالب البداية، أضف الأقسام الجاهزة، وعدّل الحقول أو الأعمدة مباشرة مع معاينة حية.'
                  : 'Use starter templates, add ready-made sections, and edit fields or columns directly with a live preview.'}
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} icon={FaSave}>
              {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ القالب' : 'Save Template')}
            </Button>
          </div>
        </div>

        {!isEditMode && formData.sections.length === 0 && (
          <Card className="overflow-hidden bg-gradient-to-br from-[#fff7e7] via-white to-[#f5f8ff]">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
                {isRTL ? 'ابدأ أسرع' : 'Start Faster'}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {isRTL ? 'اختر نقطة بداية بدل بناء كل شيء يدويًا' : 'Pick a starter instead of building everything by hand'}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {STARTER_TEMPLATES.map((starter) => (
                <button
                  key={starter.id}
                  type="button"
                  onClick={() => applyStarterTemplate(starter.id)}
                  className="rounded-[28px] border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-900 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white">
                    <FaMagic />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">{getLocalizedText(starter.name, isRTL)}</h3>
                  <p className="mt-2 text-sm text-gray-600">{getLocalizedText(starter.description, isRTL)}</p>
                </button>
              ))}
            </div>
          </Card>
        )}

        {Object.keys(errors).length > 0 && (
          <Card className="border border-red-200 bg-red-50">
            <h3 className="text-lg font-bold text-red-900">
              {isRTL ? 'ما زال هناك بعض البيانات الناقصة' : 'A few details still need attention'}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.values(errors).map((message, index) => (
                <span key={`${message}_${index}`} className="rounded-full bg-white px-3 py-1 text-sm text-red-700 shadow-sm">
                  {message}
                </span>
              ))}
            </div>
          </Card>
        )}

        <div className="grid gap-6 2xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="border border-gray-100 bg-white/90">
              <TextInput label={isRTL ? 'العنوان بالإنجليزية' : 'English title'} value={formData.title.en} onChange={(value) => setFormData((prev) => ({ ...prev, title: mirrorEnglishToArabic(prev.title, value) }))} />
              <div className="mt-4" />
              <TextInput label={isRTL ? 'العنوان بالعربية' : 'Arabic title'} value={formData.title.ar} dir="rtl" onChange={(value) => setFormData((prev) => ({ ...prev, title: { ...prev.title, ar: value } }))} />
              <div className="mt-4" />
              <TextAreaInput label={isRTL ? 'الوصف بالإنجليزية' : 'English description'} value={formData.description.en} rows={3} onChange={(value) => setFormData((prev) => ({ ...prev, description: mirrorEnglishToArabic(prev.description, value) }))} />
              <div className="mt-4" />
              <TextAreaInput label={isRTL ? 'الوصف بالعربية' : 'Arabic description'} value={formData.description.ar} rows={3} dir="rtl" onChange={(value) => setFormData((prev) => ({ ...prev, description: { ...prev.description, ar: value } }))} />
              <div className="mt-4" />
              <SelectField label={isRTL ? 'القسم' : 'Department'} value={formData.templateDepartment || 'all'} onChange={(value) => setFormData((prev) => ({ ...prev, templateDepartment: value }))} options={departmentOptions.map((option) => ({ value: option.value, label: option.label, labelAr: option.label }))} isRTL={isRTL} />
              <div className="mt-4 flex flex-wrap gap-4">
                <Checkbox label={isRTL ? 'يتطلب اعتمادًا' : 'Requires approval'} checked={formData.requiresApproval !== false} onChange={(checked) => setFormData((prev) => ({ ...prev, requiresApproval: checked }))} />
                <Checkbox label={isRTL ? 'إظهار بيانات النموذج' : 'Show metadata'} checked={formData.pdfStyle.metadata?.enabled !== false} onChange={(checked) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, metadata: { ...prev.pdfStyle.metadata, enabled: checked } }) }))} />
              </div>
            </Card>

            <Card className="border border-gray-100 bg-white/90">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label={isRTL ? 'حجم الصفحة' : 'Page size'}
                  value={formData.layout.pageSize}
                  onChange={(value) => setFormData((prev) => ({ ...prev, layout: { ...prev.layout, pageSize: value } }))}
                  options={[
                    { value: 'A4', label: 'A4', labelAr: 'A4' },
                    { value: 'Letter', label: 'Letter', labelAr: 'Letter' },
                    { value: 'Legal', label: 'Legal', labelAr: 'Legal' }
                  ]}
                  isRTL={isRTL}
                />
                <SelectField
                  label={isRTL ? 'الاتجاه' : 'Orientation'}
                  value={formData.layout.orientation}
                  onChange={(value) => setFormData((prev) => ({ ...prev, layout: { ...prev.layout, orientation: value } }))}
                  options={[
                    { value: 'portrait', label: 'Portrait', labelAr: 'طولي' },
                    { value: 'landscape', label: 'Landscape', labelAr: 'عرضي' }
                  ]}
                  isRTL={isRTL}
                />
                <NumberInput label={isRTL ? 'الهامش العلوي' : 'Top margin'} value={formData.layout.margins.top} min={0} onChange={(value) => setFormData((prev) => ({ ...prev, layout: { ...prev.layout, margins: { ...prev.layout.margins, top: value } } }))} />
                <NumberInput label={isRTL ? 'الهامش السفلي' : 'Bottom margin'} value={formData.layout.margins.bottom} min={0} onChange={(value) => setFormData((prev) => ({ ...prev, layout: { ...prev.layout, margins: { ...prev.layout.margins, bottom: value } } }))} />
              </div>
            </Card>

            <Card className="border border-gray-100 bg-white/90">
              <div className="grid gap-3 md:grid-cols-2">
                {SECTION_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => addSection(preset.id)}
                      className="flex items-center gap-3 rounded-[22px] border border-gray-200 bg-white p-4 text-left transition hover:border-gray-900 hover:shadow-md"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
                        <Icon />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{getLocalizedText(preset.label, isRTL)}</div>
                        <div className="text-sm text-gray-500">
                          {preset.id === 'table'
                            ? (isRTL ? 'أفضل خيار للجداول' : 'Best for printable tables')
                            : preset.id === 'columns'
                              ? (isRTL ? 'أعمدة جاهزة' : 'Quick column layout')
                              : (isRTL ? 'أضف هذا القسم' : 'Add this section')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3">
                {formData.sections.length === 0 ? (
                  <EmptyEditorState title={isRTL ? 'لا توجد أقسام بعد' : 'No sections yet'} description={isRTL ? 'أضف قسمًا من الأعلى ثم عدّل تفاصيله.' : 'Add a section above, then edit its details.'} />
                ) : (
                  formData.sections.map((section, index) => {
                    const isSelected = selectedSectionId === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setSelectedSectionId(section.id)}
                        className={`w-full rounded-[24px] border p-4 text-left transition ${isSelected ? 'border-gray-900 bg-gray-900 text-white shadow-lg' : 'border-gray-200 bg-white hover:border-gray-400'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">
                              {index + 1}. {section.advancedLayout?.layoutType || 'simple'}
                            </div>
                            <div className="mt-2 text-base font-bold">
                              {getLocalizedText(section.label, isRTL, isRTL ? 'قسم جديد' : 'New Section')}
                            </div>
                          </div>
                          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isSelected ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-700'}`}>
                            {section.visible !== false ? <FaEye /> : <FaEyeSlash />}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </Card>

            <Card className="border border-gray-100 bg-white/90">
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(THEMES).map(([themeKey, theme]) => (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => applyTheme(themeKey)}
                    className="rounded-[22px] border border-gray-200 bg-white p-4 text-left transition hover:border-gray-900 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      {[theme.colors.primary, theme.colors.secondary, theme.footer.backgroundColor].map((color) => (
                        <span key={`${themeKey}_${color}`} className="h-6 w-6 rounded-full border border-white shadow" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <div className="mt-3 font-semibold text-gray-900">{isRTL ? theme.labelAr : theme.label}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ColorInput label={isRTL ? 'اللون الرئيسي' : 'Primary color'} value={formData.pdfStyle.branding?.primaryColor || '#c99027'} onChange={(value) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, branding: { ...prev.pdfStyle.branding, primaryColor: value }, colors: { ...prev.pdfStyle.colors, primary: value } }) }))} />
                <ColorInput label={isRTL ? 'لون النص' : 'Body text color'} value={formData.pdfStyle.colors?.text || '#111827'} onChange={(value) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, colors: { ...prev.pdfStyle.colors, text: value } }) }))} />
                <TextInput label={isRTL ? 'اسم الشركة بالإنجليزية' : 'Company name in English'} value={formData.pdfStyle.branding?.companyName?.en || ''} onChange={(value) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, branding: { ...prev.pdfStyle.branding, companyName: mirrorEnglishToArabic(prev.pdfStyle.branding.companyName, value) } }) }))} />
                <TextInput label={isRTL ? 'اسم الشركة بالعربية' : 'Company name in Arabic'} value={formData.pdfStyle.branding?.companyName?.ar || ''} dir="rtl" onChange={(value) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, branding: { ...prev.pdfStyle.branding, companyName: { ...prev.pdfStyle.branding.companyName, ar: value } } }) }))} />
                <TextInput label={isRTL ? 'رابط الشعار' : 'Logo URL'} value={formData.pdfStyle.branding?.logoUrl || ''} onChange={(value) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, branding: { ...prev.pdfStyle.branding, logoUrl: value } }) }))} />
                <TextInput label={isRTL ? 'رقم الهاتف' : 'Phone number'} value={formData.pdfStyle.branding?.companyPhone || ''} onChange={(value) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, branding: { ...prev.pdfStyle.branding, companyPhone: value }, footer: { ...prev.pdfStyle.footer, phoneNumber: value } }) }))} />
                <TextInput label={isRTL ? 'عنوان الشركة بالإنجليزية' : 'Company address in English'} value={formData.pdfStyle.branding?.companyAddress?.en || ''} onChange={(value) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, branding: { ...prev.pdfStyle.branding, companyAddress: mirrorEnglishToArabic(prev.pdfStyle.branding.companyAddress, value) } }) }))} />
                <TextInput label={isRTL ? 'عنوان الشركة بالعربية' : 'Company address in Arabic'} value={formData.pdfStyle.branding?.companyAddress?.ar || ''} dir="rtl" onChange={(value) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, branding: { ...prev.pdfStyle.branding, companyAddress: { ...prev.pdfStyle.branding.companyAddress, ar: value } } }) }))} />
                <TextAreaInput label={isRTL ? 'نص التذييل بالإنجليزية' : 'Footer text in English'} value={formData.pdfStyle.footer?.content?.en || ''} rows={2} onChange={(value) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, footer: { ...prev.pdfStyle.footer, content: mirrorEnglishToArabic(prev.pdfStyle.footer.content, value) } }) }))} />
                <TextAreaInput label={isRTL ? 'نص التذييل بالعربية' : 'Footer text in Arabic'} value={formData.pdfStyle.footer?.content?.ar || ''} rows={2} dir="rtl" onChange={(value) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, footer: { ...prev.pdfStyle.footer, content: { ...prev.pdfStyle.footer.content, ar: value } } }) }))} />
                <Checkbox label={isRTL ? 'تفعيل الرأس' : 'Enable header'} checked={formData.pdfStyle.header.enabled} onChange={(checked) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, header: { ...prev.pdfStyle.header, enabled: checked } }) }))} />
                <Checkbox label={isRTL ? 'تفعيل التذييل' : 'Enable footer'} checked={formData.pdfStyle.footer.enabled} onChange={(checked) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, footer: { ...prev.pdfStyle.footer, enabled: checked } }) }))} />
                <Checkbox label={isRTL ? 'إظهار الشعار' : 'Show logo'} checked={formData.pdfStyle.header.showLogo !== false} onChange={(checked) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, header: { ...prev.pdfStyle.header, showLogo: checked } }) }))} />
                <Checkbox label={isRTL ? 'إظهار عنوان النموذج' : 'Show template title'} checked={formData.pdfStyle.header.showTitle !== false} onChange={(checked) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, header: { ...prev.pdfStyle.header, showTitle: checked } }) }))} />
                <Checkbox label={isRTL ? 'إظهار QR في التذييل' : 'Show QR in footer'} checked={formData.pdfStyle.footer.showQRCode || false} onChange={(checked) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, footer: { ...prev.pdfStyle.footer, showQRCode: checked } }) }))} />
                <Checkbox label={isRTL ? 'إظهار الهاتف في التذييل' : 'Show phone in footer'} checked={formData.pdfStyle.footer.showPhoneNumber || false} onChange={(checked) => setFormData((prev) => ({ ...prev, pdfStyle: normalizePdfStyle({ ...prev.pdfStyle, footer: { ...prev.pdfStyle.footer, showPhoneNumber: checked } }) }))} />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {selectedSection ? (
              <SectionEditor
                section={selectedSection}
                isRTL={isRTL}
                onUpdateSection={(nextSection) => updateSection(selectedSection.id, nextSection)}
                onDuplicateSection={() => duplicateSection(selectedSection.id)}
                onDeleteSection={() => deleteSection(selectedSection.id)}
                onMoveSectionUp={() => moveSection(selectedSection.id, 'up')}
                onMoveSectionDown={() => moveSection(selectedSection.id, 'down')}
                onAddField={() => addFieldToSection(selectedSection.id)}
                onUpdateField={(fieldKey, nextField) => updateField(selectedSection.id, fieldKey, nextField)}
                onDuplicateField={(fieldKey) => duplicateField(selectedSection.id, fieldKey)}
                onDeleteField={(fieldKey) => deleteField(selectedSection.id, fieldKey)}
                onMoveField={(fieldIndex, direction) => moveField(selectedSection.id, fieldIndex, direction)}
                onAddColumn={() => addColumnToSection(selectedSection.id)}
                onUpdateColumn={(columnId, nextColumn) => updateColumn(selectedSection.id, columnId, nextColumn)}
                onDeleteColumn={(columnId) => deleteColumn(selectedSection.id, columnId)}
                onMoveColumn={(columnIndex, direction) => moveColumn(selectedSection.id, columnIndex, direction)}
              />
            ) : (
              <Card className="border border-dashed border-gray-300 bg-white/80">
                <EmptyEditorState title={isRTL ? 'اختر قسمًا أو أضف واحدًا جديدًا' : 'Choose a section or add a new one'} description={isRTL ? 'بعد إضافة قسم، ستظهر أدوات التعديل هنا.' : 'Once a section exists, its editor will appear here.'} />
              </Card>
            )}

            <TemplateBuilderPreview formData={formData} isRTL={isRTL} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TemplateBuilder;
