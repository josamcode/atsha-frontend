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

const DEFAULT_WORKSPACE_TAB = 'details';
const SECTION_LIBRARY_TAB = 'sections';

const getSectionTabId = (sectionId) => `section:${sectionId}`;
const getSectionIdFromTab = (tabId) => (tabId?.startsWith('section:') ? tabId.slice('section:'.length) : null);

const WorkspaceTabButton = ({ active, label, subtitle, onClick, hasError = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`min-w-[210px] rounded-[24px] border p-4 text-left transition ${
      active
        ? 'border-primary bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg'
        : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-md'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="text-sm font-bold">{label}</div>
      {hasError && (
        <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-white' : 'bg-red-500'}`} />
      )}
    </div>
    <div className={`mt-2 text-xs ${active ? 'text-white/80' : 'text-gray-500'}`}>{subtitle}</div>
  </button>
);

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

  const [formData, setFormData] = useState(() => normalizeTemplate(getDefaultTemplate(organization?.branding)));
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [activeTab, setActiveTab] = useState(DEFAULT_WORKSPACE_TAB);
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
        const firstSectionId = normalized.sections[0]?.id || null;
        setFormData(normalized);
        setSelectedSectionId(firstSectionId);
        setActiveTab(firstSectionId ? getSectionTabId(firstSectionId) : DEFAULT_WORKSPACE_TAB);
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

  useEffect(() => {
    const tabSectionId = getSectionIdFromTab(activeTab);
    if (!tabSectionId) {
      return;
    }

    if (tabSectionId !== selectedSectionId) {
      setSelectedSectionId(tabSectionId);
    }
  }, [activeTab, selectedSectionId]);

  useEffect(() => {
    const tabSectionId = getSectionIdFromTab(activeTab);
    if (!tabSectionId) {
      return;
    }

    if (!formData.sections.some((section) => section.id === tabSectionId)) {
      setActiveTab(formData.sections[0]?.id ? getSectionTabId(formData.sections[0].id) : SECTION_LIBRARY_TAB);
    }
  }, [activeTab, formData.sections]);

  const selectedSection = useMemo(
    () => formData.sections.find((section) => section.id === selectedSectionId) || null,
    [formData.sections, selectedSectionId]
  );
  const selectedSectionIndex = useMemo(
    () => formData.sections.findIndex((section) => section.id === selectedSectionId),
    [formData.sections, selectedSectionId]
  );
  const visibleSectionsCount = useMemo(
    () => formData.sections.filter((section) => section.visible !== false).length,
    [formData.sections]
  );
  const systemTheme = useMemo(() => {
    const primaryColor = organization?.branding?.primaryColor || '#d4b900';
    const secondaryColor = organization?.branding?.secondaryColor || '#9e8b00';

    return {
      label: isRTL ? 'ألوان النظام' : 'System Colors',
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        border: '#d1d5db',
        background: '#ffffff',
        text: '#111827'
      },
      header: {
        backgroundColor: '#fffbeb',
        textColor: '#1f2937',
        titleColor: primaryColor,
        border: {
          show: true,
          width: 3,
          style: 'solid',
          color: primaryColor,
          position: 'bottom'
        }
      },
      footer: {
        backgroundColor: secondaryColor,
        textColor: '#ffffff'
      }
    };
  }, [isRTL, organization?.branding?.primaryColor, organization?.branding?.secondaryColor]);

  const getSectionErrorMessages = (sectionId) => ([
    errors[`section_${sectionId}`],
    errors[`section_fields_${sectionId}`],
    errors[`section_table_${sectionId}`]
  ].filter(Boolean));

  const workspaceTabs = [
    {
      id: DEFAULT_WORKSPACE_TAB,
      label: isRTL ? 'بيانات القالب' : 'Template Details',
      subtitle: isRTL ? 'العنوان والوصف والقسم' : 'Title, description, and department',
      hasError: Boolean(errors.title)
    },
    {
      id: 'layout',
      label: isRTL ? 'إعدادات PDF' : 'PDF Layout',
      subtitle: isRTL ? 'الحجم والاتجاه والهوامش' : 'Page size, orientation, and margins'
    },
    {
      id: SECTION_LIBRARY_TAB,
      label: isRTL ? 'مكتبة الأقسام' : 'Section Library',
      subtitle: isRTL ? 'أضف الأقسام وافتح تبويبها مباشرة' : 'Add sections and open their tabs instantly',
      hasError: Boolean(errors.sections)
    },
    {
      id: 'branding',
      label: isRTL ? 'الهوية والألوان' : 'Branding and Colors',
      subtitle: isRTL ? 'الرأس والتذييل والألوان' : 'Header, footer, and colors'
    },
    {
      id: 'preview',
      label: isRTL ? 'المعاينة' : 'Preview',
      subtitle: isRTL ? 'اعرض القالب في تبويب مستقل' : 'Open the live preview in its own tab'
    },
    ...formData.sections.map((section, index) => ({
      id: getSectionTabId(section.id),
      label: getLocalizedText(section.label, isRTL, isRTL ? `قسم ${index + 1}` : `Section ${index + 1}`),
      subtitle: isRTL
        ? `${section.advancedLayout?.layoutType || 'simple'} | ${section.visible !== false ? 'ظاهر' : 'مخفي'}`
        : `${section.advancedLayout?.layoutType || 'simple'} | ${section.visible !== false ? 'Visible' : 'Hidden'}`,
      hasError: getSectionErrorMessages(section.id).length > 0
    }))
  ];

  const openWorkspaceTab = (tabId) => {
    setActiveTab(tabId);
    const nextSectionId = getSectionIdFromTab(tabId);
    if (nextSectionId) {
      setSelectedSectionId(nextSectionId);
    }
  };

  const focusSectionTab = (sectionId) => {
    if (!sectionId) {
      return;
    }

    setSelectedSectionId(sectionId);
    setActiveTab(getSectionTabId(sectionId));
  };

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
          nextErrors[`section_table_${section.id}`] = isRTL
            ? 'هذا القسم الجدولي يحتاج عمودًا واحدًا على الأقل.'
            : 'A table section needs at least one column.';
        }
      } else if (!(section.fields || []).length) {
        nextErrors[`section_fields_${section.id}`] = isRTL
          ? 'أضف حقلاً واحدًا على الأقل.'
          : 'Add at least one field.';
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

    const template = normalizeTemplate(starter.template(organization?.branding));
    const firstSectionId = template.sections[0]?.id || null;
    setFormData(template);
    setSelectedSectionId(firstSectionId);
    setActiveTab(firstSectionId ? getSectionTabId(firstSectionId) : DEFAULT_WORKSPACE_TAB);
    setErrors({});
    showSuccess(isRTL ? 'تم تحميل القالب المبدئي.' : 'Starter template loaded.');
  };

  const addSection = (preset = 'simple') => {
    const normalizedSection = normalizeSection(createSectionFromPreset(preset), formData.sections.length);

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
    setActiveTab(getSectionTabId(normalizedSection.id));
    setErrors({});
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
    const index = formData.sections.findIndex((section) => section.id === sectionId);
    if (index === -1) {
      return;
    }

    const duplicated = cloneData(formData.sections[index]);
    duplicated.id = generateId('section');
    duplicated.label = {
      en: `${duplicated.label.en || duplicated.label.ar || 'Section'} Copy`,
      ar: `${duplicated.label.ar || duplicated.label.en || 'قسم'} نسخة`
    };
    duplicated.fields = (duplicated.fields || []).map((field) => ({ ...field, key: generateId('field') }));
    duplicated.advancedLayout = {
      ...(duplicated.advancedLayout || {}),
      table: {
        ...(duplicated.advancedLayout?.table || {}),
        columns: (duplicated.advancedLayout?.table?.columns || []).map((column) => ({ ...column, id: generateId('col') }))
      }
    };

    const sections = reindexSections([
      ...formData.sections.slice(0, index + 1),
      duplicated,
      ...formData.sections.slice(index + 1)
    ]);

    setFormData((prev) => ({
      ...prev,
      sections,
      layout: {
        ...prev.layout,
        sectionOrder: sections.map((section) => section.id)
      }
    }));
    setErrors({});
    focusSectionTab(duplicated.id);
  };

  const deleteSection = (sectionId) => {
    const currentIndex = formData.sections.findIndex((section) => section.id === sectionId);
    if (currentIndex === -1) {
      return;
    }

    const sections = reindexSections(formData.sections.filter((section) => section.id !== sectionId));
    const fallbackSection = sections[currentIndex] || sections[currentIndex - 1] || null;

    setFormData((prev) => ({
      ...prev,
      sections,
      layout: {
        ...prev.layout,
        sectionOrder: sections.map((section) => section.id)
      }
    }));

    if (fallbackSection) {
      focusSectionTab(fallbackSection.id);
    } else {
      setSelectedSectionId(null);
      setActiveTab(SECTION_LIBRARY_TAB);
    }

    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[`section_${sectionId}`];
      delete nextErrors[`section_fields_${sectionId}`];
      delete nextErrors[`section_table_${sectionId}`];
      return nextErrors;
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

  const applyThemeConfig = (theme) => {
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

  const applyTheme = (themeKey) => {
    applyThemeConfig(THEMES[themeKey]);
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

  const renderDetailsPanel = () => (
    <Card title={isRTL ? 'بيانات القالب' : 'Template Details'} className="border border-primary/10 bg-white">
      <TextInput
        label={isRTL ? 'العنوان بالإنجليزية' : 'English title'}
        value={formData.title.en}
        onChange={(value) => setFormData((prev) => ({ ...prev, title: mirrorEnglishToArabic(prev.title, value) }))}
      />
      <div className="mt-4" />
      <TextInput
        label={isRTL ? 'العنوان بالعربية' : 'Arabic title'}
        value={formData.title.ar}
        dir="rtl"
        onChange={(value) => setFormData((prev) => ({ ...prev, title: { ...prev.title, ar: value } }))}
      />
      <div className="mt-4" />
      <TextAreaInput
        label={isRTL ? 'الوصف بالإنجليزية' : 'English description'}
        value={formData.description.en}
        rows={3}
        onChange={(value) => setFormData((prev) => ({ ...prev, description: mirrorEnglishToArabic(prev.description, value) }))}
      />
      <div className="mt-4" />
      <TextAreaInput
        label={isRTL ? 'الوصف بالعربية' : 'Arabic description'}
        value={formData.description.ar}
        rows={3}
        dir="rtl"
        onChange={(value) => setFormData((prev) => ({ ...prev, description: { ...prev.description, ar: value } }))}
      />
      <div className="mt-4" />
      <SelectField
        label={isRTL ? 'القسم' : 'Department'}
        value={formData.templateDepartment || 'all'}
        onChange={(value) => setFormData((prev) => ({ ...prev, templateDepartment: value }))}
        options={departmentOptions.map((option) => ({ value: option.value, label: option.label, labelAr: option.label }))}
        isRTL={isRTL}
      />
      <div className="mt-4 flex flex-wrap gap-4">
        <Checkbox
          label={isRTL ? 'يتطلب اعتمادًا' : 'Requires approval'}
          checked={formData.requiresApproval !== false}
          onChange={(checked) => setFormData((prev) => ({ ...prev, requiresApproval: checked }))}
        />
        <Checkbox
          label={isRTL ? 'إظهار بيانات النموذج' : 'Show metadata'}
          checked={formData.pdfStyle.metadata?.enabled !== false}
          onChange={(checked) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              metadata: { ...prev.pdfStyle.metadata, enabled: checked }
            })
          }))}
        />
      </div>
    </Card>
  );

  const renderLayoutPanel = () => (
    <Card title={isRTL ? 'إعدادات PDF' : 'PDF Layout'} className="border border-primary/10 bg-white">
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
        <NumberInput
          label={isRTL ? 'الهامش العلوي' : 'Top margin'}
          value={formData.layout.margins.top}
          min={0}
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            layout: { ...prev.layout, margins: { ...prev.layout.margins, top: value } }
          }))}
        />
        <NumberInput
          label={isRTL ? 'الهامش السفلي' : 'Bottom margin'}
          value={formData.layout.margins.bottom}
          min={0}
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            layout: { ...prev.layout, margins: { ...prev.layout.margins, bottom: value } }
          }))}
        />
      </div>
    </Card>
  );

  const renderSectionLibraryPanel = () => (
    <Card title={isRTL ? 'مكتبة الأقسام' : 'Section Library'} className="border border-primary/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {isRTL
            ? 'أضف القسم المناسب، ثم افتح تبويبه الخاص للتعديل المباشر بدون أي نوافذ تأكيد.'
            : 'Add the section you need, then jump into its own tab for direct editing without confirm popups.'}
        </p>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {visibleSectionsCount} / {formData.sections.length} {isRTL ? 'ظاهر' : 'visible'}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SECTION_PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => addSection(preset.id)}
              className="flex items-center gap-3 rounded-[22px] border border-gray-200 bg-white p-4 text-left transition hover:border-primary hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{getLocalizedText(preset.label, isRTL)}</div>
                <div className="text-sm text-gray-500">
                  {preset.id === 'table'
                    ? (isRTL ? 'أفضل خيار للجداول' : 'Best for printable tables')
                    : preset.id === 'columns'
                      ? (isRTL ? 'تخطيط أعمدة جاهز' : 'Ready-made multi-column layout')
                      : (isRTL ? 'يفتح في تبويب مستقل بعد الإضافة' : 'Opens in its own tab after adding')}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
        <div className="text-sm font-semibold text-gray-900">
          {isRTL ? 'التبويبات الحالية' : 'Current tabs'}
        </div>
        {formData.sections.length === 0 ? (
          <EmptyEditorState
            title={isRTL ? 'لا توجد أقسام بعد' : 'No sections yet'}
            description={isRTL ? 'أضف قسمًا من الأعلى وسيظهر كتبويب مستقل هنا.' : 'Add a section above and it will appear as its own tab here.'}
          />
        ) : (
          formData.sections.map((section, index) => {
            const isSelected = selectedSectionId === section.id;
            const sectionErrors = getSectionErrorMessages(section.id);
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => focusSectionTab(section.id)}
                className={`w-full rounded-[24px] border p-4 text-left transition ${
                  isSelected ? 'border-primary bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg' : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-md'
                }`}
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
                  <div className="flex items-center gap-2">
                    {sectionErrors.length > 0 && (
                      <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`} />
                    )}
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isSelected ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'}`}>
                      {section.visible !== false ? <FaEye /> : <FaEyeSlash />}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );

  const renderBrandingPanel = () => (
    <Card title={isRTL ? 'الهوية والألوان' : 'Branding and Colors'} className="border border-primary/10 bg-white">
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => applyThemeConfig(systemTheme)}
          className="rounded-[22px] border border-primary/20 bg-primary/5 p-4 text-left transition hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            {[systemTheme.colors.primary, systemTheme.colors.secondary, systemTheme.footer.backgroundColor].map((color) => (
              <span key={`system_${color}`} className="h-6 w-6 rounded-full border border-white shadow" style={{ backgroundColor: color }} />
            ))}
          </div>
          <div className="mt-3 font-semibold text-gray-900">{systemTheme.label}</div>
        </button>
        {Object.entries(THEMES).map(([themeKey, theme]) => (
          <button
            key={themeKey}
            type="button"
            onClick={() => applyTheme(themeKey)}
            className="rounded-[22px] border border-gray-200 bg-white p-4 text-left transition hover:border-primary hover:shadow-md"
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
        <ColorInput
          label={isRTL ? 'اللون الرئيسي' : 'Primary color'}
          value={formData.pdfStyle.branding?.primaryColor || organization?.branding?.primaryColor || '#d4b900'}
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              branding: { ...prev.pdfStyle.branding, primaryColor: value },
              colors: { ...prev.pdfStyle.colors, primary: value }
            })
          }))}
        />
        <ColorInput
          label={isRTL ? 'لون النص' : 'Body text color'}
          value={formData.pdfStyle.colors?.text || '#111827'}
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              colors: { ...prev.pdfStyle.colors, text: value }
            })
          }))}
        />
        <TextInput
          label={isRTL ? 'اسم الشركة بالإنجليزية' : 'Company name in English'}
          value={formData.pdfStyle.branding?.companyName?.en || ''}
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              branding: {
                ...prev.pdfStyle.branding,
                companyName: mirrorEnglishToArabic(prev.pdfStyle.branding.companyName, value)
              }
            })
          }))}
        />
        <TextInput
          label={isRTL ? 'اسم الشركة بالعربية' : 'Company name in Arabic'}
          value={formData.pdfStyle.branding?.companyName?.ar || ''}
          dir="rtl"
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              branding: {
                ...prev.pdfStyle.branding,
                companyName: { ...prev.pdfStyle.branding.companyName, ar: value }
              }
            })
          }))}
        />
        <TextInput
          label={isRTL ? 'رابط الشعار' : 'Logo URL'}
          value={formData.pdfStyle.branding?.logoUrl || ''}
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              branding: { ...prev.pdfStyle.branding, logoUrl: value }
            })
          }))}
        />
        <TextInput
          label={isRTL ? 'رقم الهاتف' : 'Phone number'}
          value={formData.pdfStyle.branding?.companyPhone || ''}
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              branding: { ...prev.pdfStyle.branding, companyPhone: value },
              footer: { ...prev.pdfStyle.footer, phoneNumber: value }
            })
          }))}
        />
        <TextInput
          label={isRTL ? 'عنوان الشركة بالإنجليزية' : 'Company address in English'}
          value={formData.pdfStyle.branding?.companyAddress?.en || ''}
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              branding: {
                ...prev.pdfStyle.branding,
                companyAddress: mirrorEnglishToArabic(prev.pdfStyle.branding.companyAddress, value)
              }
            })
          }))}
        />
        <TextInput
          label={isRTL ? 'عنوان الشركة بالعربية' : 'Company address in Arabic'}
          value={formData.pdfStyle.branding?.companyAddress?.ar || ''}
          dir="rtl"
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              branding: {
                ...prev.pdfStyle.branding,
                companyAddress: { ...prev.pdfStyle.branding.companyAddress, ar: value }
              }
            })
          }))}
        />
        <TextAreaInput
          label={isRTL ? 'نص التذييل بالإنجليزية' : 'Footer text in English'}
          value={formData.pdfStyle.footer?.content?.en || ''}
          rows={2}
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              footer: {
                ...prev.pdfStyle.footer,
                content: mirrorEnglishToArabic(prev.pdfStyle.footer.content, value)
              }
            })
          }))}
        />
        <TextAreaInput
          label={isRTL ? 'نص التذييل بالعربية' : 'Footer text in Arabic'}
          value={formData.pdfStyle.footer?.content?.ar || ''}
          rows={2}
          dir="rtl"
          onChange={(value) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              footer: {
                ...prev.pdfStyle.footer,
                content: { ...prev.pdfStyle.footer.content, ar: value }
              }
            })
          }))}
        />
        <Checkbox
          label={isRTL ? 'تفعيل الرأس' : 'Enable header'}
          checked={formData.pdfStyle.header.enabled}
          onChange={(checked) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              header: { ...prev.pdfStyle.header, enabled: checked }
            })
          }))}
        />
        <Checkbox
          label={isRTL ? 'تفعيل التذييل' : 'Enable footer'}
          checked={formData.pdfStyle.footer.enabled}
          onChange={(checked) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              footer: { ...prev.pdfStyle.footer, enabled: checked }
            })
          }))}
        />
        <Checkbox
          label={isRTL ? 'إظهار الشعار' : 'Show logo'}
          checked={formData.pdfStyle.header.showLogo !== false}
          onChange={(checked) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              header: { ...prev.pdfStyle.header, showLogo: checked }
            })
          }))}
        />
        <Checkbox
          label={isRTL ? 'إظهار عنوان النموذج' : 'Show template title'}
          checked={formData.pdfStyle.header.showTitle !== false}
          onChange={(checked) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              header: { ...prev.pdfStyle.header, showTitle: checked }
            })
          }))}
        />
        <Checkbox
          label={isRTL ? 'إظهار QR في التذييل' : 'Show QR in footer'}
          checked={formData.pdfStyle.footer.showQRCode || false}
          onChange={(checked) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              footer: { ...prev.pdfStyle.footer, showQRCode: checked }
            })
          }))}
        />
        <Checkbox
          label={isRTL ? 'إظهار الهاتف في التذييل' : 'Show phone in footer'}
          checked={formData.pdfStyle.footer.showPhoneNumber || false}
          onChange={(checked) => setFormData((prev) => ({
            ...prev,
            pdfStyle: normalizePdfStyle({
              ...prev.pdfStyle,
              footer: { ...prev.pdfStyle.footer, showPhoneNumber: checked }
            })
          }))}
        />
      </div>
    </Card>
  );

  const renderPreviewPanel = () => (
    <TemplateBuilderPreview
      formData={formData}
      isRTL={isRTL}
      activeSectionId={selectedSectionId}
      onSelectSectionId={setSelectedSectionId}
    />
  );

  const renderActivePanel = () => {
    switch (activeTab) {
      case DEFAULT_WORKSPACE_TAB:
        return renderDetailsPanel();
      case 'layout':
        return renderLayoutPanel();
      case SECTION_LIBRARY_TAB:
        return renderSectionLibraryPanel();
      case 'branding':
        return renderBrandingPanel();
      case 'preview':
        return renderPreviewPanel();
      default:
        if (selectedSection) {
          return (
            <SectionEditor
              section={selectedSection}
              sectionIndex={selectedSectionIndex}
              sectionCount={formData.sections.length}
              messages={getSectionErrorMessages(selectedSection.id)}
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
          );
        }

        return renderSectionLibraryPanel();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-gray-600">{isRTL ? 'جارٍ تحميل القالب...' : 'Loading template...'}</p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
                {isRTL ? 'الأقسام' : 'Sections'}
              </div>
              <div className="mt-2 text-2xl font-bold">{formData.sections.length}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
                {isRTL ? 'الظاهرة في المعاينة' : 'Visible in preview'}
              </div>
              <div className="mt-2 text-2xl font-bold">{visibleSectionsCount}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
                {isRTL ? 'إعداد الصفحة' : 'Page setup'}
              </div>
              <div className="mt-2 text-lg font-bold">
                {formData.layout.pageSize} / {formData.layout.orientation}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div className="overflow-hidden rounded-[32px] bg-gradient-to-r from-primary via-primary-dark to-primary-dark p-6 text-white shadow-xl">
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
                  ? (isRTL ? 'حرر القالب عبر تبويبات أوضح وأسرع' : 'Edit the template with a clearer tabbed builder')
                  : (isRTL ? 'أنشئ قالب PDF عبر تبويبات مستقلة لكل قسم' : 'Build a PDF template with a dedicated tab for every section')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
                {isRTL
                  ? 'أضف الأقسام الجاهزة، ثم افتح كل قسم في تبويبه الخاص لتعديل الحقول أو الأعمدة مباشرة مع معاينة حية.'
                  : 'Add ready-made sections, then open each section in its own tab to edit fields or columns directly with a live preview.'}
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} icon={FaSave}>
              {saving ? (isRTL ? 'جارٍ الحفظ...' : 'Saving...') : (isRTL ? 'حفظ القالب' : 'Save Template')}
            </Button>
          </div>
        </div>

        {!isEditMode && formData.sections.length === 0 && (
          <Card className="overflow-hidden border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-primary/10">
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
                  className="rounded-[28px] border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
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
              {isRTL ? 'ما زالت هناك بعض البيانات الناقصة' : 'A few details still need attention'}
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

        <Card className="border border-primary/10 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
                {isRTL ? 'مساحة العمل' : 'Workspace'}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {isRTL ? 'كل قسم يعمل داخل تبويب مستقل' : 'Every section works inside its own tab'}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {isRTL ? 'الأقسام' : 'Sections'}
                </div>
                <div className="mt-1 text-lg font-bold text-gray-900">{formData.sections.length}</div>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {isRTL ? 'الظاهرة' : 'Visible'}
                </div>
                <div className="mt-1 text-lg font-bold text-gray-900">{visibleSectionsCount}</div>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {isRTL ? 'إعداد الصفحة' : 'Page setup'}
                </div>
                <div className="mt-1 text-lg font-bold text-gray-900">
                  {formData.layout.pageSize} / {formData.layout.orientation}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2 hidden-scrollbar">
            {workspaceTabs.map((tab) => (
              <WorkspaceTabButton
                key={tab.id}
                active={activeTab === tab.id}
                label={tab.label}
                subtitle={tab.subtitle}
                hasError={tab.hasError}
                onClick={() => openWorkspaceTab(tab.id)}
              />
            ))}
          </div>
        </Card>

        <div className="min-w-0">{renderActivePanel()}</div>
      </div>
    </Layout>
  );
};

export default TemplateBuilder;
