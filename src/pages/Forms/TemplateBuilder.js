import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaEye, FaEyeSlash, FaMagic, FaPlus, FaSave, FaTrash, FaUpload } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import { showError, showSuccess, showWarning } from '../../utils/toast';
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
  FOOTER_TEMPLATE_OPTIONS,
  SOCIAL_LINK_TYPE_OPTIONS,
  STARTER_TEMPLATES,
  THEMES,
  cloneData,
  createColumn,
  createField,
  createSocialLink,
  createSectionFromPreset,
  getDefaultPdfStyle,
  finalizeTemplateForSave,
  generateId,
  getDefaultTemplate,
  getLocalizedText,
  getSystemPdfPalette,
  mirrorArabicToEnglish,
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
    className={`min-w-[210px] rounded-[24px] border p-4 text-left transition ${active
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
  const { i18n } = useTranslation();
  const { organization } = useAuth();
  const { setOrganizationContext } = useOrganization();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const isRTL = i18n.language === 'ar';
  const activeOrganizationId = organization?.id || organization?._id || null;
  const organizationBrandingRef = useRef(organization?.branding);
  const isRTLRef = useRef(isRTL);

  const [formData, setFormData] = useState(() => normalizeTemplate(getDefaultTemplate(organization?.branding)));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [activeTab, setActiveTab] = useState(DEFAULT_WORKSPACE_TAB);
  const [errors, setErrors] = useState({});
  const [brandingUploads, setBrandingUploads] = useState({ logo: false, watermark: false });

  const mergePdfStyleConfig = (basePdfStyle, starterPdfStyle) => normalizePdfStyle({
    ...(basePdfStyle || {}),
    ...(starterPdfStyle || {}),
    branding: {
      ...(basePdfStyle?.branding || {}),
      ...(starterPdfStyle?.branding || {})
    },
    header: {
      ...(basePdfStyle?.header || {}),
      ...(starterPdfStyle?.header || {}),
      border: {
        ...(basePdfStyle?.header?.border || {}),
        ...(starterPdfStyle?.header?.border || {})
      }
    },
    footer: {
      ...(basePdfStyle?.footer || {}),
      ...(starterPdfStyle?.footer || {})
    },
    metadata: {
      ...(basePdfStyle?.metadata || {}),
      ...(starterPdfStyle?.metadata || {})
    },
    signature: {
      ...(basePdfStyle?.signature || {}),
      ...(starterPdfStyle?.signature || {})
    },
    fontSize: {
      ...(basePdfStyle?.fontSize || {}),
      ...(starterPdfStyle?.fontSize || {})
    },
    colors: {
      ...(basePdfStyle?.colors || {}),
      ...(starterPdfStyle?.colors || {})
    },
    spacing: {
      ...(basePdfStyle?.spacing || {}),
      ...(starterPdfStyle?.spacing || {})
    }
  });

  const alignPdfStyleToSystemColors = (pdfStyle) => {
    const normalized = normalizePdfStyle(pdfStyle);
    const systemPdfStyle = getDefaultPdfStyle();

    return normalizePdfStyle({
      ...normalized,
      branding: {
        ...normalized.branding,
        primaryColor: systemPdfStyle.branding.primaryColor,
        secondaryColor: systemPdfStyle.branding.secondaryColor
      },
      header: {
        ...normalized.header,
        backgroundColor: systemPdfStyle.header.backgroundColor,
        textColor: systemPdfStyle.header.textColor,
        titleColor: systemPdfStyle.header.titleColor,
        decorativeLineColor: systemPdfStyle.header.decorativeLineColor,
        border: {
          ...normalized.header?.border,
          color: systemPdfStyle.header.border.color
        }
      },
      footer: {
        ...normalized.footer,
        backgroundColor: systemPdfStyle.footer.backgroundColor,
        textColor: systemPdfStyle.footer.textColor
      },
      colors: {
        ...normalized.colors,
        primary: systemPdfStyle.colors.primary,
        secondary: systemPdfStyle.colors.secondary,
        text: systemPdfStyle.colors.text,
        border: systemPdfStyle.colors.border,
        background: systemPdfStyle.colors.background
      }
    });
  };

  const seedTemplateWithSourcePdfStyle = (template, sourcePdfStyle) => normalizeTemplate({
    ...template,
    pdfStyle: alignPdfStyleToSystemColors(sourcePdfStyle || template?.pdfStyle)
  });

  const seedStarterTemplateWithPdfStyle = (template, sourcePdfStyle) => normalizeTemplate({
    ...template,
    pdfStyle: alignPdfStyleToSystemColors(mergePdfStyleConfig(sourcePdfStyle, template?.pdfStyle))
  });

  useEffect(() => {
    organizationBrandingRef.current = organization?.branding;
    isRTLRef.current = isRTL;
  }, [isRTL, organization?.branding]);

  useEffect(() => {
    let cancelled = false;

    const initializeTemplateBuilder = async () => {
      setLoading(true);

      try {
        if (isEditMode) {
          const response = await api.get(`/form-templates/${id}`);
          if (cancelled) {
            return;
          }

          const normalized = normalizeTemplate({
            ...response.data.data,
            pdfStyle: alignPdfStyleToSystemColors(response.data.data?.pdfStyle)
          });
          const firstSectionId = normalized.sections[0]?.id || null;
          setFormData(normalized);
          setSelectedSectionId(firstSectionId);
          setActiveTab(firstSectionId ? getSectionTabId(firstSectionId) : DEFAULT_WORKSPACE_TAB);
          return;
        }

        const response = await api.get('/form-templates');
        if (cancelled) {
          return;
        }

        const latestTemplate = Array.isArray(response.data?.data) ? response.data.data[0] : null;
        const seededTemplate = seedTemplateWithSourcePdfStyle(
          getDefaultTemplate(organizationBrandingRef.current),
          latestTemplate?.pdfStyle
        );

        setFormData(seededTemplate);
        setSelectedSectionId(seededTemplate.sections[0]?.id || null);
        setActiveTab(DEFAULT_WORKSPACE_TAB);
      } catch (error) {
        console.error('Error initializing template builder:', error);

        if (!cancelled) {
          if (isEditMode) {
            showError(isRTLRef.current ? 'تعذر تحميل القالب.' : 'Unable to load the template.');
          }

          const fallbackTemplate = seedTemplateWithSourcePdfStyle(
            getDefaultTemplate(organizationBrandingRef.current)
          );
          setFormData(fallbackTemplate);
          setSelectedSectionId(fallbackTemplate.sections[0]?.id || null);
          setActiveTab(DEFAULT_WORKSPACE_TAB);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeTemplateBuilder();

    return () => {
      cancelled = true;
    };
  }, [activeOrganizationId, id, isEditMode]);

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
    const {
      primaryColor,
      secondaryColor,
      borderColor,
      backgroundColor,
      textColor,
      headerBackgroundColor,
      headerTextColor,
      footerBackgroundColor,
      footerTextColor
    } = getSystemPdfPalette();

    return {
      label: isRTL ? 'ألوان النظام' : 'System Colors',
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        border: borderColor,
        background: backgroundColor,
        text: textColor
      },
      header: {
        backgroundColor: headerBackgroundColor,
        textColor: headerTextColor,
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
        backgroundColor: footerBackgroundColor,
        textColor: footerTextColor
      }
    };
  }, [isRTL]);

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

    const template = seedStarterTemplateWithPdfStyle(starter.template(organization?.branding), formData.pdfStyle);
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

  const updateMetadataConfig = (patch) => {
    setFormData((prev) => ({
      ...prev,
      pdfStyle: normalizePdfStyle({
        ...prev.pdfStyle,
        metadata: {
          ...prev.pdfStyle.metadata,
          ...patch
        }
      })
    }));
  };

  const updateBrandingConfig = (patch) => {
    setFormData((prev) => ({
      ...prev,
      pdfStyle: normalizePdfStyle({
        ...prev.pdfStyle,
        branding: {
          ...prev.pdfStyle.branding,
          ...patch
        }
      })
    }));
  };

  const updateFooterConfig = (patch) => {
    setFormData((prev) => ({
      ...prev,
      pdfStyle: normalizePdfStyle({
        ...prev.pdfStyle,
        footer: {
          ...prev.pdfStyle.footer,
          ...patch
        }
      })
    }));
  };

  const updateSignatureConfig = (patch) => {
    setFormData((prev) => ({
      ...prev,
      pdfStyle: normalizePdfStyle({
        ...prev.pdfStyle,
        signature: {
          ...prev.pdfStyle.signature,
          ...patch
        }
      })
    }));
  };

  const handleBrandingAssetUpload = async (assetType, file) => {
    if (!file) {
      return;
    }

    setBrandingUploads((prev) => ({ ...prev, [assetType]: true }));

    try {
      const payload = new FormData();
      payload.append('image', file);

      const response = await api.post(`/organizations/current/settings/branding-assets/${assetType}`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedOrganization = response.data?.data || null;
      const brandingField = assetType === 'watermark' ? 'watermarkUrl' : 'logoUrl';
      const nextUrl = updatedOrganization?.branding?.[brandingField] || '';

      if (updatedOrganization) {
        setOrganizationContext(updatedOrganization);
      }

      updateBrandingConfig({ [brandingField]: nextUrl });
      showSuccess(
        assetType === 'watermark'
          ? (isRTL ? 'تم حفظ العلامة المائية بنجاح.' : 'Watermark saved successfully.')
          : (isRTL ? 'تم حفظ الشعار بنجاح.' : 'Logo saved successfully.')
      );
    } catch (error) {
      showError(error.response?.data?.message || (isRTL ? 'تعذر رفع الصورة.' : 'Unable to upload the image.'));
    } finally {
      setBrandingUploads((prev) => ({ ...prev, [assetType]: false }));
    }
  };

  const addFooterSocialLink = () => {
    updateFooterConfig({
      socialLinks: [...(formData.pdfStyle.footer?.socialLinks || []), createSocialLink()]
    });
  };

  const updateFooterSocialLink = (linkId, patch) => {
    setFormData((prev) => ({
      ...prev,
      pdfStyle: normalizePdfStyle({
        ...prev.pdfStyle,
        footer: {
          ...prev.pdfStyle.footer,
          socialLinks: (prev.pdfStyle.footer?.socialLinks || []).map((link) => (
            link.id === linkId ? { ...link, ...patch } : link
          ))
        }
      })
    }));
  };

  const deleteFooterSocialLink = (linkId) => {
    updateFooterConfig({
      socialLinks: (formData.pdfStyle.footer?.socialLinks || []).filter((link) => link.id !== linkId)
    });
  };

  const renderDetailsPanel = () => (
    <Card title={isRTL ? 'بيانات القالب' : 'Template Details'} className="border border-primary/10 bg-white">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label={isRTL ? 'العنوان بالإنجليزية' : 'English title'}
          value={formData.title.en}
          onChange={(value) => setFormData((prev) => ({ ...prev, title: { ...prev.title, en: value } }))}
        />
        <TextInput
          label={isRTL ? 'العنوان بالعربية' : 'Arabic title'}
          value={formData.title.ar}
          dir="rtl"
          onChange={(value) => setFormData((prev) => ({ ...prev, title: mirrorArabicToEnglish(prev.title, value) }))}
        />
        <TextAreaInput
          label={isRTL ? 'الوصف بالإنجليزية' : 'English description'}
          value={formData.description.en}
          rows={3}
          onChange={(value) => setFormData((prev) => ({ ...prev, description: { ...prev.description, en: value } }))}
        />
        <TextAreaInput
          label={isRTL ? 'الوصف بالعربية' : 'Arabic description'}
          value={formData.description.ar}
          rows={3}
          dir="rtl"
          onChange={(value) => setFormData((prev) => ({ ...prev, description: mirrorArabicToEnglish(prev.description, value) }))}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900">
            {isRTL ? 'بيانات النموذج الظاهرة' : 'Visible Form Metadata'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isRTL
              ? 'تحكم في ظهور معلومات النموذج مثل الرقم والتاريخ والقسم في المعاينة وملف الـ PDF.'
              : 'Control which form details appear in the preview and generated PDF.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Checkbox
            label={isRTL ? 'إظهار بيانات النموذج' : 'Show metadata block'}
            checked={formData.pdfStyle.metadata?.enabled !== false}
            onChange={(checked) => updateMetadataConfig({ enabled: checked })}
            isRTL={isRTL}
          />
        </div>

        {formData.pdfStyle.metadata?.enabled !== false && (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Checkbox
              label={isRTL ? 'رقم النموذج' : 'Form ID'}
              checked={formData.pdfStyle.metadata?.showFormId !== false}
              onChange={(checked) => updateMetadataConfig({ showFormId: checked })}
              isRTL={isRTL}
            />
            <Checkbox
              label={isRTL ? 'التاريخ' : 'Date'}
              checked={formData.pdfStyle.metadata?.showDate !== false}
              onChange={(checked) => updateMetadataConfig({ showDate: checked })}
              isRTL={isRTL}
            />
            <Checkbox
              label={isRTL ? 'الوردية' : 'Shift'}
              checked={formData.pdfStyle.metadata?.showShift !== false}
              onChange={(checked) => updateMetadataConfig({ showShift: checked })}
              isRTL={isRTL}
            />
            <Checkbox
              label={isRTL ? 'القسم' : 'Department'}
              checked={formData.pdfStyle.metadata?.showDepartment !== false}
              onChange={(checked) => updateMetadataConfig({ showDepartment: checked })}
              isRTL={isRTL}
            />
            <Checkbox
              label={isRTL ? 'تم الملء بواسطة' : 'Filled By'}
              checked={formData.pdfStyle.metadata?.showFilledBy !== false}
              onChange={(checked) => updateMetadataConfig({ showFilledBy: checked })}
              isRTL={isRTL}
            />
            <Checkbox
              label={isRTL ? 'تاريخ الإرسال' : 'Submitted On'}
              checked={formData.pdfStyle.metadata?.showSubmittedOn !== false}
              onChange={(checked) => updateMetadataConfig({ showSubmittedOn: checked })}
              isRTL={isRTL}
            />
            <Checkbox
              label={isRTL ? 'تم الاعتماد بواسطة' : 'Approved By'}
              checked={formData.pdfStyle.metadata?.showApprovedBy !== false}
              onChange={(checked) => updateMetadataConfig({ showApprovedBy: checked })}
              isRTL={isRTL}
            />
            <Checkbox
              label={isRTL ? 'تاريخ الاعتماد' : 'Approval Date'}
              checked={formData.pdfStyle.metadata?.showApprovalDate !== false}
              onChange={(checked) => updateMetadataConfig({ showApprovalDate: checked })}
              isRTL={isRTL}
            />
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900">
            {isRTL ? 'قسم التوقيعات' : 'Signature Block'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isRTL
              ? 'تحكم في ظهور خانة تم الإعداد بواسطة وتم الاعتماد بواسطة في المعاينة وصفحة العرض.'
              : 'Control the Prepared By and Approved By signature area in preview and view form.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Checkbox
            label={isRTL ? 'إظهار قسم التوقيعات' : 'Show signature block'}
            checked={formData.pdfStyle.signature?.enabled !== false}
            onChange={(checked) => updateSignatureConfig({ enabled: checked })}
            isRTL={isRTL}
          />
        </div>

        {formData.pdfStyle.signature?.enabled !== false && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Checkbox
              label={isRTL ? 'تم الإعداد بواسطة' : 'Prepared By'}
              checked={formData.pdfStyle.signature?.showPreparedBy !== false}
              onChange={(checked) => updateSignatureConfig({ showPreparedBy: checked })}
              isRTL={isRTL}
            />
            <Checkbox
              label={isRTL ? 'تم الاعتماد بواسطة' : 'Approved By'}
              checked={formData.pdfStyle.signature?.showApprovedBy !== false}
              onChange={(checked) => updateSignatureConfig({ showApprovedBy: checked })}
              isRTL={isRTL}
            />
          </div>
        )}
      </div>
    </Card>
  );

  const renderLayoutPanel = () => (
    <Card title={isRTL ? 'إعدادات PDF' : 'PDF Layout'} className="border border-primary/10 bg-white">
      <div className="grid gap-4 md:grid-cols-2">
        {/* <SelectField
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
        /> */}
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
                <div className={`font-semibold text-gray-900 ${isRTL ? "text-right" : "text-left"}`}>{getLocalizedText(preset.label, isRTL)}</div>
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
                className={`w-full rounded-[24px] border p-4 text-left transition ${isSelected ? 'border-primary bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg' : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-md'
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

  const renderBrandingPanel = () => {
    const currentLogoUrl = formData.pdfStyle.branding?.logoUrl || organization?.branding?.logoUrl || '';
    const currentWatermarkUrl = formData.pdfStyle.branding?.watermarkUrl || organization?.branding?.watermarkUrl || currentLogoUrl || '';
    const socialLinks = formData.pdfStyle.footer?.socialLinks || [];
    const logoSize = formData.pdfStyle.header?.logoSize || 64;
    const watermarkSize = formData.pdfStyle.branding?.watermarkSize || 55;
    const watermarkOpacity = formData.pdfStyle.branding?.watermarkOpacity || 5;
    const qrCodeSize = formData.pdfStyle.footer?.qrCodeSize || 84;

    const renderAssetCard = ({ assetType, title, description, previewUrl, previewClassName = '', previewStyle = {} }) => (
      <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <div className="mt-4 flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-white p-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={title}
              className={`max-h-40 w-full rounded-xl object-contain ${previewClassName}`}
              style={previewStyle}
            />
          ) : (
            <div className="text-center text-sm text-gray-500">
              {isRTL ? 'لا توجد صورة محفوظة بعد.' : 'No saved image yet.'}
            </div>
          )}
        </div>
        <label className={`mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition ${brandingUploads[assetType] ? 'cursor-wait opacity-70' : 'hover:border-primary hover:shadow-md'}`}>
          <FaUpload />
          <span>
            {brandingUploads[assetType]
              ? (isRTL ? 'جارٍ الرفع...' : 'Uploading...')
              : (isRTL ? 'رفع صورة' : 'Upload image')}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            disabled={brandingUploads[assetType]}
            onChange={(event) => {
              const nextFile = event.target.files?.[0];
              handleBrandingAssetUpload(assetType, nextFile);
              event.target.value = '';
            }}
          />
        </label>
        <p className="mt-3 text-xs text-gray-500">
          {isRTL
            ? 'تُحفظ هذه الصورة في إعدادات المؤسسة وتظهر تلقائياً عند إنشاء قالب جديد.'
            : 'This image is saved in organization branding and will appear again in new templates.'}
        </p>
      </div>
    );

    return (
      <Card title={isRTL ? 'الهوية والألوان' : 'Branding and Colors'} className="border border-primary/10 bg-white">
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => applyThemeConfig(systemTheme)}
            className="rounded-[22px] border border-primary/20 bg-primary/5 p-4 text-left transition hover:border-primary hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              {[systemTheme.colors.primary, systemTheme.colors.secondary, systemTheme.footer.backgroundColor].map((color, index) => (
                <span key={`system_${index}_${color}`} className="h-6 w-6 rounded-full border border-white shadow" style={{ backgroundColor: color }} />
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
                {[theme.colors.primary, theme.colors.secondary, theme.footer.backgroundColor].map((color, index) => (
                  <span key={`${themeKey}_${index}_${color}`} className="h-6 w-6 rounded-full border border-white shadow" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="mt-3 font-semibold text-gray-900">{isRTL ? theme.labelAr : theme.label}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <ColorInput
                label={isRTL ? 'اللون الرئيسي' : 'Primary color'}
                value={formData.pdfStyle.branding?.primaryColor || systemTheme.colors.primary}
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
                onChange={(value) => updateBrandingConfig({
                  companyName: { ...formData.pdfStyle.branding.companyName, en: value }
                })}
              />
              <TextInput
                label={isRTL ? 'اسم الشركة بالعربية' : 'Company name in Arabic'}
                value={formData.pdfStyle.branding?.companyName?.ar || ''}
                dir="rtl"
                onChange={(value) => updateBrandingConfig({
                  companyName: mirrorArabicToEnglish(formData.pdfStyle.branding.companyName, value)
                })}
              />
              <TextInput
                label={isRTL ? 'رقم الهاتف' : 'Phone number'}
                value={formData.pdfStyle.footer?.phoneNumber || formData.pdfStyle.branding?.companyPhone || ''}
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
                onChange={(value) => updateBrandingConfig({
                  companyAddress: { ...formData.pdfStyle.branding.companyAddress, en: value }
                })}
              />
              <TextInput
                label={isRTL ? 'عنوان الشركة بالعربية' : 'Company address in Arabic'}
                value={formData.pdfStyle.branding?.companyAddress?.ar || ''}
                dir="rtl"
                onChange={(value) => updateBrandingConfig({
                  companyAddress: mirrorArabicToEnglish(formData.pdfStyle.branding.companyAddress, value)
                })}
              />
              <TextInput
                label={isRTL ? 'نص QR أو الرابط' : 'QR / barcode text or URL'}
                value={formData.pdfStyle.footer?.qrCodeValue || ''}
                onChange={(value) => updateFooterConfig({ qrCodeValue: value })}
              />
              <SelectField
                label={isRTL ? 'قالب التذييل' : 'Footer template'}
                value={formData.pdfStyle.footer?.template || 'classic'}
                onChange={(value) => updateFooterConfig({ template: value })}
                options={FOOTER_TEMPLATE_OPTIONS}
                isRTL={isRTL}
              />
              <SelectField
                label={isRTL ? 'موضع QR' : 'QR position'}
                value={formData.pdfStyle.footer?.qrCodePosition || 'center'}
                onChange={(value) => updateFooterConfig({ qrCodePosition: value })}
                options={[
                  { value: 'left', label: 'Left', labelAr: 'يسار' },
                  { value: 'center', label: 'Center', labelAr: 'وسط' },
                  { value: 'right', label: 'Right', labelAr: 'يمين' }
                ]}
                isRTL={isRTL}
              />
              <NumberInput
                label={isRTL ? 'حجم الشعار (px)' : 'Logo size (px)'}
                value={logoSize}
                max={160}
                onChange={(value) => setFormData((prev) => ({
                  ...prev,
                  pdfStyle: normalizePdfStyle({
                    ...prev.pdfStyle,
                    header: { ...prev.pdfStyle.header, logoSize: value }
                  })
                }))}
              />
              <NumberInput
                label={isRTL ? 'حجم العلامة المائية (%)' : 'Watermark size (%)'}
                value={watermarkSize}
                max={100}
                onChange={(value) => updateBrandingConfig({ watermarkSize: value })}
              />
              <NumberInput
                label={isRTL ? 'شفافية العلامة المائية (%)' : 'Watermark opacity (%)'}
                value={watermarkOpacity}
                min={0}
                max={100}
                onChange={(value) => updateBrandingConfig({ watermarkOpacity: value })}
              />
              <NumberInput
                label={isRTL ? 'حجم QR (px)' : 'QR size (px)'}
                value={qrCodeSize}
                max={160}
                onChange={(value) => updateFooterConfig({ qrCodeSize: value })}
              />
              <TextAreaInput
                label={isRTL ? 'نص التذييل بالإنجليزية' : 'Footer text in English'}
                value={formData.pdfStyle.footer?.content?.en || ''}
                rows={2}
                onChange={(value) => updateFooterConfig({
                  content: { ...formData.pdfStyle.footer.content, en: value }
                })}
              />
              <TextAreaInput
                label={isRTL ? 'نص التذييل بالعربية' : 'Footer text in Arabic'}
                value={formData.pdfStyle.footer?.content?.ar || ''}
                rows={2}
                dir="rtl"
                onChange={(value) => updateFooterConfig({
                  content: mirrorArabicToEnglish(formData.pdfStyle.footer.content, value)
                })}
              />
            </div>

            <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5">
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-900">
                  {isRTL ? 'إعدادات العرض والتذييل' : 'Display and Footer Controls'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isRTL
                    ? 'تحكم في إظهار الشعار والعنوان وQR والهاتف وروابط التواصل في العرض النهائي.'
                    : 'Control logo, title, QR, phone, and social links in the final document.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Checkbox
                  label={isRTL ? 'تفعيل الرأس' : 'Enable header'}
                  checked={formData.pdfStyle.header.enabled}
                  isRTL={isRTL}
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
                  isRTL={isRTL}
                  onChange={(checked) => updateFooterConfig({ enabled: checked })}
                />
                <Checkbox
                  label={isRTL ? 'إظهار الشعار' : 'Show logo'}
                  checked={formData.pdfStyle.header.showLogo !== false}
                  isRTL={isRTL}
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
                  isRTL={isRTL}
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
                  isRTL={isRTL}
                  onChange={(checked) => updateFooterConfig({ showQRCode: checked })}
                />
                <Checkbox
                  label={isRTL ? 'إظهار الهاتف في التذييل' : 'Show phone in footer'}
                  checked={formData.pdfStyle.footer.showPhoneNumber || false}
                  isRTL={isRTL}
                  onChange={(checked) => updateFooterConfig({ showPhoneNumber: checked })}
                />
                <Checkbox
                  label={isRTL ? 'إظهار روابط التواصل' : 'Show social icons'}
                  checked={formData.pdfStyle.footer.showSocialIcons || false}
                  isRTL={isRTL}
                  onChange={(checked) => updateFooterConfig({ showSocialIcons: checked })}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {isRTL ? 'روابط التواصل' : 'Social Links'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isRTL
                      ? 'أضف روابط فيسبوك أو إنستغرام أو الموقع، وستصبح الأيقونات قابلة للنقر في صفحة العرض.'
                      : 'Add website or social URLs, and the icons will be clickable in the rendered form.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addFooterSocialLink}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:border-primary hover:shadow-md"
                >
                  <FaPlus />
                  <span>{isRTL ? 'إضافة رابط' : 'Add link'}</span>
                </button>
              </div>

              {socialLinks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-4 py-6 text-sm text-gray-500">
                  {isRTL ? 'لم تتم إضافة أي روابط بعد.' : 'No social links added yet.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {socialLinks.map((link) => (
                    <div key={link.id} className="grid gap-3 rounded-2xl border border-white/70 bg-white p-4 md:grid-cols-[180px_minmax(0,1fr)_52px] md:items-end">
                      <SelectField
                        label={isRTL ? 'النوع' : 'Type'}
                        value={link.type}
                        onChange={(value) => updateFooterSocialLink(link.id, { type: value })}
                        options={SOCIAL_LINK_TYPE_OPTIONS}
                        isRTL={isRTL}
                      />
                      <TextInput
                        label={isRTL ? 'الرابط' : 'URL'}
                        value={link.url}
                        onChange={(value) => updateFooterSocialLink(link.id, { url: value })}
                        placeholder={link.type === 'email' ? 'name@example.com' : 'https://example.com'}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => deleteFooterSocialLink(link.id)}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-red-200 text-red-600 transition hover:bg-red-50"
                        title={isRTL ? 'حذف الرابط' : 'Delete link'}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {renderAssetCard({
              assetType: 'logo',
              title: isRTL ? 'شعار الشركة' : 'Company Logo',
              description: isRTL ? 'ارفع الشعار مرة واحدة ليُعاد استخدامه في القوالب الجديدة.' : 'Upload once and reuse it in future templates.',
              previewUrl: currentLogoUrl,
              previewStyle: { maxHeight: `${logoSize}px` }
            })}
            {renderAssetCard({
              assetType: 'watermark',
              title: isRTL ? 'الصورة المائية' : 'Watermark Image',
              description: isRTL ? 'تظهر خلف المستند ويمكن تغييرها لاحقاً بدون إعادة رفعها لكل قالب.' : 'Used behind the document and reused without re-uploading for every template.',
              previewUrl: currentWatermarkUrl,
              previewClassName: 'opacity-30',
              previewStyle: {
                maxHeight: `${Math.max(0, Math.round((watermarkSize / 100) * 160))}px`,
                opacity: Math.max(0.05, watermarkOpacity / 100)
              }
            })}
          </div>
        </div>
      </Card>
    );
  };

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
                {isRTL ? 'منشئ PDF' : 'PDF Builder'}
              </p>
              <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                {isEditMode
                  ? (isRTL ? 'حرر القالب' : 'Edit the template')
                  : (isRTL ? 'أنشئ قالب' : 'Build a template')}
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
                {isRTL ? 'جميع الاقسام' : 'All of the sections'}
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
              {/* <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {isRTL ? 'إعداد الصفحة' : 'Page setup'}
                </div>
                <div className="mt-1 text-lg font-bold text-gray-900">
                  {formData.layout.pageSize} / {formData.layout.orientation}
                </div>
              </div> */}
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
