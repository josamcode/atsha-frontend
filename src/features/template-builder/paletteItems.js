import {
  FaHeading,
  FaInfoCircle,
  FaLayerGroup,
  FaTable,
  FaSignature,
  FaWindowMinimize,
  FaFont,
  FaMinus,
  FaArrowsAltV,
  FaImage,
  FaQrcode,
  FaStamp,
  FaTint,
  FaFileExport,
  FaColumns
} from 'react-icons/fa';

/**
 * Component palette definition.
 *
 * Each entry describes one thing an author can put on the page. `singleton`
 * marks the blocks a document may only contain once (there is one header, one
 * footer, one watermark), and `overlay` marks the ones that leave the flow and
 * float freely on the sheet.
 */
const PALETTE_GROUPS = [
  {
    id: 'content',
    label: { en: 'Content', ar: 'المحتوى' },
    items: [
      {
        type: 'section',
        icon: FaLayerGroup,
        label: { en: 'Section', ar: 'قسم' },
        hint: { en: 'A titled group of fields', ar: 'مجموعة حقول بعنوان' },
        defaultW: 24
      },
      {
        type: 'section',
        variant: 'table',
        icon: FaTable,
        label: { en: 'Table section', ar: 'قسم جدول' },
        hint: { en: 'Rows and columns, grouped headers supported', ar: 'صفوف وأعمدة مع دعم الرؤوس المجمّعة' },
        defaultW: 24
      },
      {
        type: 'section',
        variant: 'columns',
        icon: FaColumns,
        label: { en: 'Two column section', ar: 'قسم بعمودين' },
        hint: { en: 'Fields laid out side by side', ar: 'حقول متجاورة' },
        defaultW: 24
      },
      {
        type: 'text',
        icon: FaFont,
        label: { en: 'Text', ar: 'نص' },
        hint: { en: 'Free paragraph or note', ar: 'فقرة أو ملاحظة حرة' },
        defaultW: 24
      }
    ]
  },
  {
    id: 'structure',
    label: { en: 'Structure', ar: 'الهيكل' },
    items: [
      {
        type: 'header',
        icon: FaHeading,
        singleton: true,
        label: { en: 'Document header', ar: 'ترويسة المستند' },
        hint: { en: 'Repeats at the top of every page', ar: 'تتكرر أعلى كل صفحة' },
        defaultW: 24
      },
      {
        type: 'metadata',
        icon: FaInfoCircle,
        singleton: true,
        label: { en: 'Form details', ar: 'بيانات النموذج' },
        hint: { en: 'Form id, date, shift, department…', ar: 'رقم النموذج والتاريخ والوردية والقسم…' },
        defaultW: 24
      },
      {
        type: 'signature',
        icon: FaSignature,
        singleton: true,
        label: { en: 'Signatures', ar: 'التوقيعات' },
        hint: { en: 'Prepared by / approved by rules', ar: 'خانات الإعداد والاعتماد' },
        defaultW: 24
      },
      {
        type: 'footer',
        icon: FaWindowMinimize,
        singleton: true,
        label: { en: 'Document footer', ar: 'تذييل المستند' },
        hint: { en: 'Repeats at the bottom of every page', ar: 'يتكرر أسفل كل صفحة' },
        defaultW: 24
      },
      {
        type: 'divider',
        icon: FaMinus,
        label: { en: 'Divider', ar: 'فاصل' },
        hint: { en: 'A horizontal rule', ar: 'خط أفقي' },
        defaultW: 24
      },
      {
        type: 'spacer',
        icon: FaArrowsAltV,
        label: { en: 'Spacer', ar: 'مسافة' },
        hint: { en: 'Fixed vertical gap', ar: 'مسافة رأسية ثابتة' },
        defaultW: 24
      },
      {
        type: 'pageBreak',
        icon: FaFileExport,
        label: { en: 'Page break', ar: 'فاصل صفحات' },
        hint: { en: 'Start the next block on a new page', ar: 'ابدأ العنصر التالي في صفحة جديدة' },
        defaultW: 24
      }
    ]
  },
  {
    id: 'media',
    label: { en: 'Media & marks', ar: 'الوسائط والعلامات' },
    items: [
      {
        type: 'image',
        icon: FaImage,
        label: { en: 'Image', ar: 'صورة' },
        hint: { en: 'Logo, photo or diagram', ar: 'شعار أو صورة أو رسم' },
        defaultW: 8
      },
      {
        type: 'qr',
        icon: FaQrcode,
        label: { en: 'QR code', ar: 'رمز QR' },
        hint: { en: 'Encodes any link or reference', ar: 'يرمّز أي رابط أو مرجع' },
        defaultW: 6
      },
      {
        type: 'stamp',
        icon: FaStamp,
        label: { en: 'Stamp', ar: 'ختم' },
        hint: { en: 'Floats freely on the page', ar: 'يتحرك بحرية فوق الصفحة' },
        overlay: true,
        defaultW: 6
      },
      {
        type: 'watermark',
        icon: FaTint,
        singleton: true,
        overlay: true,
        label: { en: 'Watermark', ar: 'علامة مائية' },
        hint: { en: 'Behind the content of every page', ar: 'خلف محتوى كل صفحة' },
        defaultW: 24
      }
    ]
  }
];

const PALETTE_ITEMS = PALETTE_GROUPS.flatMap((group) => group.items);

const defaultColumn = (id, en, ar, width, fieldType, alignment) => ({
  id,
  label: { en, ar },
  fieldKey: '',
  fieldType,
  width,
  alignment,
  children: [],
  headerStyle: { backgroundColor: '#f3f4f6', textColor: '#111827', fontSize: 12, bold: true }
});

const defaultField = (key, en, ar, x) => ({
  key,
  label: { en, ar },
  type: 'text',
  defaultValue: { en: '', ar: '' },
  placeholder: { en: '', ar: '' },
  options: [],
  required: false,
  order: x === 0 ? 0 : 1,
  width: 'half',
  grid: { x, w: 12, row: 0 },
  visible: true,
  pdfDisplay: { showLabel: true, showValue: true, fontSize: 10, bold: false, alignment: 'left' },
  layout: {
    width: 'auto',
    height: 'auto',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    alignment: 'left',
    lineSpacing: 1.3,
    fontSize: 10,
    imageWidth: 220,
    imageHeight: 160,
    objectFit: 'cover',
    borderRadius: 8,
    borderWidth: 0,
    borderColor: '#d1d5db',
    backgroundColor: '#f8fafc',
    shadow: false
  }
});

/** Section presets applied when the matching palette variant is dropped. */
const SECTION_VARIANTS = {
  table: (section) => ({
    ...section,
    label: { en: 'Table section', ar: 'قسم جدول' },
    advancedLayout: {
      ...section.advancedLayout,
      layoutType: 'table',
      table: {
        ...section.advancedLayout.table,
        enabled: true,
        columns: [
          defaultColumn(`${section.id}_c1`, 'Item', 'الصنف', '2fr', 'text', 'left'),
          defaultColumn(`${section.id}_c2`, 'Quantity', 'الكمية', '1fr', 'number', 'center'),
          defaultColumn(`${section.id}_c3`, 'Notes', 'ملاحظات', '2fr', 'text', 'left')
        ]
      }
    }
  }),
  columns: (section) => ({
    ...section,
    label: { en: 'Two column section', ar: 'قسم بعمودين' },
    fields: [
      defaultField(`${section.id}_f1`, 'First field', 'الحقل الأول', 0),
      defaultField(`${section.id}_f2`, 'Second field', 'الحقل الثاني', 12)
    ]
  })
};

const BLOCK_LABELS = {
  header: { en: 'Header', ar: 'الترويسة' },
  metadata: { en: 'Form details', ar: 'بيانات النموذج' },
  section: { en: 'Section', ar: 'قسم' },
  signature: { en: 'Signatures', ar: 'التوقيعات' },
  footer: { en: 'Footer', ar: 'التذييل' },
  text: { en: 'Text', ar: 'نص' },
  divider: { en: 'Divider', ar: 'فاصل' },
  spacer: { en: 'Spacer', ar: 'مسافة' },
  image: { en: 'Image', ar: 'صورة' },
  qr: { en: 'QR code', ar: 'رمز QR' },
  stamp: { en: 'Stamp', ar: 'ختم' },
  watermark: { en: 'Watermark', ar: 'علامة مائية' },
  pageBreak: { en: 'Page break', ar: 'فاصل صفحات' }
};

const BLOCK_ICONS = {
  header: FaHeading,
  metadata: FaInfoCircle,
  section: FaLayerGroup,
  signature: FaSignature,
  footer: FaWindowMinimize,
  text: FaFont,
  divider: FaMinus,
  spacer: FaArrowsAltV,
  image: FaImage,
  qr: FaQrcode,
  stamp: FaStamp,
  watermark: FaTint,
  pageBreak: FaFileExport
};

export {
  PALETTE_GROUPS,
  PALETTE_ITEMS,
  SECTION_VARIANTS,
  BLOCK_LABELS,
  BLOCK_ICONS
};
