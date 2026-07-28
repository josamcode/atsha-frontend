import React from 'react';
import { FaTrash, FaClone, FaPlus, FaExclamationTriangle, FaArrowUp, FaArrowDown } from 'react-icons/fa';

import {
  TextInput, TextArea, NumberInput, SelectInput, ColorInput, Toggle, Group, Row
} from './controls';
import { BLOCK_LABELS } from '../../paletteItems';

const { GRID_COLUMNS, OVERLAY_CAPABLE_BLOCK_TYPES } = require('../../../../document/documentModel');
const { PAGE_SIZE_VALUES } = require('../../../../document/units');

/**
 * Contextual property inspector.
 *
 * Shows only what applies to the current selection — document, page, block,
 * section, field or table column. Every control here writes through a reducer
 * command, so everything it changes is undoable and everything it changes is
 * actually reflected in the document (there are no decorative controls).
 */

const FIELD_TYPES = [
  'text', 'textarea', 'static_text', 'number', 'boolean',
  'select', 'date', 'time', 'datetime', 'image', 'file'
];

const COLUMN_TYPES = [
  'text', 'textarea', 'number', 'boolean', 'select', 'date', 'time', 'datetime', 'image', 'file'
];

const SECTION_TYPES = ['normal', 'header', 'signature', 'approval', 'notes', 'totals', 'stamp', 'footer'];

const COLUMN_WIDTH_PRESETS = ['auto', '1fr', '1.5fr', '2fr', '3fr', '10%', '15%', '20%', '25%', '30%', '40%', '50%', '120px', '160px', '200px'];

const InspectorPanel = ({
  language,
  template,
  selection,
  overflows,
  onCommand,
  onSelect,
  onDuplicateBlock,
  onDeleteBlock,
  onUploadBrandingAsset,
  brandingUploading
}) => {
  const isArabic = language === 'ar';
  const T = (en, ar) => (isArabic ? ar : en);
  const documentValue = template.document;

  const options = (values, labels) => values.map((value, index) => ({
    value,
    label: labels ? labels[index] : value
  }));

  const selectedBlock = selection.blockId
    ? documentValue.blocks.find((block) => block.id === selection.blockId)
    : null;
  const selectedSection = selection.sectionId
    ? template.sections.find((section) => section.id === selection.sectionId)
    : null;
  const selectedField = selectedSection && selection.fieldKey
    ? selectedSection.fields.find((field) => field.key === selection.fieldKey)
    : null;

  const blockOverflows = overflows.filter((item) => item.blockId === selection.blockId);

  /**
   * `coalesce` groups consecutive edits to the SAME property into one undo step,
   * so typing a label is one Ctrl+Z rather than one per character. The key is
   * derived from the property path, so moving to a different control starts a
   * new history entry.
   */
  const coalesceFor = (scope, patch) => `${scope}:${Object.keys(patch || {}).join(',')}`;

  const setPdfStyle = (patch) => onCommand({
    type: 'UPDATE_PDF_STYLE', patch, coalesce: coalesceFor('pdfStyle', patch)
  });
  const setBlock = (patch) => onCommand({
    type: 'UPDATE_BLOCK', blockId: selectedBlock.id, patch,
    coalesce: coalesceFor(`block:${selectedBlock.id}`, patch)
  });
  const setBlockProps = (patch) => onCommand({
    type: 'UPDATE_BLOCK', blockId: selectedBlock.id, patch: { props: patch },
    coalesce: coalesceFor(`blockProps:${selectedBlock.id}`, patch)
  });
  const setSection = (patch) => onCommand({
    type: 'UPDATE_SECTION', sectionId: selectedSection.id, patch,
    coalesce: coalesceFor(`section:${selectedSection.id}`, patch)
  });
  const setField = (patch) => onCommand({
    type: 'UPDATE_FIELD', sectionId: selectedSection.id, fieldKey: selectedField.key, patch,
    coalesce: coalesceFor(`field:${selectedSection.id}:${selectedField.key}`, patch)
  });

  /* -------------------------------------------------------------- header */

  const header = () => {
    if (selection.kind === 'document') {
      return { title: T('Document & page', 'المستند والصفحة'), subtitle: T('Global settings', 'إعدادات عامة') };
    }
    if (selectedField) {
      return {
        title: (isArabic ? selectedField.label?.ar : selectedField.label?.en) || T('Field', 'حقل'),
        subtitle: T('Field', 'حقل')
      };
    }
    if (selection.kind === 'column') {
      return { title: T('Table column', 'عمود الجدول'), subtitle: T('Column', 'عمود') };
    }
    if (selectedBlock) {
      const label = BLOCK_LABELS[selectedBlock.type];
      return {
        title: selectedBlock.type === 'section'
          ? ((isArabic ? selectedSection?.label?.ar : selectedSection?.label?.en) || T('Section', 'قسم'))
          : (isArabic ? label.ar : label.en),
        subtitle: isArabic ? label.ar : label.en
      };
    }
    return { title: T('Nothing selected', 'لا يوجد تحديد'), subtitle: '' };
  };

  const { title, subtitle } = header();

  /* ------------------------------------------------------- document view */

  const renderDocument = () => (
    <>
      <Group title={T('Template', 'النموذج')}>
        <TextInput
          label={T('Title (English)', 'العنوان (إنجليزي)')}
          value={template.title?.en}
          dir="ltr"
          onChange={(value) => onCommand({
            type: 'UPDATE_META', patch: { title: { ...template.title, en: value } }, coalesce: 'meta:title.en'
          })}
        />
        <TextInput
          label={T('Title (Arabic)', 'العنوان (عربي)')}
          value={template.title?.ar}
          dir="rtl"
          onChange={(value) => onCommand({
            type: 'UPDATE_META', patch: { title: { ...template.title, ar: value } }, coalesce: 'meta:title.ar'
          })}
        />
        <TextArea
          label={T('Description (English)', 'الوصف (إنجليزي)')}
          value={template.description?.en}
          dir="ltr"
          rows={2}
          onChange={(value) => onCommand({
            type: 'UPDATE_META', patch: { description: { ...template.description, en: value } }, coalesce: 'meta:description.en'
          })}
        />
        <TextArea
          label={T('Description (Arabic)', 'الوصف (عربي)')}
          value={template.description?.ar}
          dir="rtl"
          rows={2}
          onChange={(value) => onCommand({
            type: 'UPDATE_META', patch: { description: { ...template.description, ar: value } }, coalesce: 'meta:description.ar'
          })}
        />
        <Toggle
          label={T('Requires approval', 'يتطلب اعتماداً')}
          checked={template.requiresApproval !== false}
          onChange={(checked) => onCommand({ type: 'UPDATE_META', patch: { requiresApproval: checked } })}
        />
        <Toggle
          label={T('Active', 'مفعّل')}
          checked={template.isActive !== false}
          onChange={(checked) => onCommand({ type: 'UPDATE_META', patch: { isActive: checked } })}
        />
      </Group>

      <Group title={T('Page', 'الصفحة')}>
        <Row>
          <SelectInput
            label={T('Paper size', 'حجم الورق')}
            value={documentValue.page.size}
            options={options(PAGE_SIZE_VALUES)}
            onChange={(value) => onCommand({ type: 'UPDATE_PAGE', patch: { size: value } })}
          />
          <SelectInput
            label={T('Orientation', 'الاتجاه')}
            value={documentValue.page.orientation}
            options={options(
              ['portrait', 'landscape'],
              [T('Portrait', 'طولي'), T('Landscape', 'عرضي')]
            )}
            onChange={(value) => onCommand({ type: 'UPDATE_PAGE', patch: { orientation: value } })}
          />
        </Row>
        <div className="tb-eyebrow" style={{ margin: '6px 0' }}>{T('Margins (mm)', 'الهوامش (مم)')}</div>
        <Row columns={4}>
          {['top', 'right', 'bottom', 'left'].map((side) => (
            <NumberInput
              key={side}
              label={T(side, { top: 'أعلى', right: 'يمين', bottom: 'أسفل', left: 'يسار' }[side])}
              value={Number(documentValue.page.margins[side].toFixed(1))}
              min={0}
              max={80}
              step={0.5}
              onChange={(value) => onCommand({
                type: 'UPDATE_PAGE', patch: { margins: { [side]: value ?? 0 } }
              })}
            />
          ))}
        </Row>
      </Group>

      <Group title={T('Grid & snapping', 'الشبكة والمحاذاة')}>
        <Row>
          <NumberInput
            label={T('Column gap', 'المسافة بين الأعمدة')}
            suffix="mm"
            value={documentValue.grid.gutterMm}
            min={0}
            max={20}
            step={0.5}
            onChange={(value) => onCommand({ type: 'UPDATE_GRID', patch: { gutterMm: value ?? 0 } })}
          />
          <NumberInput
            label={T('Row gap', 'المسافة بين الصفوف')}
            suffix="mm"
            value={documentValue.grid.rowGapMm}
            min={0}
            max={40}
            step={0.5}
            onChange={(value) => onCommand({ type: 'UPDATE_GRID', patch: { rowGapMm: value ?? 0 } })}
          />
        </Row>
        <Toggle
          label={T('Show alignment guides', 'إظهار خطوط المحاذاة')}
          hint={T(
            'Highlights when a dragged block lines up with another one. Placement always snaps to whole columns.',
            'يبرز الخطوط عندما يتحاذى العنصر المسحوب مع عنصر آخر. التموضع دائماً بأعمدة كاملة.'
          )}
          checked={documentValue.grid.snap}
          onChange={(checked) => onCommand({ type: 'UPDATE_GRID', patch: { snap: checked } })}
        />
      </Group>

      <Group title={T('Brand colours', 'ألوان الهوية')}>
        <Row>
          <ColorInput
            label={T('Primary', 'أساسي')}
            value={template.pdfStyle?.colors?.primary}
            onChange={(value) => setPdfStyle({ colors: { primary: value }, branding: { primaryColor: value } })}
          />
          <ColorInput
            label={T('Secondary', 'ثانوي')}
            value={template.pdfStyle?.colors?.secondary}
            onChange={(value) => setPdfStyle({ colors: { secondary: value }, branding: { secondaryColor: value } })}
          />
        </Row>
        <Row>
          <ColorInput
            label={T('Text', 'النص')}
            value={template.pdfStyle?.colors?.text}
            onChange={(value) => setPdfStyle({ colors: { text: value } })}
          />
          <ColorInput
            label={T('Borders', 'الحدود')}
            value={template.pdfStyle?.colors?.border}
            onChange={(value) => setPdfStyle({ colors: { border: value } })}
          />
        </Row>
        <div className="tb-eyebrow" style={{ margin: '6px 0' }}>{T('Type scale (pt)', 'مقاس الخط (نقطة)')}</div>
        <Row columns={3}>
          <NumberInput
            label={T('Title', 'العنوان')}
            value={template.pdfStyle?.fontSize?.title}
            min={6}
            max={48}
            onChange={(value) => setPdfStyle({ fontSize: { title: value } })}
          />
          <NumberInput
            label={T('Section', 'القسم')}
            value={template.pdfStyle?.fontSize?.section}
            min={6}
            max={36}
            onChange={(value) => setPdfStyle({ fontSize: { section: value } })}
          />
          <NumberInput
            label={T('Field', 'الحقل')}
            value={template.pdfStyle?.fontSize?.field}
            min={5}
            max={28}
            onChange={(value) => setPdfStyle({ fontSize: { field: value } })}
          />
        </Row>
      </Group>

      <Group title={T('Company details', 'بيانات الشركة')}>
        <Row>
          <TextInput
            label={T('Name (EN)', 'الاسم (إنجليزي)')}
            dir="ltr"
            value={template.pdfStyle?.branding?.companyName?.en}
            onChange={(value) => setPdfStyle({ branding: { companyName: { en: value } } })}
          />
          <TextInput
            label={T('Name (AR)', 'الاسم (عربي)')}
            dir="rtl"
            value={template.pdfStyle?.branding?.companyName?.ar}
            onChange={(value) => setPdfStyle({ branding: { companyName: { ar: value } } })}
          />
        </Row>
        <Row>
          <TextInput
            label={T('Address (EN)', 'العنوان (إنجليزي)')}
            dir="ltr"
            value={template.pdfStyle?.branding?.companyAddress?.en}
            onChange={(value) => setPdfStyle({ branding: { companyAddress: { en: value } } })}
          />
          <TextInput
            label={T('Address (AR)', 'العنوان (عربي)')}
            dir="rtl"
            value={template.pdfStyle?.branding?.companyAddress?.ar}
            onChange={(value) => setPdfStyle({ branding: { companyAddress: { ar: value } } })}
          />
        </Row>
        <Row>
          <TextInput
            label={T('Phone', 'الهاتف')}
            value={template.pdfStyle?.branding?.companyPhone}
            onChange={(value) => setPdfStyle({ branding: { companyPhone: value } })}
          />
          <TextInput
            label={T('Email', 'البريد')}
            value={template.pdfStyle?.branding?.companyEmail}
            onChange={(value) => setPdfStyle({ branding: { companyEmail: value } })}
          />
        </Row>
        <TextInput
          label={T('Logo URL', 'رابط الشعار')}
          dir="ltr"
          value={template.pdfStyle?.branding?.logoUrl}
          onChange={(value) => setPdfStyle({ branding: { logoUrl: value } })}
        />
        <label className="tb-field__label" htmlFor="tb-logo-upload">
          {T('Upload a logo', 'رفع شعار')}
        </label>
        <input
          id="tb-logo-upload"
          className="tb-input"
          type="file"
          accept="image/*"
          disabled={brandingUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUploadBrandingAsset('logo', file);
            event.target.value = '';
          }}
        />
      </Group>
    </>
  );

  /* ------------------------------------------------------- block sections */

  const renderBlockCommon = () => (
    <Group
      title={T('Placement', 'الموضع')}
      action={(
        <span style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            className="tb-layer__action"
            onClick={() => onCommand({ type: 'REORDER_BLOCK', blockId: selectedBlock.id, direction: 'up' })}
            aria-label={T('Move up', 'تحريك لأعلى')}
            disabled={selectedBlock.placement !== 'flow'}
          >
            <FaArrowUp />
          </button>
          <button
            type="button"
            className="tb-layer__action"
            onClick={() => onCommand({ type: 'REORDER_BLOCK', blockId: selectedBlock.id, direction: 'down' })}
            aria-label={T('Move down', 'تحريك لأسفل')}
            disabled={selectedBlock.placement !== 'flow'}
          >
            <FaArrowDown />
          </button>
          <button
            type="button"
            className="tb-layer__action"
            onClick={() => onDuplicateBlock(selectedBlock.id)}
            aria-label={T('Duplicate', 'تكرار')}
          >
            <FaClone />
          </button>
          <button
            type="button"
            className="tb-layer__action"
            onClick={() => onDeleteBlock(selectedBlock.id)}
            aria-label={T('Delete', 'حذف')}
          >
            <FaTrash />
          </button>
        </span>
      )}
    >
      {selectedBlock.placement === 'flow' && (
        <Row columns={3}>
          <NumberInput
            label={T('Column', 'العمود')}
            value={selectedBlock.x + 1}
            min={1}
            max={GRID_COLUMNS}
            onChange={(value) => onCommand({
              type: 'MOVE_BLOCK', blockId: selectedBlock.id, row: selectedBlock.row, x: (value || 1) - 1
            })}
          />
          <NumberInput
            label={T('Width', 'العرض')}
            value={selectedBlock.w}
            min={1}
            max={GRID_COLUMNS}
            onChange={(value) => onCommand({ type: 'RESIZE_BLOCK', blockId: selectedBlock.id, w: value || 1 })}
          />
          <NumberInput
            label={T('Row', 'الصف')}
            value={selectedBlock.row + 1}
            min={1}
            onChange={(value) => onCommand({
              type: 'MOVE_BLOCK', blockId: selectedBlock.id, row: (value || 1) - 1, x: selectedBlock.x
            })}
          />
        </Row>
      )}

      {selectedBlock.placement === 'overlay' && selectedBlock.overlay && selectedBlock.type !== 'watermark' && (
        <>
          <Row>
            <NumberInput
              label={T('X', 'س')} suffix="mm" step={0.5}
              value={selectedBlock.overlay.xMm}
              onChange={(value) => onCommand({
                type: 'MOVE_OVERLAY',
                blockId: selectedBlock.id,
                xMm: value ?? 0,
                yMm: selectedBlock.overlay.yMm
              })}
            />
            <NumberInput
              label={T('Y', 'ص')} suffix="mm" step={0.5}
              value={selectedBlock.overlay.yMm}
              onChange={(value) => onCommand({
                type: 'MOVE_OVERLAY',
                blockId: selectedBlock.id,
                xMm: selectedBlock.overlay.xMm,
                yMm: value ?? 0
              })}
            />
          </Row>
          <Row>
            <NumberInput
              label={T('Width', 'العرض')} suffix="mm" step={0.5}
              value={selectedBlock.overlay.wMm}
              onChange={(value) => onCommand({
                type: 'RESIZE_OVERLAY',
                blockId: selectedBlock.id,
                wMm: value ?? 10,
                hMm: selectedBlock.overlay.hMm
              })}
            />
            <NumberInput
              label={T('Height', 'الارتفاع')} suffix="mm" step={0.5}
              value={selectedBlock.overlay.hMm}
              onChange={(value) => onCommand({
                type: 'RESIZE_OVERLAY',
                blockId: selectedBlock.id,
                wMm: selectedBlock.overlay.wMm,
                hMm: value ?? 10
              })}
            />
          </Row>
          <Row>
            <NumberInput
              label={T('Rotation', 'الدوران')} suffix="°"
              value={selectedBlock.overlay.rotation}
              min={-180}
              max={180}
              onChange={(value) => setBlock({ overlay: { rotation: value ?? 0 } })}
            />
            <SelectInput
              label={T('Appears on', 'يظهر في')}
              value={selectedBlock.overlay.pageScope}
              options={options(['all', 'first'], [T('Every page', 'كل الصفحات'), T('First page', 'الصفحة الأولى')])}
              onChange={(value) => setBlock({ overlay: { pageScope: value } })}
            />
          </Row>
        </>
      )}

      {OVERLAY_CAPABLE_BLOCK_TYPES.includes(selectedBlock.type) && (
        <Toggle
          label={T('Float freely over the page', 'تعويم فوق الصفحة')}
          hint={T('Floating elements ignore the flow and can overlap content.', 'العناصر العائمة تتجاهل التدفق ويمكن أن تتداخل مع المحتوى.')}
          checked={selectedBlock.placement === 'overlay'}
          onChange={(checked) => setBlock({
            placement: checked ? 'overlay' : 'flow',
            overlay: checked ? { pageScope: 'all', xMm: 20, yMm: 20, wMm: 40, hMm: 40, rotation: 0, opacity: 100 } : null
          })}
        />
      )}

      {(selectedBlock.placement === 'pageHeader' || selectedBlock.placement === 'pageFooter') && (
        <SelectInput
          label={T('Repeat on', 'التكرار في')}
          value={selectedBlock.repeat}
          options={options(
            ['all', 'first', 'notFirst'],
            [T('Every page', 'كل الصفحات'), T('First page only', 'الصفحة الأولى فقط'), T('All except the first', 'كل الصفحات عدا الأولى')]
          )}
          onChange={(value) => setBlock({ repeat: value })}
        />
      )}

      <Toggle
        label={T('Visible', 'ظاهر')}
        checked={!selectedBlock.hidden}
        onChange={(checked) => setBlock({ hidden: !checked })}
      />
      <Toggle
        label={T('Locked', 'مقفل')}
        hint={T('Locked blocks cannot be moved, resized or deleted.', 'العناصر المقفلة لا يمكن تحريكها أو تغيير حجمها أو حذفها.')}
        checked={selectedBlock.locked}
        onChange={(checked) => setBlock({ locked: checked })}
      />
      {selectedBlock.placement === 'flow' && (
        <>
          <Toggle
            label={T('Keep on one page', 'إبقاؤه في صفحة واحدة')}
            checked={selectedBlock.keepTogether}
            onChange={(checked) => setBlock({ keepTogether: checked })}
          />
          <Toggle
            label={T('Start a new page before this', 'ابدأ صفحة جديدة قبله')}
            checked={selectedBlock.breakBefore}
            onChange={(checked) => setBlock({ breakBefore: checked })}
          />
        </>
      )}
    </Group>
  );

  const renderHeaderBlock = () => {
    const config = template.pdfStyle?.header || {};
    return (
      <>
        <Group title={T('Header content', 'محتوى الترويسة')}>
          <Toggle label={T('Company name', 'اسم الشركة')} checked={config.showCompanyName !== false} onChange={(v) => setPdfStyle({ header: { showCompanyName: v } })} />
          <Toggle label={T('Company address', 'عنوان الشركة')} checked={config.showCompanyAddress !== false} onChange={(v) => setPdfStyle({ header: { showCompanyAddress: v } })} />
          <Toggle label={T('Form title', 'عنوان النموذج')} checked={config.showTitle !== false} onChange={(v) => setPdfStyle({ header: { showTitle: v } })} />
          <Toggle label={T('Subtitle', 'العنوان الفرعي')} checked={config.showSubtitle === true} onChange={(v) => setPdfStyle({ header: { showSubtitle: v } })} />
          {config.showSubtitle && (
            <Row>
              <TextInput label={T('Subtitle (EN)', 'فرعي (إنجليزي)')} dir="ltr" value={config.subtitle?.en} onChange={(v) => setPdfStyle({ header: { subtitle: { en: v } } })} />
              <TextInput label={T('Subtitle (AR)', 'فرعي (عربي)')} dir="rtl" value={config.subtitle?.ar} onChange={(v) => setPdfStyle({ header: { subtitle: { ar: v } } })} />
            </Row>
          )}
          <Toggle label={T('Date', 'التاريخ')} checked={config.showDate !== false} onChange={(v) => setPdfStyle({ header: { showDate: v } })} />
          <Toggle label={T('Logo', 'الشعار')} checked={config.showLogo !== false} onChange={(v) => setPdfStyle({ header: { showLogo: v } })} />
        </Group>

        <Group title={T('Header style', 'شكل الترويسة')}>
          <Row>
            <SelectInput
              label={T('Layout', 'التخطيط')}
              value={config.layout || 'default'}
              options={options(['default', 'split'], [T('Text first', 'النص أولاً'), T('Logo first', 'الشعار أولاً')])}
              onChange={(v) => setPdfStyle({ header: { layout: v } })}
            />
            <NumberInput label={T('Min height', 'أدنى ارتفاع')} suffix="px" value={config.height} min={0} max={300} onChange={(v) => setPdfStyle({ header: { height: v } })} />
          </Row>
          <Row>
            <NumberInput label={T('Logo size', 'حجم الشعار')} suffix="px" value={config.logoSize} min={0} max={160} onChange={(v) => setPdfStyle({ header: { logoSize: v } })} />
            <NumberInput label={T('Font size', 'حجم الخط')} suffix="pt" value={config.fontSize} min={6} max={48} onChange={(v) => setPdfStyle({ header: { fontSize: v } })} />
          </Row>
          <Row>
            <ColorInput label={T('Background', 'الخلفية')} value={config.backgroundColor} onChange={(v) => setPdfStyle({ header: { backgroundColor: v } })} />
            <ColorInput label={T('Text', 'النص')} value={config.textColor} onChange={(v) => setPdfStyle({ header: { textColor: v } })} />
          </Row>
          <ColorInput label={T('Title colour', 'لون العنوان')} value={config.titleColor} onChange={(v) => setPdfStyle({ header: { titleColor: v } })} />
        </Group>

        <Group title={T('Header rule', 'خط الترويسة')}>
          <Toggle label={T('Show rule', 'إظهار الخط')} checked={config.border?.show !== false} onChange={(v) => setPdfStyle({ header: { border: { show: v } } })} />
          <Row columns={3}>
            <NumberInput label={T('Width', 'السمك')} value={config.border?.width} min={0} max={12} onChange={(v) => setPdfStyle({ header: { border: { width: v } } })} />
            <SelectInput label={T('Style', 'النمط')} value={config.border?.style} options={options(['solid', 'dashed', 'dotted', 'double', 'none'])} onChange={(v) => setPdfStyle({ header: { border: { style: v } } })} />
            <SelectInput label={T('Side', 'الجهة')} value={config.border?.position} options={options(['bottom', 'top', 'left', 'right', 'all', 'none'])} onChange={(v) => setPdfStyle({ header: { border: { position: v } } })} />
          </Row>
          <ColorInput label={T('Colour', 'اللون')} value={config.border?.color} onChange={(v) => setPdfStyle({ header: { border: { color: v } } })} />
        </Group>
      </>
    );
  };

  const renderMetadataBlock = () => {
    const config = template.pdfStyle?.metadata || {};
    const toggles = [
      ['showFormId', T('Form ID', 'رقم النموذج')],
      ['showDate', T('Date', 'التاريخ')],
      ['showShift', T('Shift', 'الوردية')],
      ['showDepartment', T('Department', 'القسم')],
      ['showFilledBy', T('Filled by', 'تم الملء بواسطة')],
      ['showSubmittedOn', T('Submitted on', 'تاريخ الإرسال')],
      ['showApprovedBy', T('Approved by', 'اعتمد بواسطة')],
      ['showApprovalDate', T('Approval date', 'تاريخ الاعتماد')]
    ];
    return (
      <Group title={T('Details shown', 'البيانات المعروضة')}>
        {toggles.map(([key, label]) => (
          <Toggle
            key={key}
            label={label}
            checked={config[key] !== false}
            onChange={(value) => setPdfStyle({ metadata: { [key]: value } })}
          />
        ))}
      </Group>
    );
  };

  const renderSignatureBlock = () => {
    const config = template.pdfStyle?.signature || {};
    return (
      <Group title={T('Signature lines', 'خانات التوقيع')}>
        <Toggle label={T('Prepared by', 'أعده')} checked={config.showPreparedBy !== false} onChange={(v) => setPdfStyle({ signature: { showPreparedBy: v } })} />
        <Toggle label={T('Approved by', 'اعتمده')} checked={config.showApprovedBy !== false} onChange={(v) => setPdfStyle({ signature: { showApprovedBy: v } })} />
      </Group>
    );
  };

  const renderFooterBlock = () => {
    const config = template.pdfStyle?.footer || {};
    const links = config.socialLinks || [];
    return (
      <>
        <Group title={T('Footer content', 'محتوى التذييل')}>
          <SelectInput
            label={T('Layout', 'التخطيط')}
            value={config.template || 'classic'}
            options={options(
              ['classic', 'centered', 'contact', 'minimal'],
              [T('Classic', 'كلاسيكي'), T('Centered', 'متوسط'), T('Contact', 'اتصال'), T('Minimal', 'مبسط')]
            )}
            onChange={(v) => setPdfStyle({ footer: { template: v } })}
          />
          <Toggle label={T('Page numbers', 'أرقام الصفحات')} checked={config.showPageNumbers !== false} onChange={(v) => setPdfStyle({ footer: { showPageNumbers: v } })} />
          <Toggle label={T('Company info', 'بيانات الشركة')} checked={config.showCompanyInfo !== false} onChange={(v) => setPdfStyle({ footer: { showCompanyInfo: v } })} />
          <Toggle label={T('Phone number', 'رقم الهاتف')} checked={config.showPhoneNumber === true} onChange={(v) => setPdfStyle({ footer: { showPhoneNumber: v } })} />
          {config.showPhoneNumber && (
            <TextInput label={T('Phone', 'الهاتف')} value={config.phoneNumber} onChange={(v) => setPdfStyle({ footer: { phoneNumber: v } })} />
          )}
          <Row>
            <TextInput label={T('Note (EN)', 'ملاحظة (إنجليزي)')} dir="ltr" value={config.content?.en} onChange={(v) => setPdfStyle({ footer: { content: { en: v } } })} />
            <TextInput label={T('Note (AR)', 'ملاحظة (عربي)')} dir="rtl" value={config.content?.ar} onChange={(v) => setPdfStyle({ footer: { content: { ar: v } } })} />
          </Row>
        </Group>

        <Group title={T('QR code', 'رمز QR')}>
          <Toggle label={T('Show QR code', 'إظهار رمز QR')} checked={config.showQRCode === true} onChange={(v) => setPdfStyle({ footer: { showQRCode: v } })} />
          {config.showQRCode && (
            <>
              <TextInput label={T('Value', 'القيمة')} dir="ltr" value={config.qrCodeValue} onChange={(v) => setPdfStyle({ footer: { qrCodeValue: v } })} />
              <Row>
                <SelectInput label={T('Position', 'الموضع')} value={config.qrCodePosition} options={options(['left', 'center', 'right'])} onChange={(v) => setPdfStyle({ footer: { qrCodePosition: v } })} />
                <NumberInput label={T('Size', 'الحجم')} suffix="px" value={config.qrCodeSize} min={24} max={160} onChange={(v) => setPdfStyle({ footer: { qrCodeSize: v } })} />
              </Row>
            </>
          )}
        </Group>

        <Group
          title={T('Social links', 'روابط التواصل')}
          action={(
            <button
              type="button"
              className="tb-layer__action"
              aria-label={T('Add link', 'إضافة رابط')}
              onClick={() => setPdfStyle({
                footer: {
                  showSocialIcons: true,
                  socialLinks: [...links, { id: `social_${Date.now()}`, type: 'website', url: '' }]
                }
              })}
            >
              <FaPlus />
            </button>
          )}
        >
          <Toggle label={T('Show links', 'إظهار الروابط')} checked={config.showSocialIcons === true} onChange={(v) => setPdfStyle({ footer: { showSocialIcons: v } })} />
          {links.map((link, index) => (
            <Row key={link.id || index}>
              <SelectInput
                label={T('Type', 'النوع')}
                value={link.type}
                options={options(['website', 'email', 'facebook', 'instagram', 'linkedin', 'youtube', 'whatsapp', 'telegram', 'x', 'tiktok', 'snapchat', 'discord', 'pinterest', 'github'])}
                onChange={(value) => setPdfStyle({
                  footer: { socialLinks: links.map((item, i) => (i === index ? { ...item, type: value } : item)) }
                })}
              />
              <TextInput
                label={T('URL', 'الرابط')}
                dir="ltr"
                value={link.url}
                onChange={(value) => setPdfStyle({
                  footer: { socialLinks: links.map((item, i) => (i === index ? { ...item, url: value } : item)) }
                })}
              />
            </Row>
          ))}
        </Group>

        <Group title={T('Footer style', 'شكل التذييل')}>
          <Row>
            <ColorInput label={T('Background', 'الخلفية')} value={config.backgroundColor} onChange={(v) => setPdfStyle({ footer: { backgroundColor: v } })} />
            <ColorInput label={T('Text', 'النص')} value={config.textColor} onChange={(v) => setPdfStyle({ footer: { textColor: v } })} />
          </Row>
          <Row>
            <NumberInput label={T('Min height', 'أدنى ارتفاع')} suffix="px" value={config.height} min={0} max={200} onChange={(v) => setPdfStyle({ footer: { height: v } })} />
            <NumberInput label={T('Font size', 'حجم الخط')} suffix="pt" value={config.fontSize} min={5} max={20} onChange={(v) => setPdfStyle({ footer: { fontSize: v } })} />
          </Row>
        </Group>
      </>
    );
  };

  const renderWatermarkBlock = () => (
    <Group title={T('Watermark', 'العلامة المائية')}>
      <TextInput
        label={T('Image URL', 'رابط الصورة')}
        dir="ltr"
        value={selectedBlock.props.url}
        hint={T('Leave empty to use the organisation watermark or logo.', 'اتركه فارغاً لاستخدام علامة المؤسسة أو شعارها.')}
        onChange={(value) => setBlockProps({ url: value })}
      />
      <label className="tb-field__label" htmlFor="tb-watermark-upload">{T('Upload', 'رفع')}</label>
      <input
        id="tb-watermark-upload"
        className="tb-input"
        type="file"
        accept="image/*"
        disabled={brandingUploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUploadBrandingAsset('watermark', file);
          event.target.value = '';
        }}
      />
      <Row>
        <NumberInput label={T('Size', 'الحجم')} suffix="%" value={selectedBlock.props.sizePercent} min={5} max={100} onChange={(v) => setBlockProps({ sizePercent: v })} />
        <NumberInput label={T('Opacity', 'الشفافية')} suffix="%" value={selectedBlock.props.opacity} min={0} max={100} onChange={(v) => setBlockProps({ opacity: v })} />
      </Row>
      <NumberInput label={T('Rotation', 'الدوران')} suffix="°" value={selectedBlock.props.rotation} min={-180} max={180} onChange={(v) => setBlockProps({ rotation: v })} />
    </Group>
  );

  const renderSimpleBlock = () => {
    const props = selectedBlock.props || {};
    switch (selectedBlock.type) {
      case 'text':
        return (
          <Group title={T('Text', 'النص')}>
            <TextArea label={T('English', 'إنجليزي')} dir="ltr" value={props.content?.en} onChange={(v) => setBlockProps({ content: { ...props.content, en: v } })} />
            <TextArea label={T('Arabic', 'عربي')} dir="rtl" value={props.content?.ar} onChange={(v) => setBlockProps({ content: { ...props.content, ar: v } })} />
            <Row columns={3}>
              <NumberInput label={T('Size', 'الحجم')} suffix="pt" value={props.fontSize} min={5} max={48} onChange={(v) => setBlockProps({ fontSize: v })} />
              <SelectInput
                label={T('Align', 'المحاذاة')}
                value={props.align}
                options={options(['start', 'center', 'end'], [T('Start', 'البداية'), T('Center', 'الوسط'), T('End', 'النهاية')])}
                onChange={(v) => setBlockProps({ align: v })}
              />
              <NumberInput label={T('Line height', 'تباعد الأسطر')} value={props.lineSpacing} min={1} max={3} step={0.05} onChange={(v) => setBlockProps({ lineSpacing: v })} />
            </Row>
            <Toggle label={T('Bold', 'عريض')} checked={props.bold} onChange={(v) => setBlockProps({ bold: v })} />
            <Row>
              <ColorInput label={T('Text colour', 'لون النص')} value={props.color} onChange={(v) => setBlockProps({ color: v })} />
              <ColorInput label={T('Background', 'الخلفية')} value={props.backgroundColor} onChange={(v) => setBlockProps({ backgroundColor: v })} />
            </Row>
          </Group>
        );
      case 'divider':
        return (
          <Group title={T('Divider', 'الفاصل')}>
            <Row columns={3}>
              <NumberInput label={T('Thickness', 'السمك')} suffix="pt" value={props.thickness} min={0.25} max={12} step={0.25} onChange={(v) => setBlockProps({ thickness: v })} />
              <SelectInput label={T('Style', 'النمط')} value={props.style} options={options(['solid', 'dashed', 'dotted'])} onChange={(v) => setBlockProps({ style: v })} />
              <NumberInput label={T('Inset', 'الإزاحة')} suffix="mm" value={props.insetMm} min={0} max={60} onChange={(v) => setBlockProps({ insetMm: v })} />
            </Row>
            <ColorInput label={T('Colour', 'اللون')} value={props.color} onChange={(v) => setBlockProps({ color: v })} />
          </Group>
        );
      case 'spacer':
        return (
          <Group title={T('Spacer', 'المسافة')}>
            <NumberInput
              label={T('Height', 'الارتفاع')}
              suffix="mm"
              value={selectedBlock.heightMm}
              min={1}
              max={200}
              step={0.5}
              onChange={(v) => onCommand({ type: 'RESIZE_BLOCK', blockId: selectedBlock.id, heightMm: v ?? 8 })}
            />
          </Group>
        );
      case 'image':
        return (
          <Group title={T('Image', 'الصورة')}>
            <TextInput label={T('Image URL', 'رابط الصورة')} dir="ltr" value={props.url} onChange={(v) => setBlockProps({ url: v })} />
            <Row>
              <SelectInput label={T('Fit', 'الملاءمة')} value={props.fit} options={options(['contain', 'cover', 'fill'])} onChange={(v) => setBlockProps({ fit: v })} />
              <NumberInput label={T('Height', 'الارتفاع')} suffix="mm" value={selectedBlock.heightMm} min={5} max={400} step={0.5} onChange={(v) => onCommand({ type: 'RESIZE_BLOCK', blockId: selectedBlock.id, heightMm: v ?? 40 })} />
            </Row>
            <Row columns={3}>
              <NumberInput label={T('Radius', 'الاستدارة')} value={props.borderRadius} min={0} max={60} onChange={(v) => setBlockProps({ borderRadius: v })} />
              <NumberInput label={T('Border', 'الحد')} value={props.borderWidth} min={0} max={20} onChange={(v) => setBlockProps({ borderWidth: v })} />
              <NumberInput label={T('Opacity', 'الشفافية')} suffix="%" value={props.opacity} min={0} max={100} onChange={(v) => setBlockProps({ opacity: v })} />
            </Row>
            <Row>
              <ColorInput label={T('Border colour', 'لون الحد')} value={props.borderColor} onChange={(v) => setBlockProps({ borderColor: v })} />
              <ColorInput label={T('Background', 'الخلفية')} value={props.backgroundColor} onChange={(v) => setBlockProps({ backgroundColor: v })} />
            </Row>
          </Group>
        );
      case 'qr':
        return (
          <Group title={T('QR code', 'رمز QR')}>
            <TextInput label={T('Value', 'القيمة')} dir="ltr" value={props.value} onChange={(v) => setBlockProps({ value: v })} />
            <Row>
              <TextInput label={T('Caption (EN)', 'تعليق (إنجليزي)')} dir="ltr" value={props.caption?.en} onChange={(v) => setBlockProps({ caption: { ...props.caption, en: v } })} />
              <TextInput label={T('Caption (AR)', 'تعليق (عربي)')} dir="rtl" value={props.caption?.ar} onChange={(v) => setBlockProps({ caption: { ...props.caption, ar: v } })} />
            </Row>
            <Row>
              <ColorInput label={T('Foreground', 'اللون')} value={props.foreground} onChange={(v) => setBlockProps({ foreground: v })} />
              <NumberInput label={T('Box height', 'ارتفاع الصندوق')} suffix="mm" value={selectedBlock.heightMm} min={10} max={120} step={0.5} onChange={(v) => onCommand({ type: 'RESIZE_BLOCK', blockId: selectedBlock.id, heightMm: v ?? 30 })} />
            </Row>
          </Group>
        );
      case 'stamp':
        return (
          <Group title={T('Stamp', 'الختم')}>
            <TextInput label={T('Image URL', 'رابط الصورة')} dir="ltr" value={props.url} onChange={(v) => setBlockProps({ url: v })} />
            <Row>
              <TextInput label={T('Label (EN)', 'النص (إنجليزي)')} dir="ltr" value={props.label?.en} onChange={(v) => setBlockProps({ label: { ...props.label, en: v } })} />
              <TextInput label={T('Label (AR)', 'النص (عربي)')} dir="rtl" value={props.label?.ar} onChange={(v) => setBlockProps({ label: { ...props.label, ar: v } })} />
            </Row>
            <Row>
              <ColorInput label={T('Colour', 'اللون')} value={props.borderColor} onChange={(v) => setBlockProps({ borderColor: v })} />
              <NumberInput label={T('Opacity', 'الشفافية')} suffix="%" value={props.opacity} min={0} max={100} onChange={(v) => setBlockProps({ opacity: v })} />
            </Row>
          </Group>
        );
      case 'pageBreak':
        return (
          <div className="tb-empty">
            {T('Everything after this point starts on a new page.', 'كل ما يلي هذه النقطة يبدأ في صفحة جديدة.')}
          </div>
        );
      default:
        return null;
    }
  };

  /* ------------------------------------------------------------- section */

  const renderSection = () => {
    const advanced = selectedSection.advancedLayout || {};
    const table = advanced.table || {};
    const isTable = advanced.layoutType === 'table';

    const patchColumn = (columnId, patch) => onCommand({
      type: 'UPDATE_COLUMN', sectionId: selectedSection.id, columnId, patch
    });

    /**
     * Controls shared by top-level leaf columns and sub-columns. `fieldKey` is
     * what binds a column to submitted data — without it a data-driven table
     * reads a generated column id that no submission can ever contain.
     */
    const renderLeafColumnControls = (column) => (
      <>
        <Row columns={3}>
          <SelectInput
            label={T('Type', 'النوع')}
            value={column.fieldType}
            options={options(COLUMN_TYPES)}
            onChange={(v) => patchColumn(column.id, { fieldType: v })}
          />
          <SelectInput
            label={T('Align', 'المحاذاة')}
            value={column.alignment}
            options={options(['left', 'center', 'right'])}
            onChange={(v) => patchColumn(column.id, { alignment: v })}
          />
          <SelectInput
            label={T('Width', 'العرض')}
            value={column.width}
            options={options([...new Set([column.width, ...COLUMN_WIDTH_PRESETS])].filter(Boolean))}
            onChange={(v) => patchColumn(column.id, { width: v })}
          />
        </Row>
        {table.dynamicRows && (
          <TextInput
            label={T('Data key', 'مفتاح البيانات')}
            hint={T(
              'The property this column reads from each submitted row.',
              'الخاصية التي يقرأها هذا العمود من كل صف مُدخل.'
            )}
            dir="ltr"
            value={column.fieldKey}
            onChange={(v) => patchColumn(column.id, { fieldKey: v })}
          />
        )}
      </>
    );

    return (
      <>
        <Group title={T('Section', 'القسم')}>
          <Row>
            <TextInput label={T('Name (EN)', 'الاسم (إنجليزي)')} dir="ltr" value={selectedSection.label?.en} onChange={(v) => setSection({ label: { ...selectedSection.label, en: v } })} />
            <TextInput label={T('Name (AR)', 'الاسم (عربي)')} dir="rtl" value={selectedSection.label?.ar} onChange={(v) => setSection({ label: { ...selectedSection.label, ar: v } })} />
          </Row>
          <Row>
            <SelectInput label={T('Purpose', 'الغرض')} value={selectedSection.sectionType} options={options(SECTION_TYPES)} onChange={(v) => setSection({ sectionType: v })} />
            <SelectInput
              label={T('Content layout', 'تخطيط المحتوى')}
              value={advanced.layoutType}
              options={options(
                ['simple', 'table'],
                [T('Fields', 'حقول'), T('Table', 'جدول')]
              )}
              onChange={(v) => setSection({
                advancedLayout: {
                  layoutType: v,
                  table: { ...table, enabled: v === 'table' }
                }
              })}
            />
          </Row>
          <Toggle label={T('Show section title', 'إظهار عنوان القسم')} checked={advanced.styling?.showTitle !== false} onChange={(v) => setSection({ advancedLayout: { styling: { showTitle: v } } })} />
        </Group>

        <Group title={T('Section frame', 'إطار القسم')}>
          <Toggle label={T('Border', 'الحد')} checked={selectedSection.pdfStyle?.showBorder !== false} onChange={(v) => setSection({ pdfStyle: { showBorder: v } })} />
          <Toggle label={T('Background fill', 'تعبئة الخلفية')} checked={selectedSection.pdfStyle?.showBackground === true} onChange={(v) => setSection({ pdfStyle: { showBackground: v } })} />
          <Row>
            <ColorInput label={T('Border colour', 'لون الحد')} value={selectedSection.pdfStyle?.borderColor} onChange={(v) => setSection({ pdfStyle: { borderColor: v }, advancedLayout: { styling: { borderColor: v } } })} />
            <ColorInput label={T('Background', 'الخلفية')} value={selectedSection.pdfStyle?.backgroundColor} onChange={(v) => setSection({ pdfStyle: { backgroundColor: v } })} />
          </Row>
          <Row columns={3}>
            <NumberInput label={T('Padding', 'الحشو')} suffix="px" value={selectedSection.pdfStyle?.padding} min={0} max={60} onChange={(v) => setSection({ pdfStyle: { padding: v } })} />
            <NumberInput label={T('Border width', 'سمك الحد')} suffix="px" value={selectedSection.pdfStyle?.borderWidth} min={0} max={10} onChange={(v) => setSection({ pdfStyle: { borderWidth: v } })} />
            <NumberInput label={T('Field gap', 'المسافة بين الحقول')} suffix="px" value={advanced.spacing?.fieldSpacing} min={0} max={40} onChange={(v) => setSection({ advancedLayout: { spacing: { fieldSpacing: v } } })} />
          </Row>
          <Row>
            <ColorInput label={T('Title colour', 'لون العنوان')} value={advanced.styling?.titleColor} onChange={(v) => setSection({ advancedLayout: { styling: { titleColor: v } } })} />
            <NumberInput label={T('Title size', 'حجم العنوان')} suffix="pt" value={advanced.styling?.titleFontSize} min={6} max={36} onChange={(v) => setSection({ advancedLayout: { styling: { titleFontSize: v } } })} />
          </Row>
        </Group>

        {isTable ? (
          <>
            <Group title={T('Table behaviour', 'سلوك الجدول')}>
              <Toggle label={T('Show header row', 'إظهار صف الرأس')} checked={table.showHeader !== false} onChange={(v) => setSection({ advancedLayout: { table: { showHeader: v } } })} />
              <Toggle label={T('Cell borders', 'حدود الخلايا')} checked={table.showBorders !== false} onChange={(v) => setSection({ advancedLayout: { table: { showBorders: v } } })} />
              <Toggle label={T('Striped rows', 'صفوف متناوبة')} checked={table.stripedRows === true} onChange={(v) => setSection({ advancedLayout: { table: { stripedRows: v } } })} />
              <Toggle
                label={T('Rows come from submitted data', 'الصفوف تأتي من البيانات المُدخلة')}
                hint={T('Otherwise a fixed number of blank rows is printed.', 'وإلا يُطبع عدد ثابت من الصفوف الفارغة.')}
                checked={table.dynamicRows === true}
                onChange={(v) => setSection({ advancedLayout: { table: { dynamicRows: v } } })}
              />
              {table.dynamicRows ? (
                <TextInput label={T('Data key', 'مفتاح البيانات')} dir="ltr" value={table.rowSource} onChange={(v) => setSection({ advancedLayout: { table: { rowSource: v } } })} />
              ) : (
                <NumberInput
                  label={T('Printable rows', 'عدد الصفوف المطبوعة')}
                  value={table.numberOfRows}
                  min={1}
                  max={200}
                  onChange={(v) => setSection({ advancedLayout: { table: { numberOfRows: v ?? 1 } } })}
                />
              )}
              <Row>
                <ColorInput label={T('Header background', 'خلفية الرأس')} value={table.headerStyle?.backgroundColor} onChange={(v) => setSection({ advancedLayout: { table: { headerStyle: { ...table.headerStyle, backgroundColor: v } } } })} />
                <ColorInput label={T('Header text', 'نص الرأس')} value={table.headerStyle?.textColor} onChange={(v) => setSection({ advancedLayout: { table: { headerStyle: { ...table.headerStyle, textColor: v } } } })} />
              </Row>
              <Row columns={3}>
                <NumberInput label={T('Header size', 'حجم الرأس')} suffix="pt" value={table.headerStyle?.fontSize} min={5} max={24} onChange={(v) => setSection({ advancedLayout: { table: { headerStyle: { ...table.headerStyle, fontSize: v } } } })} />
                <NumberInput label={T('Cell size', 'حجم الخلية')} suffix="pt" value={table.cellStyle?.fontSize} min={5} max={24} onChange={(v) => setSection({ advancedLayout: { table: { cellStyle: { ...table.cellStyle, fontSize: v } } } })} />
                <NumberInput label={T('Border width', 'سمك الحد')} value={table.borderWidth} min={0} max={6} step={0.25} onChange={(v) => setSection({ advancedLayout: { table: { borderWidth: v } } })} />
              </Row>
              <ColorInput label={T('Cell border colour', 'لون حدود الخلايا')} value={table.borderColor} onChange={(v) => setSection({ advancedLayout: { table: { borderColor: v } } })} />
            </Group>

            <Group
              title={T('Columns', 'الأعمدة')}
              action={(
                <button
                  type="button"
                  className="tb-layer__action"
                  aria-label={T('Add column', 'إضافة عمود')}
                  onClick={() => onCommand({ type: 'ADD_COLUMN', sectionId: selectedSection.id })}
                >
                  <FaPlus />
                </button>
              )}
            >
              {(table.columns || []).length === 0 && (
                <div className="tb-empty">{T('No columns yet.', 'لا توجد أعمدة بعد.')}</div>
              )}
              {(table.columns || []).map((column, index) => (
                <div key={column.id} className="tb-group" style={{ marginBottom: 8 }}>
                  <div className="tb-group__title">
                    <span className="tb-chip">{index + 1}</span>
                    <span style={{ display: 'flex', gap: 2 }}>
                      <button type="button" className="tb-layer__action" aria-label={T('Move earlier', 'تحريك للبداية')} onClick={() => onCommand({ type: 'MOVE_COLUMN', sectionId: selectedSection.id, columnId: column.id, direction: 'start' })}>←</button>
                      <button type="button" className="tb-layer__action" aria-label={T('Move later', 'تحريك للنهاية')} onClick={() => onCommand({ type: 'MOVE_COLUMN', sectionId: selectedSection.id, columnId: column.id, direction: 'end' })}>→</button>
                      <button type="button" className="tb-layer__action" aria-label={T('Delete column', 'حذف العمود')} onClick={() => onCommand({ type: 'DELETE_COLUMN', sectionId: selectedSection.id, columnId: column.id })}><FaTrash /></button>
                    </span>
                  </div>
                  <Row>
                    <TextInput label={T('Label (EN)', 'العنوان (إنجليزي)')} dir="ltr" value={column.label?.en} onChange={(v) => onCommand({ type: 'UPDATE_COLUMN', sectionId: selectedSection.id, columnId: column.id, patch: { label: { en: v } } })} />
                    <TextInput label={T('Label (AR)', 'العنوان (عربي)')} dir="rtl" value={column.label?.ar} onChange={(v) => onCommand({ type: 'UPDATE_COLUMN', sectionId: selectedSection.id, columnId: column.id, patch: { label: { ar: v } } })} />
                  </Row>
                  {(column.children || []).length === 0 ? (
                    <>
                      {renderLeafColumnControls(column)}
                      <button
                        type="button"
                        className="tb-icon-button"
                        style={{ width: '100%' }}
                        onClick={() => onCommand({ type: 'SPLIT_COLUMN', sectionId: selectedSection.id, columnId: column.id })}
                      >
                        {T('Split into sub-columns', 'تقسيم إلى أعمدة فرعية')}
                      </button>
                    </>
                  ) : (
                    <>
                      {column.children.map((child) => (
                        <div
                          key={child.id}
                          style={{
                            borderInlineStart: '2px solid rgba(1,200,83,0.35)',
                            paddingInlineStart: 8,
                            marginBottom: 8
                          }}
                        >
                          <div className="tb-group__title">
                            <span className="tb-eyebrow">{T('Sub-column', 'عمود فرعي')}</span>
                            <button
                              type="button"
                              className="tb-layer__action"
                              aria-label={T('Delete sub-column', 'حذف العمود الفرعي')}
                              onClick={() => onCommand({
                                type: 'DELETE_COLUMN', sectionId: selectedSection.id, columnId: child.id
                              })}
                            >
                              <FaTrash />
                            </button>
                          </div>
                          <Row>
                            <TextInput label={T('Label (EN)', 'العنوان (إنجليزي)')} dir="ltr" value={child.label?.en} onChange={(v) => onCommand({ type: 'UPDATE_COLUMN', sectionId: selectedSection.id, columnId: child.id, patch: { label: { en: v } } })} />
                            <TextInput label={T('Label (AR)', 'العنوان (عربي)')} dir="rtl" value={child.label?.ar} onChange={(v) => onCommand({ type: 'UPDATE_COLUMN', sectionId: selectedSection.id, columnId: child.id, patch: { label: { ar: v } } })} />
                          </Row>
                          {renderLeafColumnControls(child)}
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="tb-icon-button" style={{ flex: 1 }} onClick={() => onCommand({ type: 'ADD_COLUMN', sectionId: selectedSection.id, parentId: column.id })}>
                          {T('Add sub-column', 'إضافة عمود فرعي')}
                        </button>
                        <button type="button" className="tb-icon-button" style={{ flex: 1 }} onClick={() => onCommand({ type: 'MERGE_COLUMN', sectionId: selectedSection.id, columnId: column.id })}>
                          {T('Remove split', 'إزالة التقسيم')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </Group>
          </>
        ) : (
          <Group
            title={T('Fields', 'الحقول')}
            action={(
              <button
                type="button"
                className="tb-layer__action"
                aria-label={T('Add field', 'إضافة حقل')}
                onClick={() => onCommand({ type: 'ADD_FIELD', sectionId: selectedSection.id })}
              >
                <FaPlus />
              </button>
            )}
          >
            {selectedSection.fields.length === 0 && (
              <div className="tb-empty">{T('No fields yet.', 'لا توجد حقول بعد.')}</div>
            )}
            {selectedSection.fields.map((field) => (
              <button
                key={field.key}
                type="button"
                className="tb-layer"
                aria-current={selection.fieldKey === field.key ? 'true' : undefined}
                onClick={() => onSelect({
                  kind: 'field',
                  blockId: selectedBlock?.id,
                  sectionId: selectedSection.id,
                  fieldKey: field.key
                })}
              >
                <span className="tb-layer__name">
                  {(isArabic ? field.label?.ar : field.label?.en) || T('Untitled field', 'حقل بدون اسم')}
                </span>
                <span className="tb-chip">{field.grid.w}/{GRID_COLUMNS}</span>
              </button>
            ))}
          </Group>
        )}
      </>
    );
  };

  /* --------------------------------------------------------------- field */

  const renderField = () => {
    const display = selectedField.pdfDisplay || {};
    const fieldLayout = selectedField.layout || {};
    return (
      <>
        <Group
          title={T('Field', 'الحقل')}
          action={(
            <span style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                className="tb-layer__action"
                aria-label={T('Duplicate field', 'تكرار الحقل')}
                onClick={() => onCommand({
                  type: 'DUPLICATE_FIELD', sectionId: selectedSection.id, fieldKey: selectedField.key
                })}
              >
                <FaClone />
              </button>
              <button
                type="button"
                className="tb-layer__action"
                aria-label={T('Delete field', 'حذف الحقل')}
                onClick={() => {
                  onCommand({ type: 'DELETE_FIELD', sectionId: selectedSection.id, fieldKey: selectedField.key });
                  onSelect({ kind: 'block', blockId: selectedBlock?.id, sectionId: selectedSection.id });
                }}
              >
                <FaTrash />
              </button>
            </span>
          )}
        >
          <Row>
            <TextInput label={T('Label (EN)', 'التسمية (إنجليزي)')} dir="ltr" value={selectedField.label?.en} onChange={(v) => setField({ label: { en: v } })} />
            <TextInput label={T('Label (AR)', 'التسمية (عربي)')} dir="rtl" value={selectedField.label?.ar} onChange={(v) => setField({ label: { ar: v } })} />
          </Row>
          <SelectInput label={T('Type', 'النوع')} value={selectedField.type} options={options(FIELD_TYPES)} onChange={(v) => setField({ type: v })} />
          <Row columns={3}>
            <NumberInput
              label={T('Column', 'العمود')}
              value={selectedField.grid.x + 1}
              min={1}
              max={GRID_COLUMNS}
              onChange={(v) => onCommand({
                type: 'MOVE_FIELD',
                sectionId: selectedSection.id,
                fieldKey: selectedField.key,
                row: selectedField.grid.row,
                x: (v || 1) - 1
              })}
            />
            <NumberInput
              label={T('Width', 'العرض')}
              value={selectedField.grid.w}
              min={1}
              max={GRID_COLUMNS}
              onChange={(v) => onCommand({
                type: 'RESIZE_FIELD', sectionId: selectedSection.id, fieldKey: selectedField.key, w: v || 1
              })}
            />
            <NumberInput
              label={T('Row', 'الصف')}
              value={selectedField.grid.row + 1}
              min={1}
              onChange={(v) => onCommand({
                type: 'MOVE_FIELD',
                sectionId: selectedSection.id,
                fieldKey: selectedField.key,
                row: (v || 1) - 1,
                x: selectedField.grid.x
              })}
            />
          </Row>
          <Toggle label={T('Required', 'مطلوب')} checked={selectedField.required} onChange={(v) => setField({ required: v })} />
          <Toggle label={T('Visible', 'ظاهر')} checked={selectedField.visible !== false} onChange={(v) => setField({ visible: v })} />
        </Group>

        {selectedField.type === 'select' && (
          <Group
            title={T('Choices', 'الخيارات')}
            action={(
              <button
                type="button"
                className="tb-layer__action"
                aria-label={T('Add choice', 'إضافة خيار')}
                onClick={() => setField({ options: [...(selectedField.options || []), { en: '', ar: '' }] })}
              >
                <FaPlus />
              </button>
            )}
          >
            {(selectedField.options || []).map((option, index) => (
              <Row key={index}>
                <TextInput
                  label={`${T('Option', 'خيار')} ${index + 1} (EN)`}
                  dir="ltr"
                  value={option.en}
                  onChange={(v) => setField({
                    options: selectedField.options.map((item, i) => (i === index ? { ...item, en: v } : item))
                  })}
                />
                <TextInput
                  label={`${T('Option', 'خيار')} ${index + 1} (AR)`}
                  dir="rtl"
                  value={option.ar}
                  onChange={(v) => setField({
                    options: selectedField.options.map((item, i) => (i === index ? { ...item, ar: v } : item))
                  })}
                />
              </Row>
            ))}
          </Group>
        )}

        {selectedField.type === 'static_text' && (
          <Group title={T('Fixed text', 'النص الثابت')}>
            <TextArea label={T('English', 'إنجليزي')} dir="ltr" value={selectedField.defaultValue?.en} onChange={(v) => setField({ defaultValue: { en: v } })} />
            <TextArea label={T('Arabic', 'عربي')} dir="rtl" value={selectedField.defaultValue?.ar} onChange={(v) => setField({ defaultValue: { ar: v } })} />
          </Group>
        )}

        {selectedField.type === 'image' && (
          <Group title={T('Image box', 'صندوق الصورة')}>
            <Row>
              <NumberInput label={T('Width', 'العرض')} suffix="px" value={fieldLayout.imageWidth} min={40} max={1200} onChange={(v) => setField({ layout: { imageWidth: v } })} />
              <NumberInput label={T('Height', 'الارتفاع')} suffix="px" value={fieldLayout.imageHeight} min={40} max={1200} onChange={(v) => setField({ layout: { imageHeight: v } })} />
            </Row>
            <Row columns={3}>
              <SelectInput label={T('Fit', 'الملاءمة')} value={fieldLayout.objectFit} options={options(['cover', 'contain', 'fill'])} onChange={(v) => setField({ layout: { objectFit: v } })} />
              <NumberInput label={T('Radius', 'الاستدارة')} value={fieldLayout.borderRadius} min={0} max={80} onChange={(v) => setField({ layout: { borderRadius: v } })} />
              <NumberInput label={T('Border', 'الحد')} value={fieldLayout.borderWidth} min={0} max={20} onChange={(v) => setField({ layout: { borderWidth: v } })} />
            </Row>
            <Row>
              <ColorInput label={T('Border colour', 'لون الحد')} value={fieldLayout.borderColor} onChange={(v) => setField({ layout: { borderColor: v } })} />
              <ColorInput label={T('Background', 'الخلفية')} value={fieldLayout.backgroundColor} onChange={(v) => setField({ layout: { backgroundColor: v } })} />
            </Row>
          </Group>
        )}

        <Group title={T('Appearance', 'المظهر')}>
          <Toggle label={T('Show label', 'إظهار التسمية')} checked={display.showLabel !== false} onChange={(v) => setField({ pdfDisplay: { showLabel: v } })} />
          <Toggle label={T('Show value', 'إظهار القيمة')} checked={display.showValue !== false} onChange={(v) => setField({ pdfDisplay: { showValue: v } })} />
          <Toggle label={T('Bold value', 'قيمة عريضة')} checked={display.bold === true} onChange={(v) => setField({ pdfDisplay: { bold: v } })} />
          <Row>
            <NumberInput label={T('Font size', 'حجم الخط')} suffix="pt" value={display.fontSize} min={5} max={36} onChange={(v) => setField({ pdfDisplay: { fontSize: v } })} />
            <SelectInput label={T('Align', 'المحاذاة')} value={display.alignment} options={options(['left', 'center', 'right'])} onChange={(v) => setField({ pdfDisplay: { alignment: v } })} />
          </Row>
          <Row>
            <TextInput label={T('Placeholder (EN)', 'تلميح (إنجليزي)')} dir="ltr" value={selectedField.placeholder?.en} onChange={(v) => setField({ placeholder: { en: v } })} />
            <TextInput label={T('Placeholder (AR)', 'تلميح (عربي)')} dir="rtl" value={selectedField.placeholder?.ar} onChange={(v) => setField({ placeholder: { ar: v } })} />
          </Row>
        </Group>
      </>
    );
  };

  /* -------------------------------------------------------------- render */

  const body = () => {
    if (selection.kind === 'document') return renderDocument();
    if (selectedField) return renderField();
    if (!selectedBlock) {
      return <div className="tb-empty">{T('Select something on the page.', 'اختر عنصراً من الصفحة.')}</div>;
    }

    return (
      <>
        {renderBlockCommon()}
        {selectedBlock.type === 'header' && renderHeaderBlock()}
        {selectedBlock.type === 'metadata' && renderMetadataBlock()}
        {selectedBlock.type === 'signature' && renderSignatureBlock()}
        {selectedBlock.type === 'footer' && renderFooterBlock()}
        {selectedBlock.type === 'watermark' && renderWatermarkBlock()}
        {selectedBlock.type === 'section' && selectedSection && renderSection()}
        {renderSimpleBlock()}
      </>
    );
  };

  return (
    <aside className="tb-panel tb-panel--end" aria-label={T('Properties', 'الخصائص')}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
        <div className="tb-eyebrow">{subtitle}</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{title}</div>
      </div>

      <div className="tb-panel__scroll">
        {blockOverflows.map((item, index) => (
          <div className="tb-warning" key={index}>
            <FaExclamationTriangle style={{ marginTop: 2, flex: 'none' }} />
            <span>{isArabic ? item.messageAr : item.message}</span>
          </div>
        ))}
        {body()}
      </div>
    </aside>
  );
};

export default InspectorPanel;
