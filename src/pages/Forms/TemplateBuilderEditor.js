import React from 'react';
import {
  FaArrowDown,
  FaArrowUp,
  FaCheck,
  FaCopy,
  FaPlus,
  FaTrash
} from 'react-icons/fa';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import {
  FIELD_TYPE_OPTIONS,
  SECTION_LAYOUT_OPTIONS,
  SECTION_TYPE_OPTIONS,
  WIDTH_OPTIONS,
  getLocalizedText,
  mirrorEnglishToArabic
} from './templateBuilderUtils';

export const EmptyEditorState = ({ title, description }) => (
  <div className="rounded-[24px] border border-dashed border-primary/25 bg-primary/5 px-6 py-10 text-center">
    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
    <p className="mt-2 text-sm text-gray-500">{description}</p>
  </div>
);

export const InputLabel = ({ label }) => (
  <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
);

export const TextInput = ({ label, value, onChange, placeholder = '', dir = 'ltr' }) => (
  <div>
    <InputLabel label={label} />
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      dir={dir}
      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  </div>
);

export const TextAreaInput = ({ label, value, onChange, rows = 3, dir = 'ltr' }) => (
  <div>
    <InputLabel label={label} />
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      dir={dir}
      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  </div>
);

export const SelectField = ({ label, value, onChange, options, isRTL }) => (
  <div>
    <InputLabel label={label} />
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {isRTL ? option.labelAr || option.label : option.label || option.labelAr}
        </option>
      ))}
    </select>
  </div>
);

export const NumberInput = ({ label, value, onChange, min = 0, max }) => (
  <div>
    <InputLabel label={label} />
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  </div>
);

export const ColorInput = ({ label, value, onChange }) => (
  <div>
    <InputLabel label={label} />
    <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-white px-3 py-2 shadow-sm">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-12 rounded-xl border-0 bg-transparent p-0"
      />
      <div className="text-sm font-semibold text-gray-700">{value}</div>
    </div>
  </div>
);

export const Checkbox = ({ label, checked, onChange }) => (
  <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
    />
    <span>{label}</span>
  </label>
);

const IconButton = ({ onClick, title, icon: Icon, danger = false }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`rounded-xl border px-3 py-2 transition ${danger ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-gray-200 text-gray-600 hover:border-primary/30 hover:bg-primary/5 hover:text-primary'}`}
  >
    <Icon className="text-sm" />
  </button>
);

const FieldEditorCard = ({ field, isRTL, onChange, onDuplicate, onRemove, onMoveUp, onMoveDown }) => (
  <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-primary/5 p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h4 className="text-sm font-semibold text-gray-900">
          {getLocalizedText(field.label, isRTL, isRTL ? 'حقل جديد' : 'New field')}
        </h4>
        <p className="text-xs text-gray-500">{field.type}</p>
      </div>
      <div className="flex items-center gap-1">
        <IconButton onClick={onMoveUp} title={isRTL ? 'لأعلى' : 'Move up'} icon={FaArrowUp} />
        <IconButton onClick={onMoveDown} title={isRTL ? 'لأسفل' : 'Move down'} icon={FaArrowDown} />
        <IconButton onClick={onDuplicate} title={isRTL ? 'نسخ' : 'Duplicate'} icon={FaCopy} />
        <IconButton onClick={onRemove} title={isRTL ? 'حذف' : 'Delete'} icon={FaTrash} danger />
      </div>
    </div>

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <TextInput label={isRTL ? 'الاسم بالإنجليزية' : 'English label'} value={field.label.en} onChange={(value) => onChange({ ...field, label: mirrorEnglishToArabic(field.label, value) })} />
      <TextInput label={isRTL ? 'الاسم بالعربية' : 'Arabic label'} value={field.label.ar} dir="rtl" onChange={(value) => onChange({ ...field, label: { ...field.label, ar: value } })} />
      <SelectField label={isRTL ? 'نوع الحقل' : 'Field type'} value={field.type} onChange={(value) => onChange({ ...field, type: value })} options={FIELD_TYPE_OPTIONS} isRTL={isRTL} />
      <SelectField label={isRTL ? 'عرض الحقل' : 'Field width'} value={field.width || 'full'} onChange={(value) => onChange({ ...field, width: value })} options={WIDTH_OPTIONS} isRTL={isRTL} />
      <SelectField
        label={isRTL ? 'محاذاة القيمة' : 'Value alignment'}
        value={field.pdfDisplay?.alignment || 'left'}
        onChange={(value) => onChange({ ...field, pdfDisplay: { ...field.pdfDisplay, alignment: value } })}
        options={[
          { value: 'left', label: 'Left', labelAr: 'يسار' },
          { value: 'center', label: 'Center', labelAr: 'وسط' },
          { value: 'right', label: 'Right', labelAr: 'يمين' }
        ]}
        isRTL={isRTL}
      />
      <NumberInput label={isRTL ? 'حجم الخط' : 'Font size'} value={field.pdfDisplay?.fontSize ?? 14} min={10} onChange={(value) => onChange({ ...field, pdfDisplay: { ...field.pdfDisplay, fontSize: value } })} />
    </div>

    <div className="mt-4 flex flex-wrap gap-4">
      <Checkbox label={isRTL ? 'مطلوب' : 'Required'} checked={field.required || false} onChange={(checked) => onChange({ ...field, required: checked })} />
      <Checkbox label={isRTL ? 'ظاهر' : 'Visible'} checked={field.visible !== false} onChange={(checked) => onChange({ ...field, visible: checked })} />
      <Checkbox label={isRTL ? 'إظهار الاسم' : 'Show label'} checked={field.pdfDisplay?.showLabel !== false} onChange={(checked) => onChange({ ...field, pdfDisplay: { ...field.pdfDisplay, showLabel: checked } })} />
      <Checkbox label={isRTL ? 'قيمة عريضة' : 'Bold value'} checked={field.pdfDisplay?.bold || false} onChange={(checked) => onChange({ ...field, pdfDisplay: { ...field.pdfDisplay, bold: checked } })} />
    </div>

    {field.type === 'select' && (
      <div className="mt-4 rounded-2xl bg-primary/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">{isRTL ? 'خيارات القائمة' : 'Select options'}</div>
          <button
            type="button"
            onClick={() => onChange({ ...field, options: [...(field.options || []), { en: '', ar: '' }] })}
            className="text-sm font-semibold text-primary"
          >
            + {isRTL ? 'إضافة خيار' : 'Add option'}
          </button>
        </div>

        <div className="space-y-3">
          {(field.options || []).map((option, optionIndex) => (
            <div key={`${field.key}_opt_${optionIndex}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <TextInput
                label={isRTL ? 'إنجليزي' : 'English'}
                value={option.en}
                onChange={(value) => {
                  const options = [...(field.options || [])];
                  options[optionIndex] = mirrorEnglishToArabic(options[optionIndex], value);
                  onChange({ ...field, options });
                }}
              />
              <TextInput
                label={isRTL ? 'عربي' : 'Arabic'}
                value={option.ar}
                dir="rtl"
                onChange={(value) => {
                  const options = [...(field.options || [])];
                  options[optionIndex] = { ...options[optionIndex], ar: value };
                  onChange({ ...field, options });
                }}
              />
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => onChange({ ...field, options: field.options.filter((_, index) => index !== optionIndex) })}
                  className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"
                >
                  {isRTL ? 'حذف' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {field.type === 'static_text' && (
      <div className="mt-4 rounded-2xl bg-primary/5 p-4">
        <div className="mb-3 text-sm font-semibold text-gray-900">
          {isRTL ? 'محتوى النص الثابت' : 'Fixed text content'}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <TextAreaInput
            label={isRTL ? 'النص بالإنجليزية' : 'English text'}
            value={field.defaultValue?.en || ''}
            rows={4}
            onChange={(value) => onChange({ ...field, defaultValue: mirrorEnglishToArabic(field.defaultValue, value) })}
          />
          <TextAreaInput
            label={isRTL ? 'النص بالعربية' : 'Arabic text'}
            value={field.defaultValue?.ar || ''}
            rows={4}
            dir="rtl"
            onChange={(value) => onChange({ ...field, defaultValue: { ...field.defaultValue, ar: value } })}
          />
        </div>
      </div>
    )}
  </div>
);

const ColumnEditorCard = ({ column, isRTL, onChange, onRemove, onMoveUp, onMoveDown }) => (
  <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-primary/5 p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h4 className="text-sm font-semibold text-gray-900">
          {getLocalizedText(column.label, isRTL, isRTL ? 'عمود جديد' : 'New column')}
        </h4>
        <p className="text-xs text-gray-500">{column.fieldType}</p>
      </div>
      <div className="flex items-center gap-1">
        <IconButton onClick={onMoveUp} title={isRTL ? 'لأعلى' : 'Move up'} icon={FaArrowUp} />
        <IconButton onClick={onMoveDown} title={isRTL ? 'لأسفل' : 'Move down'} icon={FaArrowDown} />
        <IconButton onClick={onRemove} title={isRTL ? 'حذف' : 'Delete'} icon={FaTrash} danger />
      </div>
    </div>

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <TextInput label={isRTL ? 'الاسم بالإنجليزية' : 'English label'} value={column.label.en} onChange={(value) => onChange({ ...column, label: mirrorEnglishToArabic(column.label, value) })} />
      <TextInput label={isRTL ? 'الاسم بالعربية' : 'Arabic label'} value={column.label.ar} dir="rtl" onChange={(value) => onChange({ ...column, label: { ...column.label, ar: value } })} />
      <SelectField label={isRTL ? 'نوع البيانات' : 'Data type'} value={column.fieldType || 'text'} onChange={(value) => onChange({ ...column, fieldType: value === 'static_text' ? 'text' : value })} options={FIELD_TYPE_OPTIONS.filter((option) => option.value !== 'static_text')} isRTL={isRTL} />
      <SelectField
        label={isRTL ? 'محاذاة' : 'Alignment'}
        value={column.alignment || 'left'}
        onChange={(value) => onChange({ ...column, alignment: value })}
        options={[
          { value: 'left', label: 'Left', labelAr: 'يسار' },
          { value: 'center', label: 'Center', labelAr: 'وسط' },
          { value: 'right', label: 'Right', labelAr: 'يمين' }
        ]}
        isRTL={isRTL}
      />
      <TextInput label={isRTL ? 'عرض العمود (مثل 2fr أو 220px)' : 'Column width (eg 2fr or 220px)'} value={column.width === 'auto' ? '' : column.width} onChange={(value) => onChange({ ...column, width: value || 'auto' })} />
      <div className="grid gap-3 md:grid-cols-2">
        <ColorInput label={isRTL ? 'لون الرأس' : 'Header background'} value={column.headerStyle?.backgroundColor || '#f3f4f6'} onChange={(value) => onChange({ ...column, headerStyle: { ...column.headerStyle, backgroundColor: value } })} />
        <ColorInput label={isRTL ? 'لون النص' : 'Header text'} value={column.headerStyle?.textColor || '#111827'} onChange={(value) => onChange({ ...column, headerStyle: { ...column.headerStyle, textColor: value } })} />
      </div>
    </div>
  </div>
);

const SectionEditor = ({
  section,
  sectionIndex = 0,
  sectionCount = 1,
  messages = [],
  isRTL,
  onUpdateSection,
  onDuplicateSection,
  onDeleteSection,
  onMoveSectionUp,
  onMoveSectionDown,
  onAddField,
  onUpdateField,
  onDuplicateField,
  onDeleteField,
  onMoveField,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onMoveColumn
}) => {
  const layoutType = section.advancedLayout?.layoutType || 'simple';

  return (
    <div className="space-y-6">
      <Card className="border border-primary/10 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
              {isRTL ? 'القسم الحالي' : 'Current Section'}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {getLocalizedText(section.label, isRTL, isRTL ? 'قسم جديد' : 'New Section')}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isRTL
                ? `تعمل الآن داخل تبويب مستقل لهذا القسم.${sectionCount > 1 ? ` هذا القسم ${sectionIndex + 1} من ${sectionCount}.` : ''}`
                : `You are editing this section inside its own tab.${sectionCount > 1 ? ` This is section ${sectionIndex + 1} of ${sectionCount}.` : ''}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onDuplicateSection} variant="outline" icon={FaCopy} className="!px-4 !py-2">
              {isRTL ? 'نسخ القسم' : 'Duplicate'}
            </Button>
            <Button onClick={onMoveSectionUp} variant="outline" icon={FaArrowUp} className="!px-4 !py-2">
              {isRTL ? 'لأعلى' : 'Up'}
            </Button>
            <Button onClick={onMoveSectionDown} variant="outline" icon={FaArrowDown} className="!px-4 !py-2">
              {isRTL ? 'لأسفل' : 'Down'}
            </Button>
            <Button onClick={onDeleteSection} variant="danger" icon={FaTrash} className="!px-4 !py-2">
              {isRTL ? 'حذف' : 'Delete'}
            </Button>
          </div>
        </div>

        {messages.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-red-200 bg-red-50 p-3">
            {messages.map((message, index) => (
              <span key={`${message}_${index}`} className="rounded-full bg-white px-3 py-1 text-sm text-red-700 shadow-sm">
                {message}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextInput label={isRTL ? 'اسم القسم بالإنجليزية' : 'English section name'} value={section.label.en} onChange={(value) => onUpdateSection({ ...section, label: mirrorEnglishToArabic(section.label, value) })} />
          <TextInput label={isRTL ? 'اسم القسم بالعربية' : 'Arabic section name'} value={section.label.ar} dir="rtl" onChange={(value) => onUpdateSection({ ...section, label: { ...section.label, ar: value } })} />
          <SelectField label={isRTL ? 'نوع القسم' : 'Section type'} value={section.sectionType || 'normal'} onChange={(value) => onUpdateSection({ ...section, sectionType: value })} options={SECTION_TYPE_OPTIONS} isRTL={isRTL} />
          <NumberInput label={isRTL ? 'المسافة أسفل القسم' : 'Space below section'} value={section.pdfStyle?.marginBottom ?? 16} min={0} onChange={(value) => onUpdateSection({ ...section, pdfStyle: { ...section.pdfStyle, marginBottom: value } })} />
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <Checkbox label={isRTL ? 'إظهار القسم' : 'Show section'} checked={section.visible !== false} onChange={(checked) => onUpdateSection({ ...section, visible: checked })} />
          <Checkbox label={isRTL ? 'إظهار عنوان القسم' : 'Show section title'} checked={section.advancedLayout?.styling?.showTitle !== false} onChange={(checked) => onUpdateSection({ ...section, advancedLayout: { ...section.advancedLayout, styling: { ...section.advancedLayout.styling, showTitle: checked } } })} />
          <Checkbox label={isRTL ? 'إظهار الحدود' : 'Show border'} checked={section.pdfStyle?.showBorder !== false} onChange={(checked) => onUpdateSection({ ...section, pdfStyle: { ...section.pdfStyle, showBorder: checked } })} />
          <Checkbox label={isRTL ? 'إظهار الخلفية' : 'Show background'} checked={section.pdfStyle?.showBackground || false} onChange={(checked) => onUpdateSection({ ...section, pdfStyle: { ...section.pdfStyle, showBackground: checked } })} />
        </div>
      </Card>

      <Card className="border border-primary/10 bg-white">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">{isRTL ? 'التخطيط' : 'Layout'}</p>
          <h3 className="mt-1 text-xl font-bold text-gray-900">
            {isRTL ? 'اختر طريقة عرض هذا القسم' : 'Choose how this section should render'}
          </h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {SECTION_LAYOUT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = layoutType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onUpdateSection({ ...section, advancedLayout: { ...section.advancedLayout, layoutType: option.value } })}
                className={`rounded-[24px] border p-4 text-left transition-all ${isActive ? 'border-primary bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg' : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-md'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isActive ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'}`}>
                    <Icon />
                  </div>
                  {isActive && <FaCheck className="text-sm" />}
                </div>
                <div className="mt-4 text-base font-semibold">{isRTL ? option.labelAr : option.label}</div>
                <p className={`mt-1 text-sm ${isActive ? 'text-white/75' : 'text-gray-500'}`}>
                  {isRTL ? option.descriptionAr : option.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {layoutType === 'columns' && (
            <>
              <NumberInput
                label={isRTL ? 'عدد الأعمدة' : 'Column count'}
                value={section.advancedLayout?.columns?.columnCount ?? 2}
                min={1}
                max={4}
                onChange={(value) => onUpdateSection({
                  ...section,
                  advancedLayout: {
                    ...section.advancedLayout,
                    columns: {
                      ...section.advancedLayout.columns,
                      enabled: true,
                      columnCount: value
                    }
                  }
                })}
              />
              <NumberInput
                label={isRTL ? 'المسافة بين الأعمدة' : 'Column gap'}
                value={section.advancedLayout?.columns?.columnGap ?? 20}
                min={0}
                onChange={(value) => onUpdateSection({
                  ...section,
                  advancedLayout: {
                    ...section.advancedLayout,
                    columns: {
                      ...section.advancedLayout.columns,
                      enabled: true,
                      columnGap: value
                    }
                  }
                })}
              />
              <TextInput
                label={isRTL ? 'تقسيم العرض (مثل 2fr 1fr)' : 'Width split (eg 2fr 1fr)'}
                value={section.advancedLayout?.columns?.columnWidths?.join(' ') || ''}
                onChange={(value) => onUpdateSection({
                  ...section,
                  advancedLayout: {
                    ...section.advancedLayout,
                    columns: {
                      ...section.advancedLayout.columns,
                      enabled: true,
                      equalWidths: value.trim() === '',
                      columnWidths: value.trim() ? value.trim().split(/\s+/) : []
                    }
                  }
                })}
              />
            </>
          )}

          {layoutType === 'grid' && (
            <>
              <NumberInput
                label={isRTL ? 'عدد أعمدة الشبكة' : 'Grid columns'}
                value={section.advancedLayout?.grid?.columns ?? 2}
                min={1}
                max={4}
                onChange={(value) => onUpdateSection({
                  ...section,
                  advancedLayout: {
                    ...section.advancedLayout,
                    grid: {
                      ...section.advancedLayout.grid,
                      enabled: true,
                      columns: value
                    }
                  }
                })}
              />
              <NumberInput
                label={isRTL ? 'المسافة بين العناصر' : 'Grid gap'}
                value={section.advancedLayout?.grid?.gap ?? 12}
                min={0}
                onChange={(value) => onUpdateSection({
                  ...section,
                  advancedLayout: {
                    ...section.advancedLayout,
                    grid: {
                      ...section.advancedLayout.grid,
                      enabled: true,
                      gap: value
                    }
                  }
                })}
              />
            </>
          )}

          {layoutType === 'table' && (
            <>
              <NumberInput
                label={isRTL ? 'عدد الصفوف الفارغة' : 'Printable rows'}
                value={section.advancedLayout?.table?.numberOfRows ?? 6}
                min={1}
                onChange={(value) => onUpdateSection({
                  ...section,
                  advancedLayout: {
                    ...section.advancedLayout,
                    table: {
                      ...section.advancedLayout.table,
                      enabled: true,
                      numberOfRows: value
                    }
                  }
                })}
              />
              <div className="rounded-2xl bg-primary/5 p-4">
                <div className="flex flex-wrap gap-4">
                  <Checkbox
                    label={isRTL ? 'إظهار رأس الجدول' : 'Show header'}
                    checked={section.advancedLayout?.table?.showHeader !== false}
                    onChange={(checked) => onUpdateSection({
                      ...section,
                      advancedLayout: {
                        ...section.advancedLayout,
                        table: {
                          ...section.advancedLayout.table,
                          enabled: true,
                          showHeader: checked
                        }
                      }
                    })}
                  />
                  <Checkbox
                    label={isRTL ? 'إظهار الحدود' : 'Show borders'}
                    checked={section.advancedLayout?.table?.showBorders !== false}
                    onChange={(checked) => onUpdateSection({
                      ...section,
                      advancedLayout: {
                        ...section.advancedLayout,
                        table: {
                          ...section.advancedLayout.table,
                          enabled: true,
                          showBorders: checked
                        }
                      }
                    })}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="border border-primary/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
              {layoutType === 'table' ? (isRTL ? 'أعمدة الجدول' : 'Table Columns') : (isRTL ? 'حقول القسم' : 'Section Fields')}
            </p>
            <h3 className="mt-1 text-xl font-bold text-gray-900">
              {layoutType === 'table' ? (isRTL ? 'عدّل الأعمدة مباشرة' : 'Edit columns directly') : (isRTL ? 'أضف ونسّق الحقول بسرعة' : 'Add and style fields quickly')}
            </h3>
          </div>
          {layoutType === 'table' ? (
            <Button onClick={onAddColumn} icon={FaPlus}>{isRTL ? 'إضافة عمود' : 'Add Column'}</Button>
          ) : (
            <Button onClick={onAddField} icon={FaPlus}>{isRTL ? 'إضافة حقل' : 'Add Field'}</Button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {layoutType === 'table' ? (
            section.advancedLayout?.table?.columns?.length ? (
              section.advancedLayout.table.columns.map((column, index) => (
                <ColumnEditorCard
                  key={column.id}
                  column={column}
                  isRTL={isRTL}
                  onChange={(nextColumn) => onUpdateColumn(column.id, nextColumn)}
                  onRemove={() => onDeleteColumn(column.id)}
                  onMoveUp={() => onMoveColumn(index, 'up')}
                  onMoveDown={() => onMoveColumn(index, 'down')}
                />
              ))
            ) : (
              <EmptyEditorState title={isRTL ? 'لا توجد أعمدة بعد' : 'No columns yet'} description={isRTL ? 'ابدأ بإضافة الأعمدة التي تريدها في الـ PDF.' : 'Start by adding the columns you want in the PDF.'} />
            )
          ) : (
            section.fields?.length ? (
              section.fields.map((field, index) => (
                <FieldEditorCard
                  key={field.key}
                  field={field}
                  isRTL={isRTL}
                  onChange={(nextField) => onUpdateField(field.key, nextField)}
                  onDuplicate={() => onDuplicateField(field.key)}
                  onRemove={() => onDeleteField(field.key)}
                  onMoveUp={() => onMoveField(index, 'up')}
                  onMoveDown={() => onMoveField(index, 'down')}
                />
              ))
            ) : (
              <EmptyEditorState title={isRTL ? 'لا توجد حقول بعد' : 'No fields yet'} description={isRTL ? 'أضف أول حقل أو بدّل التخطيط إلى جدول.' : 'Add your first field or switch this section to a table layout.'} />
            )
          )}
        </div>
      </Card>

      <Card className="border border-primary/10 bg-white">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">{isRTL ? 'ستايل القسم' : 'Section Style'}</p>
          <h3 className="mt-1 text-xl font-bold text-gray-900">
            {isRTL ? 'ألوان ومسافات سريعة' : 'Quick colors and spacing'}
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ColorInput
            label={isRTL ? 'لون الحدود' : 'Border color'}
            value={section.advancedLayout?.styling?.borderColor || '#d1d5db'}
            onChange={(value) => onUpdateSection({
              ...section,
              advancedLayout: {
                ...section.advancedLayout,
                styling: {
                  ...section.advancedLayout.styling,
                  borderColor: value
                }
              },
              pdfStyle: {
                ...section.pdfStyle,
                borderColor: value
              }
            })}
          />
          <ColorInput
            label={isRTL ? 'لون الخلفية' : 'Background color'}
            value={section.pdfStyle?.backgroundColor || '#ffffff'}
            onChange={(value) => onUpdateSection({
              ...section,
              pdfStyle: {
                ...section.pdfStyle,
                backgroundColor: value
              }
            })}
          />
          <NumberInput
            label={isRTL ? 'حشو داخلي' : 'Padding'}
            value={section.pdfStyle?.padding ?? 12}
            min={0}
            onChange={(value) => onUpdateSection({
              ...section,
              pdfStyle: {
                ...section.pdfStyle,
                padding: value
              }
            })}
          />
          <NumberInput
            label={isRTL ? 'سماكة الحدود' : 'Border width'}
            value={section.pdfStyle?.borderWidth ?? 1}
            min={0}
            onChange={(value) => onUpdateSection({
              ...section,
              pdfStyle: {
                ...section.pdfStyle,
                borderWidth: value
              }
            })}
          />
        </div>
      </Card>
    </div>
  );
};

export default SectionEditor;
