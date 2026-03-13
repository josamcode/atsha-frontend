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
  createColumn,
  FIELD_TYPE_OPTIONS,
  SECTION_LAYOUT_OPTIONS,
  SECTION_TYPE_OPTIONS,
  WIDTH_OPTIONS,
  getLocalizedText,
  mirrorArabicToEnglish
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

export const NumberInput = ({ label, value, onChange, min, max }) => (
  <div>
    <InputLabel label={label} />
    <input
      type="number"
      value={value}
      min={min ?? undefined}
      max={max ?? undefined}
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

export const Checkbox = ({ label, checked, onChange, isRTL = false, disabled = false }) => {
  const stateLabel = checked ? (isRTL ? 'مفعل' : 'On') : (isRTL ? 'متوقف' : 'Off');
  const knobTranslateClass = isRTL
    ? (checked ? '-translate-x-5' : 'translate-x-0')
    : (checked ? 'translate-x-5' : 'translate-x-0');

  return (
    <label
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`inline-flex min-w-[180px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm transition focus-within:ring-2 focus-within:ring-primary/20 ${checked
        ? 'border-primary/30 bg-primary/10'
        : 'border-gray-200 bg-white hover:border-primary/20 hover:bg-primary/5'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
        <span className="block truncate font-semibold text-gray-800">{label}</span>
      </div>
      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className={`text-xs font-bold ${checked ? 'text-primary' : 'text-gray-400'}`}>
          {stateLabel}
        </span>
        <span
          className={`relative inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors ${checked
            ? 'bg-primary shadow-[0_10px_24px_rgba(212,185,0,0.28)]'
            : 'bg-slate-300'
            }`}
        >
          <span
            className={`absolute h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${isRTL ? 'right-1' : 'left-1'} ${knobTranslateClass}`}
          />
        </span>
      </div>
    </label>
  );
};

const COLUMN_WIDTH_OPTIONS = [
  { value: 'auto', label: 'Auto', labelAr: 'تلقائي' },
  { value: '1fr', label: '1fr', labelAr: '1fr' },
  { value: '1.5fr', label: '1.5fr', labelAr: '1.5fr' },
  { value: '2fr', label: '2fr', labelAr: '2fr' },
  { value: '3fr', label: '3fr', labelAr: '3fr' },
  { value: '120px', label: '120px', labelAr: '120px' },
  { value: '160px', label: '160px', labelAr: '160px' },
  { value: '200px', label: '200px', labelAr: '200px' },
  { value: '220px', label: '220px', labelAr: '220px' },
  { value: '260px', label: '260px', labelAr: '260px' },
  { value: '320px', label: '320px', labelAr: '320px' }
];

const COLUMN_ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left', labelAr: 'يسار' },
  { value: 'center', label: 'Center', labelAr: 'وسط' },
  { value: 'right', label: 'Right', labelAr: 'يمين' }
];

const IMAGE_FIT_OPTIONS = [
  { value: 'cover', label: 'Cover', labelAr: 'تغطية' },
  { value: 'contain', label: 'Contain', labelAr: 'احتواء' },
  { value: 'fill', label: 'Fill', labelAr: 'تمدد' }
];

const TABLE_FIELD_TYPE_OPTIONS = FIELD_TYPE_OPTIONS.filter(
  (option) => option.value !== 'static_text' && option.value !== 'image'
);

const getColumnWidthOptions = (value) => (
  COLUMN_WIDTH_OPTIONS.some((option) => option.value === value)
    ? COLUMN_WIDTH_OPTIONS
    : [{ value, label: value, labelAr: value }, ...COLUMN_WIDTH_OPTIONS]
);

const buildDefaultChildColumn = (index) => createColumn({
  label: {
    en: `Sub Column ${index + 1}`,
    ar: `عمود فرعي ${index + 1}`
  }
});

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
      <TextInput label={isRTL ? 'الاسم بالإنجليزية' : 'English label'} value={field.label.en} onChange={(value) => onChange({ ...field, label: { ...field.label, en: value } })} />
      <TextInput label={isRTL ? 'الاسم بالعربية' : 'Arabic label'} value={field.label.ar} dir="rtl" onChange={(value) => onChange({ ...field, label: mirrorArabicToEnglish(field.label, value) })} />
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
      <Checkbox label={isRTL ? 'مطلوب' : 'Required'} checked={field.required || false} onChange={(checked) => onChange({ ...field, required: checked })} isRTL={isRTL} />
      <Checkbox label={isRTL ? 'ظاهر' : 'Visible'} checked={field.visible !== false} onChange={(checked) => onChange({ ...field, visible: checked })} isRTL={isRTL} />
      <Checkbox label={isRTL ? 'إظهار الاسم' : 'Show label'} checked={field.pdfDisplay?.showLabel !== false} onChange={(checked) => onChange({ ...field, pdfDisplay: { ...field.pdfDisplay, showLabel: checked } })} isRTL={isRTL} />
      <Checkbox label={isRTL ? 'قيمة عريضة' : 'Bold value'} checked={field.pdfDisplay?.bold || false} onChange={(checked) => onChange({ ...field, pdfDisplay: { ...field.pdfDisplay, bold: checked } })} isRTL={isRTL} />
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
                  options[optionIndex] = { ...options[optionIndex], en: value };
                  onChange({ ...field, options });
                }}
              />
              <TextInput
                label={isRTL ? 'عربي' : 'Arabic'}
                value={option.ar}
                dir="rtl"
                onChange={(value) => {
                  const options = [...(field.options || [])];
                  options[optionIndex] = mirrorArabicToEnglish(options[optionIndex], value);
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
            onChange={(value) => onChange({ ...field, defaultValue: { ...field.defaultValue, en: value } })}
          />
          <TextAreaInput
            label={isRTL ? 'النص بالعربية' : 'Arabic text'}
            value={field.defaultValue?.ar || ''}
            rows={4}
            dir="rtl"
            onChange={(value) => onChange({ ...field, defaultValue: mirrorArabicToEnglish(field.defaultValue, value) })}
          />
        </div>
      </div>
    )}

    {field.type === 'image' && (
      <div className="mt-4 rounded-2xl bg-primary/5 p-4">
        <div className="mb-3 text-sm font-semibold text-gray-900">
          {isRTL ? 'إعدادات الصورة' : 'Image settings'}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <NumberInput
            label={isRTL ? 'عرض الصورة' : 'Image width'}
            value={field.layout?.imageWidth ?? 220}
            min={40}
            onChange={(value) => onChange({ ...field, layout: { ...field.layout, imageWidth: value } })}
          />
          <NumberInput
            label={isRTL ? 'ارتفاع الصورة' : 'Image height'}
            value={field.layout?.imageHeight ?? 160}
            min={40}
            onChange={(value) => onChange({ ...field, layout: { ...field.layout, imageHeight: value } })}
          />
          <SelectField
            label={isRTL ? 'طريقة الملاءمة' : 'Object fit'}
            value={field.layout?.objectFit || 'cover'}
            onChange={(value) => onChange({ ...field, layout: { ...field.layout, objectFit: value } })}
            options={IMAGE_FIT_OPTIONS}
            isRTL={isRTL}
          />
          <NumberInput
            label={isRTL ? 'استدارة الحواف' : 'Border radius'}
            value={field.layout?.borderRadius ?? 16}
            min={0}
            onChange={(value) => onChange({ ...field, layout: { ...field.layout, borderRadius: value } })}
          />
          <NumberInput
            label={isRTL ? 'سمك الإطار' : 'Border width'}
            value={field.layout?.borderWidth ?? 0}
            min={0}
            onChange={(value) => onChange({ ...field, layout: { ...field.layout, borderWidth: value } })}
          />
          <ColorInput
            label={isRTL ? 'لون الإطار' : 'Border color'}
            value={field.layout?.borderColor || '#d1d5db'}
            onChange={(value) => onChange({ ...field, layout: { ...field.layout, borderColor: value } })}
          />
          <ColorInput
            label={isRTL ? 'لون الخلفية' : 'Background color'}
            value={field.layout?.backgroundColor || '#f8fafc'}
            onChange={(value) => onChange({ ...field, layout: { ...field.layout, backgroundColor: value } })}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <Checkbox
            label={isRTL ? 'ظل خفيف' : 'Soft shadow'}
            checked={field.layout?.shadow || false}
            onChange={(checked) => onChange({ ...field, layout: { ...field.layout, shadow: checked } })}
            isRTL={isRTL}
          />
        </div>
      </div>
    )}
  </div>
);

const ChildColumnEditorCard = ({
  column,
  index,
  isRTL,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown
}) => {
  const columnWidthValue = column.width || 'auto';

  return (
    <div className="rounded-2xl border border-dashed border-primary/20 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h5 className="text-sm font-semibold text-gray-900">
            {getLocalizedText(column.label, isRTL, isRTL ? `عمود فرعي ${index + 1}` : `Sub Column ${index + 1}`)}
          </h5>
          <p className="text-xs text-gray-500">{column.fieldType}</p>
        </div>
        <div className="flex items-center gap-1">
          <IconButton onClick={onMoveUp} title={isRTL ? 'لأعلى' : 'Move up'} icon={FaArrowUp} />
          <IconButton onClick={onMoveDown} title={isRTL ? 'لأسفل' : 'Move down'} icon={FaArrowDown} />
          <IconButton onClick={onRemove} title={isRTL ? 'حذف' : 'Delete'} icon={FaTrash} danger />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextInput label={isRTL ? 'الاسم بالإنجليزية' : 'English label'} value={column.label.en} onChange={(value) => onChange({ ...column, label: { ...column.label, en: value } })} />
        <TextInput label={isRTL ? 'الاسم بالعربية' : 'Arabic label'} value={column.label.ar} dir="rtl" onChange={(value) => onChange({ ...column, label: mirrorArabicToEnglish(column.label, value) })} />
        <SelectField
          label={isRTL ? 'نوع البيانات' : 'Data type'}
          value={column.fieldType || 'text'}
          onChange={(value) => onChange({ ...column, fieldType: value === 'static_text' ? 'text' : value })}
          options={TABLE_FIELD_TYPE_OPTIONS}
          isRTL={isRTL}
        />
        <SelectField
          label={isRTL ? 'محاذاة' : 'Alignment'}
          value={column.alignment || 'left'}
          onChange={(value) => onChange({ ...column, alignment: value })}
          options={COLUMN_ALIGNMENT_OPTIONS}
          isRTL={isRTL}
        />
        <SelectField
          label={isRTL ? 'عرض العمود الفرعي' : 'Sub-column width'}
          value={columnWidthValue}
          onChange={(value) => onChange({ ...column, width: value })}
          options={getColumnWidthOptions(columnWidthValue)}
          isRTL={isRTL}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <ColorInput label={isRTL ? 'لون الرأس' : 'Header background'} value={column.headerStyle?.backgroundColor || '#f3f4f6'} onChange={(value) => onChange({ ...column, headerStyle: { ...column.headerStyle, backgroundColor: value } })} />
          <ColorInput label={isRTL ? 'لون النص' : 'Header text'} value={column.headerStyle?.textColor || '#111827'} onChange={(value) => onChange({ ...column, headerStyle: { ...column.headerStyle, textColor: value } })} />
        </div>
      </div>
    </div>
  );
};

const ColumnEditorCard = ({ column, isRTL, onChange, onRemove, onMoveUp, onMoveDown }) => {
  const columnWidthValue = column.width || 'auto';
  const columnWidthOptions = getColumnWidthOptions(columnWidthValue);

  return (
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
        <TextInput label={isRTL ? 'الاسم بالإنجليزية' : 'English label'} value={column.label.en} onChange={(value) => onChange({ ...column, label: { ...column.label, en: value } })} />
        <TextInput label={isRTL ? 'الاسم بالعربية' : 'Arabic label'} value={column.label.ar} dir="rtl" onChange={(value) => onChange({ ...column, label: mirrorArabicToEnglish(column.label, value) })} />
        <SelectField label={isRTL ? 'نوع البيانات' : 'Data type'} value={column.fieldType || 'text'} onChange={(value) => onChange({ ...column, fieldType: value === 'static_text' ? 'text' : value })} options={TABLE_FIELD_TYPE_OPTIONS} isRTL={isRTL} />
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
        <SelectField
          label={isRTL ? 'عرض العمود' : 'Column width'}
          value={columnWidthValue}
          onChange={(value) => onChange({ ...column, width: value })}
          options={columnWidthOptions}
          isRTL={isRTL}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <ColorInput label={isRTL ? 'لون الرأس' : 'Header background'} value={column.headerStyle?.backgroundColor || '#f3f4f6'} onChange={(value) => onChange({ ...column, headerStyle: { ...column.headerStyle, backgroundColor: value } })} />
          <ColorInput label={isRTL ? 'لون النص' : 'Header text'} value={column.headerStyle?.textColor || '#111827'} onChange={(value) => onChange({ ...column, headerStyle: { ...column.headerStyle, textColor: value } })} />
        </div>
      </div>
    </div>
  );
};

const GroupedColumnEditorCard = ({ column, isRTL, onChange, onRemove, onMoveUp, onMoveDown }) => {
  const childColumns = Array.isArray(column.children) ? column.children : [];

  if (childColumns.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button
            onClick={() => onChange({
              ...column,
              children: [buildDefaultChildColumn(0), buildDefaultChildColumn(1)]
            })}
            variant="outline"
            className="!px-4 !py-2"
          >
            {isRTL ? 'تقسيم إلى أعمدة فرعية' : 'Split Into Sub-columns'}
          </Button>
        </div>
        <ColumnEditorCard
          column={column}
          isRTL={isRTL}
          onChange={onChange}
          onRemove={onRemove}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </div>
    );
  }

  const updateChildren = (nextChildren) => onChange({ ...column, children: nextChildren });
  const addChildColumn = () => updateChildren([...childColumns, buildDefaultChildColumn(childColumns.length)]);
  const updateChildColumn = (childIndex, nextChild) => updateChildren(
    childColumns.map((child, index) => (index === childIndex ? nextChild : child))
  );
  const deleteChildColumn = (childIndex) => updateChildren(
    childColumns.filter((_, index) => index !== childIndex)
  );
  const moveChildColumn = (childIndex, direction) => {
    const targetIndex = direction === 'up' ? childIndex - 1 : childIndex + 1;
    if (targetIndex < 0 || targetIndex >= childColumns.length) {
      return;
    }

    const nextChildren = [...childColumns];
    const [movedChild] = nextChildren.splice(childIndex, 1);
    nextChildren.splice(targetIndex, 0, movedChild);
    updateChildren(nextChildren);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-primary/5 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            {getLocalizedText(column.label, isRTL, isRTL ? 'مجموعة أعمدة' : 'Column Group')}
          </h4>
          <p className="text-xs text-gray-500">
            {isRTL ? `${childColumns.length} أعمدة فرعية` : `${childColumns.length} sub-columns`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            onClick={() => onChange({ ...column, children: [] })}
            variant="outline"
            className="!px-3 !py-2"
          >
            {isRTL ? 'إلغاء التقسيم' : 'Remove Split'}
          </Button>
          <IconButton onClick={onMoveUp} title={isRTL ? 'لأعلى' : 'Move up'} icon={FaArrowUp} />
          <IconButton onClick={onMoveDown} title={isRTL ? 'لأسفل' : 'Move down'} icon={FaArrowDown} />
          <IconButton onClick={onRemove} title={isRTL ? 'حذف' : 'Delete'} icon={FaTrash} danger />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextInput label={isRTL ? 'الاسم بالإنجليزية' : 'English label'} value={column.label.en} onChange={(value) => onChange({ ...column, label: { ...column.label, en: value } })} />
        <TextInput label={isRTL ? 'الاسم بالعربية' : 'Arabic label'} value={column.label.ar} dir="rtl" onChange={(value) => onChange({ ...column, label: mirrorArabicToEnglish(column.label, value) })} />
        <div className="grid gap-3 md:grid-cols-2">
          <ColorInput label={isRTL ? 'لون الرأس' : 'Header background'} value={column.headerStyle?.backgroundColor || '#f3f4f6'} onChange={(value) => onChange({ ...column, headerStyle: { ...column.headerStyle, backgroundColor: value } })} />
          <ColorInput label={isRTL ? 'لون النص' : 'Header text'} value={column.headerStyle?.textColor || '#111827'} onChange={(value) => onChange({ ...column, headerStyle: { ...column.headerStyle, textColor: value } })} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-primary/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {isRTL ? 'الأعمدة الفرعية' : 'Sub-columns'}
            </div>
            <div className="text-xs text-gray-500">
              {isRTL
                ? 'أضف أعمدة مثل الاسم والعمر وأي بيانات أخرى داخل هذا العنوان.'
                : 'Add columns like Name, Age, and any other values inside this grouped header.'}
            </div>
          </div>
          <Button onClick={addChildColumn} icon={FaPlus} variant="outline" className="!px-4 !py-2">
            {isRTL ? 'إضافة عمود فرعي' : 'Add Sub-column'}
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {childColumns.map((childColumn, childIndex) => (
            <ChildColumnEditorCard
              key={childColumn.id || childIndex}
              column={childColumn}
              index={childIndex}
              isRTL={isRTL}
              onChange={(nextChild) => updateChildColumn(childIndex, nextChild)}
              onRemove={() => deleteChildColumn(childIndex)}
              onMoveUp={() => moveChildColumn(childIndex, 'up')}
              onMoveDown={() => moveChildColumn(childIndex, 'down')}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

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
          <TextInput label={isRTL ? 'اسم القسم بالإنجليزية' : 'English section name'} value={section.label.en} onChange={(value) => onUpdateSection({ ...section, label: { ...section.label, en: value } })} />
          <TextInput label={isRTL ? 'اسم القسم بالعربية' : 'Arabic section name'} value={section.label.ar} dir="rtl" onChange={(value) => onUpdateSection({ ...section, label: mirrorArabicToEnglish(section.label, value) })} />
          <SelectField label={isRTL ? 'نوع القسم' : 'Section type'} value={section.sectionType || 'normal'} onChange={(value) => onUpdateSection({ ...section, sectionType: value })} options={SECTION_TYPE_OPTIONS} isRTL={isRTL} />
          <NumberInput label={isRTL ? 'المسافة أسفل القسم' : 'Space below section'} value={section.pdfStyle?.marginBottom ?? 16} min={0} onChange={(value) => onUpdateSection({ ...section, pdfStyle: { ...section.pdfStyle, marginBottom: value } })} />
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <Checkbox label={isRTL ? 'إظهار القسم' : 'Show section'} checked={section.visible !== false} onChange={(checked) => onUpdateSection({ ...section, visible: checked })} isRTL={isRTL} />
          <Checkbox label={isRTL ? 'إظهار عنوان القسم' : 'Show section title'} checked={section.advancedLayout?.styling?.showTitle !== false} onChange={(checked) => onUpdateSection({ ...section, advancedLayout: { ...section.advancedLayout, styling: { ...section.advancedLayout.styling, showTitle: checked } } })} isRTL={isRTL} />
          <Checkbox label={isRTL ? 'إظهار الحدود' : 'Show border'} checked={section.pdfStyle?.showBorder !== false} onChange={(checked) => onUpdateSection({ ...section, pdfStyle: { ...section.pdfStyle, showBorder: checked } })} isRTL={isRTL} />
          <Checkbox label={isRTL ? 'إظهار الخلفية' : 'Show background'} checked={section.pdfStyle?.showBackground || false} onChange={(checked) => onUpdateSection({ ...section, pdfStyle: { ...section.pdfStyle, showBackground: checked } })} isRTL={isRTL} />
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
              {/* <NumberInput
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
              /> */}
              <div className="rounded-2xl bg-primary/5 p-4">
                <div className="flex flex-wrap gap-4">
                  <Checkbox
                    label={isRTL ? 'إظهار رأس الجدول' : 'Show header'}
                    checked={section.advancedLayout?.table?.showHeader !== false}
                    isRTL={isRTL}
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
                    isRTL={isRTL}
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
              {layoutType === 'table' ? (isRTL ? 'عدّل الأعمدة مباشرة' : 'Edit columns directly') : (isRTL ? 'أضف ونسّق الحقول' : 'Add and style fields')}
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
                <GroupedColumnEditorCard
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
