import {
  FaCheck,
  FaColumns,
  FaFileAlt,
  FaFont,
  FaPalette,
  FaTable
} from 'react-icons/fa';

export const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text', labelAr: 'نص' },
  { value: 'textarea', label: 'Paragraph', labelAr: 'فقرة' },
  { value: 'static_text', label: 'Fixed text', labelAr: 'نص ثابت' },
  { value: 'number', label: 'Number', labelAr: 'رقم' },
  { value: 'boolean', label: 'Yes / No', labelAr: 'نعم / لا' },
  { value: 'select', label: 'Select list', labelAr: 'قائمة اختيار' },
  { value: 'date', label: 'Date', labelAr: 'تاريخ' },
  { value: 'time', label: 'Time', labelAr: 'وقت' },
  { value: 'datetime', label: 'Date & time', labelAr: 'تاريخ ووقت' },
  { value: 'file', label: 'File', labelAr: 'ملف' }
];

export const WIDTH_OPTIONS = [
  { value: 'full', label: 'Full width', labelAr: 'عرض كامل' },
  { value: 'half', label: 'Half', labelAr: 'نصف' },
  { value: 'third', label: 'Third', labelAr: 'ثلث' },
  { value: 'two-thirds', label: 'Two thirds', labelAr: 'ثلثان' },
  { value: 'quarter', label: 'Quarter', labelAr: 'ربع' },
  { value: 'three-quarters', label: 'Three quarters', labelAr: 'ثلاثة أرباع' }
];

export const SECTION_TYPE_OPTIONS = [
  { value: 'normal', label: 'Normal', labelAr: 'عادي' },
  { value: 'signature', label: 'Signature', labelAr: 'توقيع' },
  { value: 'approval', label: 'Approval', labelAr: 'اعتماد' },
  { value: 'notes', label: 'Notes', labelAr: 'ملاحظات' },
  { value: 'totals', label: 'Totals', labelAr: 'إجمالي' },
  { value: 'header', label: 'Header block', labelAr: 'كتلة رأس' }
];

export const SECTION_LAYOUT_OPTIONS = [
  {
    value: 'simple',
    label: 'Simple',
    labelAr: 'بسيط',
    description: 'Normal fields in a clean block',
    descriptionAr: 'حقول عادية في كتلة مرتبة',
    icon: FaFileAlt
  },
  {
    value: 'columns',
    label: 'Columns',
    labelAr: 'أعمدة',
    description: 'Split the section into columns',
    descriptionAr: 'قسم المحتوى إلى أعمدة',
    icon: FaColumns
  },
  {
    value: 'grid',
    label: 'Grid',
    labelAr: 'شبكة',
    description: 'Build compact cards in rows',
    descriptionAr: 'أنشئ بطاقات مدمجة في صفوف',
    icon: FaPalette
  },
  {
    value: 'table',
    label: 'Table',
    labelAr: 'جدول',
    description: 'Create printable rows and columns',
    descriptionAr: 'أنشئ صفوفًا وأعمدة للطباعة',
    icon: FaTable
  }
];

export const SECTION_PRESETS = [
  { id: 'simple', label: { en: 'Information', ar: 'معلومات' }, icon: FaFileAlt },
  { id: 'columns', label: { en: 'Columns', ar: 'أعمدة' }, icon: FaColumns },
  { id: 'grid', label: { en: 'Grid', ar: 'شبكة' }, icon: FaPalette },
  { id: 'table', label: { en: 'Table', ar: 'جدول' }, icon: FaTable },
  { id: 'static', label: { en: 'Fixed Text', ar: 'نص ثابت' }, icon: FaFont },
  { id: 'notes', label: { en: 'Notes', ar: 'ملاحظات' }, icon: FaFont },
  { id: 'signatures', label: { en: 'Approval', ar: 'اعتماد' }, icon: FaCheck }
];

export const THEMES = {
  sand: {
    label: 'Sand',
    labelAr: 'رملي',
    colors: {
      primary: '#c99027',
      secondary: '#8f3b1f',
      border: '#ecd9b0',
      background: '#fffdf8',
      text: '#1f2937'
    },
    header: {
      backgroundColor: '#fff7e7',
      textColor: '#2b2113',
      titleColor: '#c99027',
      border: {
        show: true,
        width: 3,
        style: 'solid',
        color: '#c99027',
        position: 'bottom'
      }
    },
    footer: {
      backgroundColor: '#c99027',
      textColor: '#ffffff'
    }
  },
  slate: {
    label: 'Slate',
    labelAr: 'رمادي',
    colors: {
      primary: '#0f172a',
      secondary: '#334155',
      border: '#cbd5e1',
      background: '#ffffff',
      text: '#0f172a'
    },
    header: {
      backgroundColor: '#f8fafc',
      textColor: '#0f172a',
      titleColor: '#0f172a',
      border: {
        show: true,
        width: 2,
        style: 'solid',
        color: '#0f172a',
        position: 'bottom'
      }
    },
    footer: {
      backgroundColor: '#0f172a',
      textColor: '#ffffff'
    }
  },
  emerald: {
    label: 'Emerald',
    labelAr: 'زمردي',
    colors: {
      primary: '#047857',
      secondary: '#065f46',
      border: '#a7f3d0',
      background: '#f0fdf4',
      text: '#064e3b'
    },
    header: {
      backgroundColor: '#ecfdf5',
      textColor: '#064e3b',
      titleColor: '#047857',
      border: {
        show: true,
        width: 3,
        style: 'solid',
        color: '#047857',
        position: 'bottom'
      }
    },
    footer: {
      backgroundColor: '#047857',
      textColor: '#ffffff'
    }
  },
  ink: {
    label: 'Ink',
    labelAr: 'حبر',
    colors: {
      primary: '#111827',
      secondary: '#6d28d9',
      border: '#d1d5db',
      background: '#ffffff',
      text: '#111827'
    },
    header: {
      backgroundColor: '#111827',
      textColor: '#ffffff',
      titleColor: '#ffffff',
      border: {
        show: false,
        width: 0,
        style: 'solid',
        color: '#111827',
        position: 'bottom'
      }
    },
    footer: {
      backgroundColor: '#111827',
      textColor: '#ffffff'
    }
  }
};

export const SOCIAL_LINK_TYPE_OPTIONS = [
  { value: 'website', label: 'Website', labelAr: 'الموقع' },
  { value: 'email', label: 'Email', labelAr: 'البريد الإلكتروني' },
  { value: 'facebook', label: 'Facebook', labelAr: 'فيسبوك' },
  { value: 'instagram', label: 'Instagram', labelAr: 'إنستغرام' },
  { value: 'linkedin', label: 'LinkedIn', labelAr: 'لينكدإن' },
  { value: 'youtube', label: 'YouTube', labelAr: 'يوتيوب' },
  { value: 'whatsapp', label: 'WhatsApp', labelAr: 'واتساب' },
  { value: 'telegram', label: 'Telegram', labelAr: 'تيليجرام' },
  { value: 'x', label: 'X / Twitter', labelAr: 'إكس / تويتر' },
  { value: 'tiktok', label: 'TikTok', labelAr: 'تيك توك' },
  { value: 'snapchat', label: 'Snapchat', labelAr: 'سناب شات' },
  { value: 'discord', label: 'Discord', labelAr: 'ديسكورد' },
  { value: 'pinterest', label: 'Pinterest', labelAr: 'بينترست' },
  { value: 'github', label: 'GitHub', labelAr: 'جيت هب' }
];

export const FOOTER_TEMPLATE_OPTIONS = [
  { value: 'classic', label: 'Classic', labelAr: 'كلاسيكي' },
  { value: 'centered', label: 'Centered', labelAr: 'متمركز' },
  { value: 'contact', label: 'Contact Bar', labelAr: 'شريط تواصل' },
  { value: 'minimal', label: 'Minimal', labelAr: 'بسيط' }
];

const DEFAULT_PRIMARY_COLOR = '#d4b900';
const DEFAULT_SECONDARY_COLOR = '#9e8b00';
const FOOTER_TEMPLATE_VALUES = FOOTER_TEMPLATE_OPTIONS.map((option) => option.value);

const getDefaultBrandingName = (branding = {}) => branding?.displayName || branding?.shortName || 'Atsha';
const clampNumber = (value, fallback, min, max) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numericValue));
};

const normalizeFooterTemplate = (value) => (
  FOOTER_TEMPLATE_VALUES.includes(value) ? value : 'classic'
);

export const cloneData = (value) => JSON.parse(JSON.stringify(value));

export const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const getLocalizedText = (value, isRTL, fallback = '') => {
  if (typeof value === 'string') {
    return value || fallback;
  }

  const primary = isRTL ? value?.ar : value?.en;
  const secondary = isRTL ? value?.en : value?.ar;
  return primary || secondary || fallback;
};

export const normalizeLocalizedValue = (value) => ({
  en: typeof value?.en === 'string' ? value.en : '',
  ar: typeof value?.ar === 'string' ? value.ar : ''
});

export const finalizeLocalizedValue = (value) => {
  const normalized = normalizeLocalizedValue(value);
  const firstFilled = normalized.en || normalized.ar || '';
  return {
    en: normalized.en || firstFilled,
    ar: normalized.ar || firstFilled
  };
};

export const mirrorEnglishToArabic = (currentValue, nextEnglish) => {
  const current = normalizeLocalizedValue(currentValue);
  const arabicWasMirrored = !current.ar || current.ar === current.en;

  return {
    en: nextEnglish,
    ar: arabicWasMirrored ? nextEnglish : current.ar
  };
};

export const mirrorArabicToEnglish = (currentValue, nextArabic) => {
  const current = normalizeLocalizedValue(currentValue);
  const englishWasMirrored = !current.en || current.en === current.ar;

  return {
    en: englishWasMirrored ? nextArabic : current.en,
    ar: nextArabic
  };
};

export const createSocialLink = (overrides = {}) => ({
  id: generateId('social'),
  type: 'website',
  url: '',
  ...overrides
});

const normalizeSocialLink = (link, index) => {
  const normalizedType = typeof link?.type === 'string' && SOCIAL_LINK_TYPE_OPTIONS.some((option) => option.value === link.type)
    ? link.type
    : 'website';

  return {
    ...createSocialLink(),
    ...link,
    id: link?.id || generateId(`social_${index}`),
    type: normalizedType,
    url: typeof link?.url === 'string' ? link.url : ''
  };
};

const finalizeSocialLinkForSave = (link, index) => {
  const normalized = normalizeSocialLink(link, index);
  const trimmedUrl = normalized.url.trim();

  if (!trimmedUrl) {
    return null;
  }

  return {
    ...normalized,
    url: trimmedUrl
  };
};

export const moveItem = (items, fromIndex, toIndex) => {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

export const getDefaultAdvancedLayout = () => ({
  layoutType: 'simple',
  table: {
    enabled: false,
    columns: [],
    dynamicRows: false,
    rowSource: '',
    numberOfRows: 6,
    showHeader: true,
    showBorders: true,
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderWidth: 1,
    stripedRows: false,
    headerStyle: {
      backgroundColor: '#f3f4f6',
      textColor: '#111827',
      fontSize: 14,
      bold: true
    },
    cellStyle: {
      backgroundColor: '#ffffff',
      textColor: '#111827',
      fontSize: 13
    }
  },
  columns: {
    enabled: false,
    columnCount: 2,
    columnGap: 20,
    columnWidths: [],
    equalWidths: true
  },
  grid: {
    enabled: false,
    rows: 1,
    columns: 2,
    gap: 12,
    template: ''
  },
  spacing: {
    sectionSpacing: 20,
    fieldSpacing: 12,
    lineSpacing: 1.4
  },
  sizing: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 'auto',
    height: 'auto',
    maxHeight: 'auto',
    minHeight: 'auto'
  },
  padding: {
    top: 12,
    right: 12,
    bottom: 12,
    left: 12
  },
  margins: {
    top: 0,
    right: 0,
    bottom: 16,
    left: 0
  },
  styling: {
    titleColor: '#111827',
    titleFontSize: 18,
    showTitle: true,
    backgroundColor: '#ffffff',
    textColor: '#111827',
    borderColor: '#d1d5db'
  }
});

export const getDefaultSectionPdfStyle = () => ({
  backgroundColor: '#ffffff',
  borderColor: '#d1d5db',
  borderWidth: 1,
  padding: 12,
  marginTop: 0,
  marginBottom: 16,
  showBorder: true,
  showBackground: false
});

export const getDefaultPdfStyle = (branding = {}) => {
  const primaryColor = branding?.primaryColor || DEFAULT_PRIMARY_COLOR;
  const secondaryColor = branding?.secondaryColor || DEFAULT_SECONDARY_COLOR;
  const companyName = getDefaultBrandingName(branding);

  return {
    branding: {
      primaryColor,
      secondaryColor,
      logoUrl: branding?.logoUrl || '',
      watermarkUrl: branding?.watermarkUrl || '',
      watermarkSize: 55,
      watermarkOpacity: 5,
      companyAddress: { en: '', ar: '' },
      companyPhone: '',
      companyEmail: branding?.supportEmail || '',
      companyName: { en: companyName, ar: companyName }
    },
    header: {
      enabled: true,
      showLogo: true,
      showTitle: true,
      showSubtitle: false,
      showDate: true,
      showCompanyName: true,
      showCompanyAddress: true,
      layout: 'default',
      logoPosition: 'right',
      titleStyle: 'normal',
      subtitle: { en: '', ar: '' },
      decorativeLineColor: primaryColor,
      height: 96,
      logoSize: 64,
      backgroundColor: '#fffbeb',
      textColor: '#1f2937',
      titleColor: primaryColor,
      fontSize: 18,
      dashedBorder: false,
      border: {
        show: true,
        width: 3,
        style: 'solid',
        color: primaryColor,
        position: 'bottom'
      }
    },
    footer: {
      enabled: true,
      showPageNumbers: true,
      showCompanyInfo: true,
      showQRCode: false,
      showPhoneNumber: false,
      showSocialIcons: false,
      qrCodePosition: 'center',
      qrCodeSize: 84,
      template: 'classic',
      phoneNumber: '',
      qrCodeValue: '',
      socialLinks: [],
      companyName,
      height: 56,
      backgroundColor: secondaryColor,
      textColor: '#ffffff',
      fontSize: 12,
      content: { en: '', ar: '' }
    },
    metadata: {
      enabled: true,
      showFormId: true,
      showDate: true,
      showShift: true,
      showDepartment: true,
      showFilledBy: true,
      showSubmittedOn: true,
      showApprovedBy: true,
      showApprovalDate: true
    },
    signature: {
      enabled: true,
      showPreparedBy: true,
      showApprovedBy: true
    },
    fontFamily: 'Helvetica',
    fontSize: {
      title: 24,
      section: 18,
      field: 14
    },
    colors: {
      primary: primaryColor,
      secondary: secondaryColor,
      text: '#111827',
      border: '#d1d5db',
      background: '#ffffff'
    },
    spacing: {
      sectionSpacing: 20,
      fieldSpacing: 12,
      lineSpacing: 1.4
    }
  };
};

export const getDefaultTemplate = (branding = {}) => ({
  title: { en: '', ar: '' },
  description: { en: '', ar: '' },
  sections: [],
  visibleToRoles: ['admin', 'supervisor', 'employee'],
  editableByRoles: ['admin', 'supervisor', 'employee'],
  departments: ['all'],
  templateDepartment: 'all',
  requiresApproval: true,
  layout: {
    sectionOrder: [],
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 40,
      right: 32,
      bottom: 40,
      left: 32
    }
  },
  pdfStyle: getDefaultPdfStyle(branding)
});

export const createField = (overrides = {}) => ({
  key: generateId('field'),
  label: { en: '', ar: '' },
  type: 'text',
  defaultValue: { en: '', ar: '' },
  required: false,
  placeholder: { en: '', ar: '' },
  options: [],
  order: 0,
  width: 'full',
  visible: true,
  pdfDisplay: {
    showLabel: true,
    showValue: true,
    fontSize: 14,
    bold: false,
    alignment: 'left'
  },
  layout: {},
  ...overrides
});

export const createColumn = (overrides = {}) => ({
  id: generateId('col'),
  label: { en: '', ar: '' },
  fieldKey: '',
  fieldType: 'text',
  width: 'auto',
  alignment: 'left',
  children: [],
  headerStyle: {
    backgroundColor: '#f3f4f6',
    textColor: '#111827',
    fontSize: 14,
    bold: true
  },
  ...overrides
});

export const getColumnChildren = (column) => (
  Array.isArray(column?.children)
    ? column.children.filter(Boolean)
    : []
);

export const getLeafTableColumns = (columns = []) => (
  columns.flatMap((column) => {
    const children = getColumnChildren(column);
    return children.length > 0 ? getLeafTableColumns(children) : [column];
  })
);

export const reindexFields = (fields = []) => fields.map((field, index) => ({
  ...field,
  order: index
}));

export const reindexSections = (sections = []) => sections.map((section, index) => ({
  ...section,
  order: index,
  fields: reindexFields(section.fields || [])
}));

export const createSectionFromPreset = (preset) => {
  const base = {
    id: generateId('section'),
    label: { en: '', ar: '' },
    fields: [],
    order: 0,
    visible: true,
    sectionType: 'normal',
    pdfStyle: getDefaultSectionPdfStyle(),
    advancedLayout: getDefaultAdvancedLayout()
  };

  switch (preset) {
    case 'columns':
      return {
        ...base,
        label: { en: 'Two Column Details', ar: 'تفاصيل بعمودين' },
        fields: [
          createField({ label: { en: 'Prepared by', ar: 'تم الإعداد بواسطة' }, width: 'half' }),
          createField({ label: { en: 'Department', ar: 'القسم' }, width: 'half' }),
          createField({ label: { en: 'Reference', ar: 'المرجع' }, width: 'half' }),
          createField({ label: { en: 'Date', ar: 'التاريخ' }, type: 'date', width: 'half' })
        ],
        advancedLayout: {
          ...getDefaultAdvancedLayout(),
          layoutType: 'columns',
          columns: {
            ...getDefaultAdvancedLayout().columns,
            enabled: true,
            columnCount: 2
          }
        }
      };
    case 'grid':
      return {
        ...base,
        label: { en: 'Summary Grid', ar: 'شبكة ملخص' },
        fields: [
          createField({ label: { en: 'Item', ar: 'العنصر' }, width: 'half' }),
          createField({
            label: { en: 'Status', ar: 'الحالة' },
            type: 'select',
            options: [{ en: 'Open', ar: 'مفتوح' }, { en: 'Closed', ar: 'مغلق' }],
            width: 'half'
          }),
          createField({ label: { en: 'Owner', ar: 'المسؤول' }, width: 'half' }),
          createField({ label: { en: 'Notes', ar: 'ملاحظات' }, type: 'textarea', width: 'full' })
        ],
        advancedLayout: {
          ...getDefaultAdvancedLayout(),
          layoutType: 'grid',
          grid: {
            ...getDefaultAdvancedLayout().grid,
            enabled: true,
            columns: 2,
            gap: 12
          }
        }
      };
    case 'table':
      return {
        ...base,
        label: { en: 'Table Section', ar: 'قسم جدول' },
        fields: [],
        advancedLayout: {
          ...getDefaultAdvancedLayout(),
          layoutType: 'table',
          table: {
            ...getDefaultAdvancedLayout().table,
            enabled: true,
            columns: [
              createColumn({ label: { en: 'Item', ar: 'العنصر' } }),
              createColumn({ label: { en: 'Description', ar: 'الوصف' } }),
              createColumn({ label: { en: 'Qty', ar: 'الكمية' }, fieldType: 'number', alignment: 'center' }),
              createColumn({ label: { en: 'Notes', ar: 'ملاحظات' } })
            ]
          }
        }
      };
    case 'static':
      return {
        ...base,
        label: { en: 'Fixed Text', ar: 'نص ثابت' },
        sectionType: 'notes',
        fields: [
          createField({
            label: { en: 'Text Block', ar: 'كتلة نص' },
            type: 'static_text',
            width: 'full',
            defaultValue: {
              en: 'Write a fixed text block here. This will print without any input field.',
              ar: 'اكتب هنا نصًا ثابتًا. سيظهر في الـ PDF بدون أي حقل إدخال.'
            },
            pdfDisplay: {
              showLabel: false,
              showValue: true,
              fontSize: 14,
              bold: false,
              alignment: 'left'
            }
          })
        ]
      };
    case 'notes':
      return {
        ...base,
        label: { en: 'Notes', ar: 'ملاحظات' },
        sectionType: 'notes',
        fields: [
          createField({ label: { en: 'Notes', ar: 'ملاحظات' }, type: 'textarea', width: 'full' })
        ]
      };
    case 'signatures':
      return {
        ...base,
        label: { en: 'Approval', ar: 'اعتماد' },
        sectionType: 'signature',
        fields: [
          createField({ label: { en: 'Prepared by', ar: 'أعد بواسطة' }, width: 'half' }),
          createField({ label: { en: 'Approved by', ar: 'اعتمد بواسطة' }, width: 'half' })
        ],
        advancedLayout: {
          ...getDefaultAdvancedLayout(),
          layoutType: 'columns',
          columns: {
            ...getDefaultAdvancedLayout().columns,
            enabled: true,
            columnCount: 2
          }
        }
      };
    default:
      return {
        ...base,
        label: { en: 'Information', ar: 'معلومات' },
        fields: [
          createField({ label: { en: 'Name', ar: 'الاسم' }, width: 'half' }),
          createField({ label: { en: 'Date', ar: 'التاريخ' }, type: 'date', width: 'half' }),
          createField({ label: { en: 'Details', ar: 'التفاصيل' }, type: 'textarea', width: 'full' })
        ]
      };
  }
};

export const STARTER_TEMPLATES = [
  {
    id: 'blank',
    name: { en: 'Blank Builder', ar: 'منشئ فارغ' },
    description: {
      en: 'Start empty and build section by section',
      ar: 'ابدأ من الصفر وأنشئ الأقسام خطوة بخطوة'
    },
    template: (branding) => getDefaultTemplate(branding)
  },
  {
    id: 'inspection',
    name: { en: 'Inspection Report', ar: 'تقرير تفتيش' },
    description: {
      en: 'Good for audit, checklist, and verification PDFs',
      ar: 'مناسب لتقارير التدقيق والقوائم والفحص'
    },
    template: (branding) => {
      const base = getDefaultTemplate(branding);
      const sections = [
        createSectionFromPreset('columns'),
        createSectionFromPreset('simple'),
        createSectionFromPreset('table'),
        createSectionFromPreset('notes'),
        createSectionFromPreset('signatures')
      ];
      sections[0].label = { en: 'Inspection Details', ar: 'تفاصيل التفتيش' };
      sections[1].label = { en: 'Findings', ar: 'الملاحظات' };
      return {
        ...base,
        title: { en: 'Inspection Report', ar: 'تقرير تفتيش' },
        description: { en: 'Inspection checklist and findings', ar: 'قائمة فحص وملاحظات' },
        sections: reindexSections(sections),
        layout: { ...base.layout, sectionOrder: sections.map((section) => section.id) }
      };
    }
  },
  {
    id: 'table',
    name: { en: 'Table Report', ar: 'تقرير جدولي' },
    description: {
      en: 'Fast starting point for printable tables with columns',
      ar: 'بداية سريعة للجداول القابلة للطباعة'
    },
    template: (branding) => {
      const base = getDefaultTemplate(branding);
      const sections = [createSectionFromPreset('table'), createSectionFromPreset('signatures')];
      sections[0].label = { en: 'Daily Entries', ar: 'إدخالات يومية' };
      return {
        ...base,
        title: { en: 'Table Report', ar: 'تقرير جدولي' },
        description: { en: 'Printable rows and approval area', ar: 'صفوف للطباعة مع مساحة اعتماد' },
        sections: reindexSections(sections),
        layout: { ...base.layout, sectionOrder: sections.map((section) => section.id) }
      };
    }
  },
  {
    id: 'letter',
    name: { en: 'Official Letter', ar: 'خطاب رسمي' },
    description: {
      en: 'Best for branded PDF letters and forms',
      ar: 'مناسب للخطابات والنماذج الرسمية'
    },
    template: (branding) => {
      const base = getDefaultTemplate(branding);
      const sections = [
        createSectionFromPreset('simple'),
        createSectionFromPreset('notes'),
        createSectionFromPreset('signatures')
      ];
      sections[0].label = { en: 'Recipient Details', ar: 'بيانات المستلم' };
      sections[1].label = { en: 'Letter Body', ar: 'نص الخطاب' };
      return {
        ...base,
        title: { en: 'Official Letter', ar: 'خطاب رسمي' },
        description: { en: 'Branded letter layout', ar: 'تنسيق خطاب بعلامة تجارية' },
        sections: reindexSections(sections),
        layout: { ...base.layout, sectionOrder: sections.map((section) => section.id) }
      };
    }
  }
];

export const getSampleValue = (fieldType, isRTL) => {
  switch (fieldType) {
    case 'static_text':
      return isRTL ? 'هذا نص ثابت داخل القالب.' : 'This is fixed text inside the template.';
    case 'textarea':
      return isRTL ? 'نص تجريبي يمكن أن يمتد على أكثر من سطر.' : 'Sample paragraph content that can span more than one line.';
    case 'number':
      return '125';
    case 'boolean':
      return isRTL ? 'نعم' : 'Yes';
    case 'select':
      return isRTL ? 'الخيار المختار' : 'Selected option';
    case 'date':
      return '2026-03-09';
    case 'time':
      return '08:30';
    case 'datetime':
      return '2026-03-09 08:30';
    case 'file':
      return isRTL ? 'مرفق.pdf' : 'attachment.pdf';
    default:
      return isRTL ? 'بيانات تجريبية' : 'Sample value';
  }
};

export const normalizeColumn = (column, index) => ({
  ...createColumn(),
  ...column,
  id: column?.id || generateId(`col_${index}`),
  label: normalizeLocalizedValue(column?.label),
  fieldType: column?.fieldType || 'text',
  width: column?.width || 'auto',
  alignment: column?.alignment || 'left',
  children: getColumnChildren(column).map((child, childIndex) => normalizeColumn(child, childIndex)),
  headerStyle: {
    ...createColumn().headerStyle,
    ...(column?.headerStyle || {})
  }
});

export const normalizeField = (field, index) => ({
  ...createField(),
  ...field,
  key: field?.key || generateId(`field_${index}`),
  label: normalizeLocalizedValue(field?.label),
  defaultValue: normalizeLocalizedValue(field?.defaultValue),
  placeholder: normalizeLocalizedValue(field?.placeholder),
  type: field?.type || 'text',
  options: Array.isArray(field?.options) ? field.options.map((option) => ({
    en: option?.en || '',
    ar: option?.ar || ''
  })) : [],
  order: index,
  width: field?.width || 'full',
  visible: field?.visible !== false,
  pdfDisplay: {
    ...createField().pdfDisplay,
    ...(field?.pdfDisplay || {})
  },
  layout: {
    ...(field?.layout || {})
  }
});

export const normalizeAdvancedLayout = (advancedLayout) => {
  const defaults = getDefaultAdvancedLayout();
  const next = {
    ...defaults,
    ...(advancedLayout || {}),
    table: {
      ...defaults.table,
      ...(advancedLayout?.table || {}),
      columns: Array.isArray(advancedLayout?.table?.columns)
        ? advancedLayout.table.columns.map(normalizeColumn)
        : defaults.table.columns,
      headerStyle: {
        ...defaults.table.headerStyle,
        ...(advancedLayout?.table?.headerStyle || {})
      },
      cellStyle: {
        ...defaults.table.cellStyle,
        ...(advancedLayout?.table?.cellStyle || {})
      }
    },
    columns: {
      ...defaults.columns,
      ...(advancedLayout?.columns || {})
    },
    grid: {
      ...defaults.grid,
      ...(advancedLayout?.grid || {})
    },
    spacing: {
      ...defaults.spacing,
      ...(advancedLayout?.spacing || {})
    },
    sizing: {
      ...defaults.sizing,
      ...(advancedLayout?.sizing || {})
    },
    padding: {
      ...defaults.padding,
      ...(advancedLayout?.padding || {})
    },
    margins: {
      ...defaults.margins,
      ...(advancedLayout?.margins || {})
    },
    styling: {
      ...defaults.styling,
      ...(advancedLayout?.styling || {})
    }
  };

  if (next.layoutType === 'table') {
    next.table.enabled = true;
  }
  if (next.layoutType === 'columns') {
    next.columns.enabled = true;
  }
  if (next.layoutType === 'grid') {
    next.grid.enabled = true;
  }

  return next;
};

export const normalizeSection = (section, index) => {
  const sortedFields = Array.isArray(section?.fields)
    ? [...section.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  return {
    ...createSectionFromPreset('simple'),
    ...section,
    id: section?.id || generateId(`section_${index}`),
    label: normalizeLocalizedValue(section?.label),
    fields: reindexFields(sortedFields.map(normalizeField)),
    order: index,
    visible: section?.visible !== false,
    sectionType: section?.sectionType || 'normal',
    pdfStyle: {
      ...getDefaultSectionPdfStyle(),
      ...(section?.pdfStyle || {})
    },
    advancedLayout: normalizeAdvancedLayout(section?.advancedLayout)
  };
};

export const normalizePdfStyle = (pdfStyle) => {
  const defaults = getDefaultPdfStyle();
  return {
    ...defaults,
    ...(pdfStyle || {}),
    branding: {
      ...defaults.branding,
      ...(pdfStyle?.branding || {}),
      watermarkSize: clampNumber(pdfStyle?.branding?.watermarkSize, defaults.branding.watermarkSize, 20, 100),
      watermarkOpacity: clampNumber(pdfStyle?.branding?.watermarkOpacity, defaults.branding.watermarkOpacity, 0, 100),
      companyName: normalizeLocalizedValue(pdfStyle?.branding?.companyName || defaults.branding.companyName),
      companyAddress: normalizeLocalizedValue(pdfStyle?.branding?.companyAddress || defaults.branding.companyAddress)
    },
    header: {
      ...defaults.header,
      ...(pdfStyle?.header || {}),
      logoSize: clampNumber(pdfStyle?.header?.logoSize, defaults.header.logoSize, 24, 160),
      subtitle: normalizeLocalizedValue(pdfStyle?.header?.subtitle || defaults.header.subtitle),
      border: {
        ...defaults.header.border,
        ...(pdfStyle?.header?.border || {})
      }
    },
    footer: {
      ...defaults.footer,
      ...(pdfStyle?.footer || {}),
      qrCodeSize: clampNumber(pdfStyle?.footer?.qrCodeSize, defaults.footer.qrCodeSize, 48, 160),
      template: normalizeFooterTemplate(pdfStyle?.footer?.template),
      content: normalizeLocalizedValue(pdfStyle?.footer?.content || defaults.footer.content),
      socialLinks: Array.isArray(pdfStyle?.footer?.socialLinks)
        ? pdfStyle.footer.socialLinks.map(normalizeSocialLink)
        : defaults.footer.socialLinks
    },
    metadata: {
      ...defaults.metadata,
      ...(pdfStyle?.metadata || {})
    },
    signature: {
      ...defaults.signature,
      ...(pdfStyle?.signature || {})
    },
    fontSize: {
      ...defaults.fontSize,
      ...(pdfStyle?.fontSize || {})
    },
    colors: {
      ...defaults.colors,
      ...(pdfStyle?.colors || {})
    },
    spacing: {
      ...defaults.spacing,
      ...(pdfStyle?.spacing || {})
    }
  };
};

export const normalizeTemplate = (template) => {
  const defaults = getDefaultTemplate();
  const inputSections = Array.isArray(template?.sections) ? template.sections : [];
  let orderedSections = inputSections;

  if (Array.isArray(template?.layout?.sectionOrder) && template.layout.sectionOrder.length > 0) {
    const sectionMap = new Map(inputSections.map((section) => [section.id, section]));
    orderedSections = template.layout.sectionOrder.map((sectionId) => sectionMap.get(sectionId)).filter(Boolean);
    inputSections.forEach((section) => {
      if (!orderedSections.some((item) => item.id === section.id)) {
        orderedSections.push(section);
      }
    });
  } else {
    orderedSections = [...inputSections].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  const sections = reindexSections(orderedSections.map(normalizeSection));
  const templateDepartment = Array.isArray(template?.departments) && template.departments.length > 0
    ? (template.departments.includes('all') ? 'all' : template.departments[0])
    : 'all';

  return {
    ...defaults,
    ...(template || {}),
    title: normalizeLocalizedValue(template?.title),
    description: normalizeLocalizedValue(template?.description),
    sections,
    departments: Array.isArray(template?.departments) && template.departments.length > 0 ? template.departments : ['all'],
    templateDepartment,
    layout: {
      ...defaults.layout,
      ...(template?.layout || {}),
      margins: {
        ...defaults.layout.margins,
        ...(template?.layout?.margins || {})
      },
      sectionOrder: sections.map((section) => section.id)
    },
    pdfStyle: normalizePdfStyle(template?.pdfStyle)
  };
};

export const finalizeFieldForSave = (field, index) => ({
  ...field,
  key: field.key || generateId(`field_${index}`),
  label: finalizeLocalizedValue(field.label),
  defaultValue: finalizeLocalizedValue(field.defaultValue),
  placeholder: finalizeLocalizedValue(field.placeholder),
  order: index,
  options: Array.isArray(field.options)
    ? field.options.filter((option) => option?.en || option?.ar).map(finalizeLocalizedValue)
    : []
});

const finalizeColumnForSave = (column, index) => ({
  ...normalizeColumn(column, index),
  label: finalizeLocalizedValue(column.label),
  children: getColumnChildren(column).map((child, childIndex) => finalizeColumnForSave(child, childIndex))
});

export const finalizeSectionForSave = (section, index) => {
  const layout = normalizeAdvancedLayout(section.advancedLayout);
  return {
    ...section,
    label: finalizeLocalizedValue(section.label),
    order: index,
    fields: reindexFields((section.fields || []).map(finalizeFieldForSave)),
    pdfStyle: {
      ...getDefaultSectionPdfStyle(),
      ...(section.pdfStyle || {})
    },
    advancedLayout: {
      ...layout,
      table: {
        ...layout.table,
        columns: (layout.table.columns || []).map((column, columnIndex) => finalizeColumnForSave(column, columnIndex))
      }
    }
  };
};

export const finalizeTemplateForSave = (template) => {
  const sections = reindexSections((template.sections || []).map(finalizeSectionForSave));
  const pdfStyle = normalizePdfStyle(template.pdfStyle);

  return {
    ...template,
    title: finalizeLocalizedValue(template.title),
    description: finalizeLocalizedValue(template.description),
    departments: template.templateDepartment === 'all' ? ['all'] : [template.templateDepartment],
    sections,
    layout: {
      ...template.layout,
      sectionOrder: sections.map((section) => section.id)
    },
    pdfStyle: {
      ...pdfStyle,
      branding: {
        ...pdfStyle.branding,
        companyName: finalizeLocalizedValue(template.pdfStyle?.branding?.companyName),
        companyAddress: finalizeLocalizedValue(template.pdfStyle?.branding?.companyAddress)
      },
      header: {
        ...pdfStyle.header,
        subtitle: finalizeLocalizedValue(template.pdfStyle?.header?.subtitle)
      },
      footer: {
        ...pdfStyle.footer,
        content: finalizeLocalizedValue(template.pdfStyle?.footer?.content),
        socialLinks: (pdfStyle.footer?.socialLinks || [])
          .map(finalizeSocialLinkForSave)
          .filter(Boolean)
      }
    }
  };
};
