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
  { value: 'image', label: 'Image', labelAr: 'صورة' },
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

const DEFAULT_PRIMARY_COLOR = '#01c853';
const DEFAULT_SECONDARY_COLOR = '#059669';
const FOOTER_TEMPLATE_VALUES = FOOTER_TEMPLATE_OPTIONS.map((option) => option.value);

const getDefaultBrandingName = (branding = {}) => branding?.displayName || branding?.shortName || 'AraRM';
const parseHexColor = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  let normalized = value.trim().replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map((char) => `${char}${char}`).join('');
  }

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
};

const withAlpha = (color, alpha, fallback) => {
  const rgb = parseHexColor(color);

  if (!rgb) {
    return fallback;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

export const getSystemPdfPalette = (branding = {}) => {
  const primaryColor = branding?.primaryColor || DEFAULT_PRIMARY_COLOR;
  const secondaryColor = branding?.secondaryColor || DEFAULT_SECONDARY_COLOR;

  return {
    primaryColor,
    secondaryColor,
    borderColor: withAlpha(primaryColor, 0.2, '#a7f3d0'),
    backgroundColor: '#ffffff',
    textColor: '#111827',
    headerBackgroundColor: withAlpha(primaryColor, 0.08, '#ecfdf5'),
    headerTextColor: secondaryColor,
    footerBackgroundColor: secondaryColor,
    footerTextColor: '#ffffff'
  };
};

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

const buildSampleImageDataUrl = (isRTL) => {
  const title = isRTL ? 'معاينة صورة' : 'Image Preview';
  const subtitle = isRTL ? 'مثال افتراضي' : 'Sample Placeholder';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ecfdf5" />
          <stop offset="100%" stop-color="#f3f4f6" />
        </linearGradient>
      </defs>
      <rect width="640" height="420" rx="28" fill="url(#bg)" />
      <rect x="32" y="32" width="576" height="356" rx="24" fill="#ffffff" stroke="#d1d5db" stroke-width="3" />
      <circle cx="190" cy="168" r="46" fill="#01c853" opacity="0.35" />
      <path d="M104 302l104-92 72 58 88-96 168 130H104z" fill="#01c853" opacity="0.7" />
      <text x="320" y="118" text-anchor="middle" font-size="34" font-family="Arial, sans-serif" font-weight="700" fill="#111827">${title}</text>
      <text x="320" y="154" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" fill="#6b7280">${subtitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

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
  } = getSystemPdfPalette(branding);
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
      backgroundColor: headerBackgroundColor,
      textColor: headerTextColor,
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
      backgroundColor: footerBackgroundColor,
      textColor: footerTextColor,
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
      text: textColor,
      border: borderColor,
      background: backgroundColor
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

export const getDefaultFieldLayout = () => ({
  width: 'auto',
  height: 'auto',
  padding: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  margin: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  alignment: 'left',
  lineSpacing: 1.2,
  fontSize: 10,
  imageWidth: 220,
  imageHeight: 160,
  objectFit: 'cover',
  borderRadius: 16,
  borderWidth: 0,
  borderColor: '#d1d5db',
  backgroundColor: '#f8fafc',
  shadow: false
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
  layout: getDefaultFieldLayout(),
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

const createStarterLabel = (en, ar) => ({ en, ar });

const createStarterField = (en, ar, overrides = {}) => createField({
  label: createStarterLabel(en, ar),
  ...overrides
});

const createStarterColumn = (en, ar, overrides = {}) => createColumn({
  label: createStarterLabel(en, ar),
  ...overrides
});

const buildColumnsLayout = (overrides = {}) => {
  const defaults = getDefaultAdvancedLayout();

  return {
    ...defaults,
    ...overrides,
    layoutType: 'columns',
    columns: {
      ...defaults.columns,
      enabled: true,
      columnCount: 2,
      ...(overrides.columns || {})
    },
    spacing: {
      ...defaults.spacing,
      ...(overrides.spacing || {})
    },
    styling: {
      ...defaults.styling,
      ...(overrides.styling || {})
    }
  };
};

const buildGridLayout = (overrides = {}) => {
  const defaults = getDefaultAdvancedLayout();

  return {
    ...defaults,
    ...overrides,
    layoutType: 'grid',
    grid: {
      ...defaults.grid,
      enabled: true,
      columns: 2,
      ...(overrides.grid || {})
    },
    spacing: {
      ...defaults.spacing,
      ...(overrides.spacing || {})
    },
    styling: {
      ...defaults.styling,
      ...(overrides.styling || {})
    }
  };
};

const buildTableLayout = (columns, overrides = {}) => {
  const defaults = getDefaultAdvancedLayout();

  return {
    ...defaults,
    ...overrides,
    layoutType: 'table',
    table: {
      ...defaults.table,
      enabled: true,
      columns,
      ...(overrides.table || {})
    },
    spacing: {
      ...defaults.spacing,
      ...(overrides.spacing || {})
    },
    styling: {
      ...defaults.styling,
      ...(overrides.styling || {})
    }
  };
};

const createBusinessPdfStyle = ({
  subtitle,
  footerContent,
  footerTemplate = 'contact',
  showShift = true,
  showPhoneNumber = true,
  showSocialIcons = true
} = {}) => ({
  header: {
    showCompanyName: true,
    showCompanyAddress: true,
    showDate: true,
    ...(subtitle ? {
      showSubtitle: true,
      subtitle
    } : {})
  },
  footer: {
    enabled: true,
    template: footerTemplate,
    showCompanyInfo: true,
    showPageNumbers: true,
    showPhoneNumber,
    showSocialIcons,
    ...(footerContent ? { content: footerContent } : {})
  },
  metadata: {
    enabled: true,
    showFormId: true,
    showDate: true,
    showShift,
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
  }
});

const buildStarterTemplate = (base, {
  title,
  description,
  sections,
  pdfStyle = {},
  layout = {},
  ...overrides
}) => ({
  ...base,
  ...overrides,
  title,
  description,
  sections: reindexSections(sections),
  layout: {
    ...base.layout,
    ...layout,
    margins: {
      ...base.layout.margins,
      ...(layout.margins || {})
    },
    sectionOrder: sections.map((section) => section.id)
  },
  pdfStyle
});

export const STARTER_TEMPLATES = [
  {
    id: 'blank',
    name: { en: 'Blank Business Template', ar: 'قالب أعمال فارغ' },
    description: {
      en: 'Start with your current branding and build a professional template from scratch',
      ar: 'ابدأ بهوية منظمتك الحالية وأنشئ قالباً احترافياً من الصفر'
    },
    template: (branding) => ({
      ...getDefaultTemplate(branding),
      pdfStyle: {}
    })
  },
  {
    id: 'operations_review',
    name: { en: 'Daily Operations Review', ar: 'مراجعة العمليات اليومية' },
    description: {
      en: 'Structured shift handover with KPIs, action items, notes, and leadership review',
      ar: 'تسليم وردية منظم مع مؤشرات أداء وبنود متابعة وملاحظات ومراجعة إدارية'
    },
    template: (branding) => {
      const base = getDefaultTemplate(branding);
      const sections = [
        {
          ...createSectionFromPreset('columns'),
          label: createStarterLabel('Shift Overview', 'ملخص الوردية'),
          fields: [
            createStarterField('Prepared by', 'أعده', { width: 'half' }),
            createStarterField('Department lead', 'مسؤول القسم', { width: 'half' }),
            createStarterField('Location / branch', 'الموقع / الفرع', { width: 'half' }),
            createStarterField('Review date', 'تاريخ المراجعة', { type: 'date', width: 'half' }),
            createStarterField('Shift status', 'حالة الوردية', {
              type: 'select',
              width: 'half',
              options: [
                createStarterLabel('On track', 'تسير كما ينبغي'),
                createStarterLabel('Needs attention', 'تحتاج متابعة'),
                createStarterLabel('Escalated', 'تم التصعيد')
              ]
            }),
            createStarterField('Key focus', 'المحور الرئيسي', { width: 'half' })
          ],
          advancedLayout: buildColumnsLayout({
            columns: {
              columnCount: 2,
              columnGap: 16
            }
          })
        },
        {
          ...createSectionFromPreset('grid'),
          label: createStarterLabel('Operational Snapshot', 'لقطة تشغيلية'),
          fields: [
            createStarterField('Customer volume', 'حجم العملاء', { type: 'number' }),
            createStarterField('Staffing level', 'مستوى التغطية', {
              type: 'select',
              options: [
                createStarterLabel('Fully staffed', 'التغطية مكتملة'),
                createStarterLabel('Tight coverage', 'التغطية محدودة'),
                createStarterLabel('Understaffed', 'نقص في الطاقم')
              ]
            }),
            createStarterField('Stock status', 'حالة المخزون', {
              type: 'select',
              options: [
                createStarterLabel('Healthy', 'جيد'),
                createStarterLabel('Watch list', 'بحاجة متابعة'),
                createStarterLabel('Critical', 'حرج')
              ]
            }),
            createStarterField('Equipment ready', 'جاهزية المعدات', { type: 'boolean' }),
            createStarterField('Service blockers', 'معوقات الخدمة', { type: 'textarea' }),
            createStarterField('Immediate priorities', 'الأولويات الفورية', { type: 'textarea' })
          ],
          advancedLayout: buildGridLayout({
            grid: {
              columns: 2,
              gap: 16
            }
          })
        },
        {
          ...createSectionFromPreset('table'),
          label: createStarterLabel('Action Items', 'بنود الإجراءات'),
          fields: [],
          advancedLayout: buildTableLayout([
            createStarterColumn('Action item', 'الإجراء المطلوب'),
            createStarterColumn('Owner', 'المسؤول'),
            createStarterColumn('Due date', 'تاريخ الاستحقاق', {
              fieldType: 'date',
              alignment: 'center'
            }),
            createStarterColumn('Status', 'الحالة', {
              fieldType: 'text',
              alignment: 'center'
            }),
            createStarterColumn('Notes', 'ملاحظات', {
              fieldType: 'textarea'
            })
          ], {
            table: {
              numberOfRows: 5,
              stripedRows: true
            }
          })
        },
        {
          ...createSectionFromPreset('simple'),
          label: createStarterLabel('Manager Notes', 'ملاحظات المدير'),
          fields: [
            createStarterField('Key observations', 'الملاحظات الرئيسية', { type: 'textarea', width: 'full' }),
            createStarterField('Support needed', 'الدعم المطلوب', { type: 'textarea', width: 'full' }),
            createStarterField('Supporting attachment', 'مرفق داعم', { type: 'file', width: 'full' })
          ]
        },
        {
          ...createSectionFromPreset('signatures'),
          label: createStarterLabel('Leadership Review', 'مراجعة الإدارة'),
          fields: [
            createStarterField('Prepared by', 'أعد بواسطة', { width: 'half' }),
            createStarterField('Reviewed by', 'راجع بواسطة', { width: 'half' })
          ],
          advancedLayout: buildColumnsLayout({
            columns: {
              columnCount: 2,
              columnGap: 20
            }
          })
        }
      ];

      return buildStarterTemplate(base, {
        title: createStarterLabel('Daily Operations Review', 'مراجعة العمليات اليومية'),
        description: createStarterLabel(
          'Business-ready shift review with operational metrics, follow-up actions, and sign-off',
          'مراجعة وردية جاهزة للأعمال مع مؤشرات تشغيلية وإجراءات متابعة واعتماد'
        ),
        sections,
        pdfStyle: createBusinessPdfStyle({
          subtitle: createStarterLabel(
            'Operations handover and accountability log',
            'سجل تسليم العمليات والمتابعة'
          ),
          footerTemplate: 'contact',
          footerContent: createStarterLabel(
            'Internal operations review. Track actions to closure.',
            'مراجعة تشغيلية داخلية. تابع الإجراءات حتى الإغلاق.'
          ),
          showShift: true,
          showPhoneNumber: true,
          showSocialIcons: true
        })
      });
    }
  },
  {
    id: 'purchase_request',
    name: { en: 'Purchase Request', ar: 'طلب شراء' },
    description: {
      en: 'Formal request layout for materials or services with item lines and approvals',
      ar: 'تنسيق رسمي لطلب المواد أو الخدمات مع بنود الشراء والاعتمادات'
    },
    template: (branding) => {
      const base = getDefaultTemplate(branding);
      const sections = [
        {
          ...createSectionFromPreset('columns'),
          label: createStarterLabel('Request Summary', 'ملخص الطلب'),
          fields: [
            createStarterField('Requestor name', 'اسم مقدم الطلب', { width: 'half' }),
            createStarterField('Request date', 'تاريخ الطلب', { type: 'date', width: 'half' }),
            createStarterField('Department', 'القسم', { width: 'half' }),
            createStarterField('Needed by', 'مطلوب قبل', { type: 'date', width: 'half' }),
            createStarterField('Cost center / project', 'مركز التكلفة / المشروع', { width: 'half' }),
            createStarterField('Priority', 'الأولوية', {
              type: 'select',
              width: 'half',
              options: [
                createStarterLabel('Routine', 'اعتيادية'),
                createStarterLabel('High', 'مرتفعة'),
                createStarterLabel('Urgent', 'عاجلة')
              ]
            }),
            createStarterField('Preferred vendor', 'المورد المفضل', { width: 'half' }),
            createStarterField('Delivery location', 'مكان التسليم', { width: 'half' })
          ],
          advancedLayout: buildColumnsLayout({
            columns: {
              columnCount: 2,
              columnGap: 16
            }
          })
        },
        {
          ...createSectionFromPreset('simple'),
          label: createStarterLabel('Business Justification', 'مبرر الطلب'),
          fields: [
            createStarterField('Business need', 'الحاجة التشغيلية', { type: 'textarea', width: 'full' }),
            createStarterField('Estimated total', 'التكلفة التقديرية', { type: 'number', width: 'half' }),
            createStarterField('Budget code', 'رمز الميزانية', { width: 'half' }),
            createStarterField('Supporting quotation', 'عرض السعر المرفق', { type: 'file', width: 'full' })
          ]
        },
        {
          ...createSectionFromPreset('table'),
          label: createStarterLabel('Requested Items', 'بنود الطلب'),
          fields: [],
          advancedLayout: buildTableLayout([
            createStarterColumn('Item', 'البند'),
            createStarterColumn('Specification', 'المواصفة'),
            createStarterColumn('Qty', 'الكمية', {
              fieldType: 'number',
              alignment: 'center'
            }),
            createStarterColumn('Pricing', 'التسعير', {
              alignment: 'center',
              children: [
                createStarterColumn('Unit cost', 'سعر الوحدة', {
                  fieldType: 'number',
                  alignment: 'right'
                }),
                createStarterColumn('Line total', 'إجمالي البند', {
                  fieldType: 'number',
                  alignment: 'right'
                })
              ]
            }),
            createStarterColumn('Needed by', 'مطلوب قبل', {
              fieldType: 'date',
              alignment: 'center'
            })
          ], {
            table: {
              numberOfRows: 6,
              stripedRows: true
            }
          })
        },
        {
          ...createSectionFromPreset('grid'),
          label: createStarterLabel('Budget Summary', 'ملخص الميزانية'),
          sectionType: 'totals',
          fields: [
            createStarterField('Requested amount', 'المبلغ المطلوب', { type: 'number' }),
            createStarterField('Budget available', 'الميزانية متوفرة', { type: 'boolean' }),
            createStarterField('Approval level', 'مستوى الاعتماد', {
              type: 'select',
              options: [
                createStarterLabel('Department manager', 'مدير القسم'),
                createStarterLabel('Finance', 'المالية'),
                createStarterLabel('Executive', 'الإدارة التنفيذية')
              ]
            }),
            createStarterField('Payment terms', 'شروط الدفع')
          ],
          advancedLayout: buildGridLayout({
            grid: {
              columns: 2,
              gap: 16
            }
          })
        },
        {
          ...createSectionFromPreset('columns'),
          label: createStarterLabel('Approval Chain', 'سلسلة الاعتماد'),
          fields: [
            createStarterField('Requested by', 'مقدم الطلب', { width: 'half' }),
            createStarterField('Department approval', 'اعتماد القسم', { width: 'half' }),
            createStarterField('Finance approval', 'اعتماد المالية', { width: 'half' }),
            createStarterField('Procurement reference', 'مرجع المشتريات', { width: 'half' }),
            createStarterField('Final comments', 'ملاحظات نهائية', { type: 'textarea', width: 'full' })
          ],
          advancedLayout: buildColumnsLayout({
            columns: {
              columnCount: 2,
              columnGap: 18
            }
          })
        }
      ];

      return buildStarterTemplate(base, {
        title: createStarterLabel('Purchase Request', 'طلب شراء'),
        description: createStarterLabel(
          'Procurement-ready request with line items, budget summary, and approval flow',
          'طلب جاهز للمشتريات مع بنود تفصيلية وملخص ميزانية ومسار اعتماد'
        ),
        sections,
        layout: {
          orientation: 'landscape',
          margins: {
            left: 24,
            right: 24
          }
        },
        pdfStyle: createBusinessPdfStyle({
          subtitle: createStarterLabel(
            'Procurement and spend approval request',
            'طلب مشتريات واعتماد إنفاق'
          ),
          footerTemplate: 'classic',
          footerContent: createStarterLabel(
            'Procurement request. Approval required before commitment.',
            'طلب مشتريات. يلزم الاعتماد قبل الالتزام بالشراء.'
          ),
          showShift: false,
          showPhoneNumber: false,
          showSocialIcons: false
        })
      });
    }
  },
  {
    id: 'incident_report',
    name: { en: 'Incident Report', ar: 'تقرير حادث' },
    description: {
      en: 'Capture incident details, evidence, corrective actions, and closure follow-up',
      ar: 'توثيق تفاصيل الحادث والأدلة والإجراءات التصحيحية ومتابعة الإغلاق'
    },
    template: (branding) => {
      const base = getDefaultTemplate(branding);
      const sections = [
        {
          ...createSectionFromPreset('columns'),
          label: createStarterLabel('Incident Overview', 'ملخص الحادث'),
          fields: [
            createStarterField('Reported by', 'أبلغ عنه', { width: 'half' }),
            createStarterField('Incident date & time', 'تاريخ ووقت الحادث', { type: 'datetime', width: 'half' }),
            createStarterField('Department', 'القسم', { width: 'half' }),
            createStarterField('Location', 'الموقع', { width: 'half' }),
            createStarterField('Incident type', 'نوع الحادث', {
              type: 'select',
              width: 'half',
              options: [
                createStarterLabel('Safety', 'سلامة'),
                createStarterLabel('Quality', 'جودة'),
                createStarterLabel('Service', 'خدمة'),
                createStarterLabel('Security', 'أمن'),
                createStarterLabel('Other', 'أخرى')
              ]
            }),
            createStarterField('Severity', 'الخطورة', {
              type: 'select',
              width: 'half',
              options: [
                createStarterLabel('Low', 'منخفضة'),
                createStarterLabel('Moderate', 'متوسطة'),
                createStarterLabel('High', 'مرتفعة'),
                createStarterLabel('Critical', 'حرجة')
              ]
            })
          ],
          advancedLayout: buildColumnsLayout({
            columns: {
              columnCount: 2,
              columnGap: 16
            }
          })
        },
        {
          ...createSectionFromPreset('simple'),
          label: createStarterLabel('Incident Description', 'وصف الحادث'),
          fields: [
            createStarterField('What happened', 'ماذا حدث', { type: 'textarea', width: 'full' }),
            createStarterField('Immediate response', 'الإجراء الفوري', { type: 'textarea', width: 'full' }),
            createStarterField('People involved', 'الأشخاص المعنيون', { width: 'half' }),
            createStarterField('External impact', 'هل يوجد أثر خارجي', { type: 'boolean', width: 'half' })
          ]
        },
        {
          ...createSectionFromPreset('grid'),
          label: createStarterLabel('Evidence and Impact', 'الأدلة والأثر'),
          fields: [
            createStarterField('Photo evidence', 'صور مرفقة', { type: 'image' }),
            createStarterField('Supporting document', 'مستند داعم', { type: 'file' }),
            createStarterField('Customer impact', 'أثر على العميل', {
              type: 'select',
              options: [
                createStarterLabel('None', 'لا يوجد'),
                createStarterLabel('Minor', 'محدود'),
                createStarterLabel('Significant', 'كبير')
              ]
            }),
            createStarterField('Estimated loss', 'الخسارة التقديرية', { type: 'number' })
          ],
          advancedLayout: buildGridLayout({
            grid: {
              columns: 2,
              gap: 16
            }
          })
        },
        {
          ...createSectionFromPreset('table'),
          label: createStarterLabel('Corrective Actions', 'الإجراءات التصحيحية'),
          fields: [],
          advancedLayout: buildTableLayout([
            createStarterColumn('Action', 'الإجراء'),
            createStarterColumn('Owner', 'المسؤول'),
            createStarterColumn('Due date', 'تاريخ الاستحقاق', {
              fieldType: 'date',
              alignment: 'center'
            }),
            createStarterColumn('Status', 'الحالة', {
              fieldType: 'text',
              alignment: 'center'
            }),
            createStarterColumn('Verification notes', 'ملاحظات التحقق', {
              fieldType: 'textarea'
            })
          ], {
            table: {
              numberOfRows: 5,
              stripedRows: true
            }
          })
        },
        {
          ...createSectionFromPreset('simple'),
          label: createStarterLabel('Follow-up Review', 'مراجعة المتابعة'),
          fields: [
            createStarterField('Root cause summary', 'ملخص السبب الجذري', { type: 'textarea', width: 'full' }),
            createStarterField('Preventive action summary', 'ملخص الإجراء الوقائي', { type: 'textarea', width: 'full' }),
            createStarterField('Reviewed by', 'راجع بواسطة', { width: 'half' }),
            createStarterField('Closure date', 'تاريخ الإغلاق', { type: 'date', width: 'half' })
          ]
        }
      ];

      return buildStarterTemplate(base, {
        title: createStarterLabel('Incident Report', 'تقرير حادث'),
        description: createStarterLabel(
          'Professional incident capture with evidence, corrective actions, and closure notes',
          'توثيق احترافي للحوادث مع الأدلة والإجراءات التصحيحية وملاحظات الإغلاق'
        ),
        sections,
        pdfStyle: createBusinessPdfStyle({
          subtitle: createStarterLabel(
            'Incident capture, response, and follow-up record',
            'سجل توثيق الحادث والاستجابة والمتابعة'
          ),
          footerTemplate: 'minimal',
          footerContent: createStarterLabel(
            'Confidential incident documentation. Share on a need-to-know basis.',
            'توثيق حادث سري. يشارك عند الحاجة فقط.'
          ),
          showShift: true,
          showPhoneNumber: false,
          showSocialIcons: false
        })
      });
    }
  },
  {
    id: 'manufactured_dessert_products',
    name: { en: 'Manufactured Dessert Products', ar: 'نموذج منتجات الحلا المصنعة' },
    description: {
      en: 'Single bilingual table for tracking daily manufactured dessert products',
      ar: 'جدول ثنائي اللغة لمتابعة منتجات الحلا المصنعة يومياً'
    },
    template: (branding) => {
      const base = getDefaultTemplate(branding);
      const sections = [
        {
          ...createSectionFromPreset('table'),
          label: createStarterLabel('Dessert Products Table', 'جدول منتجات الحلا'),
          fields: [],
          advancedLayout: buildTableLayout([
            createStarterColumn('Date', 'التاريخ', {
              fieldType: 'date',
              alignment: 'center'
            }),
            createStarterColumn('Day', 'اليوم', {
              alignment: 'center'
            }),
            createStarterColumn('Unit', 'الوحدة', {
              alignment: 'center'
            }),
            createStarterColumn('Items', 'الأصناف'),
            createStarterColumn('Sold', 'المباع', {
              fieldType: 'number',
              alignment: 'center'
            }),
            createStarterColumn('Remaining', 'المتبقي', {
              fieldType: 'number',
              alignment: 'center'
            }),
            createStarterColumn('Expiration Date', 'تاريخ الانتهاء', {
              fieldType: 'date',
              alignment: 'center'
            })
          ], {
            table: {
              numberOfRows: 12,
              stripedRows: true
            },
            styling: {
              showTitle: false
            }
          })
        }
      ];

      return buildStarterTemplate(base, {
        title: createStarterLabel('Manufactured Dessert Products', 'نموذج منتجات الحلا المصنعة'),
        description: createStarterLabel(
          'Daily product movement sheet with sold, remaining, and expiration tracking',
          'نموذج يومي لحركة المنتجات مع متابعة المباع والمتبقي وتاريخ الانتهاء'
        ),
        sections,
        layout: {
          orientation: 'landscape',
          margins: {
            top: 28,
            right: 24,
            bottom: 28,
            left: 24
          }
        },
        pdfStyle: {
          header: {
            showSubtitle: false
          },
          footer: {
            template: 'minimal'
          },
          metadata: {
            enabled: false
          },
          signature: {
            enabled: false
          }
        }
      });
    }
  },
  {
    id: 'waste_sheet',
    name: { en: 'Waste Sheet', ar: 'نموذج الهالك' },
    description: {
      en: 'Bilingual waste tracking table with prepared-by and approved-by sign-off',
      ar: 'جدول ثنائي اللغة لمتابعة الهالك مع اعتماد تم الإعداد بواسطة وتمت الموافقة بواسطة'
    },
    template: (branding) => {
      const base = getDefaultTemplate(branding);
      const sections = [
        {
          ...createSectionFromPreset('table'),
          label: createStarterLabel('Waste Table', 'نموذج الهالك'),
          fields: [],
          advancedLayout: buildTableLayout([
            createStarterColumn('Date', 'التاريخ', {
              fieldType: 'date',
              alignment: 'center'
            }),
            createStarterColumn('Item Name', 'اسم الصنف'),
            createStarterColumn('Unit', 'الوحدة', {
              alignment: 'center'
            }),
            createStarterColumn('Quantity', 'الكمية', {
              fieldType: 'number',
              alignment: 'center'
            }),
            createStarterColumn('Reason', 'السبب', {
              fieldType: 'textarea'
            })
          ], {
            table: {
              numberOfRows: 12,
              stripedRows: true
            },
            styling: {
              showTitle: false
            }
          })
        }
      ];

      return buildStarterTemplate(base, {
        title: createStarterLabel('Waste Sheet', 'نموذج الهالك'),
        description: createStarterLabel(
          'Waste register with item, quantity, and reason tracking',
          'سجل هدر لمتابعة الصنف والكمية وسبب الهالك'
        ),
        sections,
        layout: {
          orientation: 'portrait',
          margins: {
            top: 28,
            right: 24,
            bottom: 28,
            left: 24
          }
        },
        pdfStyle: {
          header: {
            showSubtitle: false
          },
          footer: {
            template: 'minimal'
          },
          metadata: {
            enabled: false
          },
          signature: {
            enabled: true,
            showPreparedBy: true,
            showApprovedBy: true
          }
        }
      });
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
    case 'image':
      return buildSampleImageDataUrl(isRTL);
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
    ...getDefaultFieldLayout(),
    ...(field?.layout || {}),
    padding: {
      ...getDefaultFieldLayout().padding,
      ...(field?.layout?.padding || {})
    },
    margin: {
      ...getDefaultFieldLayout().margin,
      ...(field?.layout?.margin || {})
    }
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
      watermarkSize: clampNumber(pdfStyle?.branding?.watermarkSize, defaults.branding.watermarkSize, 0, 100),
      watermarkOpacity: clampNumber(pdfStyle?.branding?.watermarkOpacity, defaults.branding.watermarkOpacity, 0, 100),
      companyName: normalizeLocalizedValue(pdfStyle?.branding?.companyName || defaults.branding.companyName),
      companyAddress: normalizeLocalizedValue(pdfStyle?.branding?.companyAddress || defaults.branding.companyAddress)
    },
    header: {
      ...defaults.header,
      ...(pdfStyle?.header || {}),
      logoSize: clampNumber(pdfStyle?.header?.logoSize, defaults.header.logoSize, 0, 160),
      subtitle: normalizeLocalizedValue(pdfStyle?.header?.subtitle || defaults.header.subtitle),
      border: {
        ...defaults.header.border,
        ...(pdfStyle?.header?.border || {})
      }
    },
    footer: {
      ...defaults.footer,
      ...(pdfStyle?.footer || {}),
      qrCodeSize: clampNumber(pdfStyle?.footer?.qrCodeSize, defaults.footer.qrCodeSize, 0, 160),
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
  const {
    _id,
    id,
    organizationId,
    createdBy,
    createdAt,
    updatedAt,
    subscriptionAccess,
    __v,
    ...templatePayload
  } = template || {};
  const sections = reindexSections((template.sections || []).map(finalizeSectionForSave));
  const pdfStyle = normalizePdfStyle(template.pdfStyle);

  return {
    ...templatePayload,
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
