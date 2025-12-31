import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Loading from '../../components/Common/Loading';
import Button from '../../components/Common/Button';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import {
  FaFileAlt,
  FaSave,
  FaPaperPlane,
  FaArrowLeft,
  FaCalendarAlt,
  FaClock,
  FaPlus,
  FaTrash
} from 'react-icons/fa';

const FillForm = () => {
  const { templateId } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'morning',
    department: user?.department || 'kitchen',
    values: {}
  });
  const [errors, setErrors] = useState({});
  const [tableRowCounts, setTableRowCounts] = useState({}); // Track number of rows per section

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await api.get(`/form-templates/${templateId}`);
      setTemplate(response.data.data);

      // Initialize values with default empty values
      const initialValues = {};
      response.data.data.sections.forEach(section => {
        // Initialize regular fields
        section.fields.forEach(field => {
          const key = `${section.id}.${field.key}`;
          initialValues[key] = getDefaultValue(field.type);
        });

        // Initialize table cells if section uses table layout
        // Start with only 1 row, user can add more
        if (section.advancedLayout?.layoutType === 'table' &&
          section.advancedLayout?.table?.enabled &&
          section.advancedLayout?.table?.columns) {
          // Initialize only first row
          section.advancedLayout.table.columns.forEach((col, colIdx) => {
            const cellKey = `${section.id}.row_0.col_${col.id || `col${colIdx + 1}`}`;
            initialValues[cellKey] = '';
          });
        }
      });
      setFormData(prev => ({ ...prev, values: initialValues }));

      // Initialize row counts - start with 1 row per table section
      const initialRowCounts = {};
      response.data.data.sections.forEach(section => {
        if (section.advancedLayout?.layoutType === 'table' &&
          section.advancedLayout?.table?.enabled) {
          initialRowCounts[section.id] = 1; // Start with 1 row
        }
      });
      setTableRowCounts(initialRowCounts);
    } catch (error) {
      console.error('Error fetching template:', error);
      showError(t('forms.errorLoadingTemplate'));
      navigate('/forms/new');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultValue = (type) => {
    switch (type) {
      case 'boolean':
        return false;
      case 'number':
        return 0;
      case 'select':
        return '';
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'time':
        return '';
      case 'datetime':
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (sectionId, fieldKey, value, fieldType) => {
    const key = `${sectionId}.${fieldKey}`;
    let processedValue = value;

    // Handle boolean fields
    if (fieldType === 'boolean') {
      processedValue = value === 'true' || value === true;
    }
    // Handle number fields
    else if (fieldType === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [key]: processedValue
      }
    }));

    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    template.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required) {
          const key = `${section.id}.${field.key}`;
          const value = formData.values[key];

          if (value === undefined || value === null || value === '') {
            newErrors[key] = t('common.required');
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status = 'submitted') => {
    if (!validateForm()) {
      showWarning(t('forms.pleaseFixErrors'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        templateId: template._id,
        department: formData.department,
        date: formData.date,
        shift: formData.shift,
        values: formData.values,
        status
      };

      await api.post('/form-instances', payload);
      showSuccess(t(status === 'draft' ? 'forms.savedAsDraft' : 'forms.submittedSuccessfully'));
      navigate('/forms');
    } catch (error) {
      console.error('Error saving form:', error);
      showError(t('forms.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const renderField = (section, field) => {
    const key = `${section.id}.${field.key}`;
    const value = formData.values[key];
    const hasError = !!errors[key];
    const label = isRTL ? field.label.ar : field.label.en;
    const placeholder = field.placeholder ? (isRTL ? field.placeholder.ar : field.placeholder.en) : '';

    const baseInputClasses = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${hasError ? 'border-primary' : 'border-gray-300'
      }`;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleInputChange(section.id, field.key, e.target.value, field.type)}
            placeholder={placeholder}
            className={baseInputClasses}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleInputChange(section.id, field.key, e.target.value, field.type)}
            placeholder={placeholder}
            rows={4}
            className={baseInputClasses}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleInputChange(section.id, field.key, e.target.value, field.type)}
            placeholder={placeholder}
            className={baseInputClasses}
            required={field.required}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={key}
                value="true"
                checked={value === true}
                onChange={(e) => handleInputChange(section.id, field.key, e.target.value, field.type)}
                className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-gray-700">{t('common.yes')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={key}
                value="false"
                checked={value === false}
                onChange={(e) => handleInputChange(section.id, field.key, e.target.value, field.type)}
                className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-gray-700">{t('common.no')}</span>
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleInputChange(section.id, field.key, e.target.value, field.type)}
            className={baseInputClasses}
            required={field.required}
          >
            <option value="">{t('common.select')}</option>
            {field.options && field.options.map((option, idx) => (
              <option key={idx} value={isRTL ? option.ar : option.en}>
                {isRTL ? option.ar : option.en}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleInputChange(section.id, field.key, e.target.value, field.type)}
            className={baseInputClasses}
            required={field.required}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={value || ''}
            onChange={(e) => handleInputChange(section.id, field.key, e.target.value, field.type)}
            className={baseInputClasses}
            required={field.required}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => handleInputChange(section.id, field.key, e.target.value, field.type)}
            className={baseInputClasses}
            required={field.required}
          />
        );

      default:
        return <input type="text" className={baseInputClasses} disabled />;
    }
  };

  if (loading) return <Loading />;
  if (!template) return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-darko rounded-2xl shadow-lg p-6">
          <button
            onClick={() => navigate('/forms/new')}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <FaArrowLeft />
            <span>{t('common.back')}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FaFileAlt className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isRTL ? template.title.ar : template.title.en}
              </h1>
              {template.description && (
                <p className="text-white/80 text-sm mt-1">
                  {isRTL ? template.description.ar : template.description.en}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form Metadata */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('forms.date')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaClock className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('forms.shift')}
              </label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData(prev => ({ ...prev, shift: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="morning">{t('forms.morning')}</option>
                <option value="evening">{t('forms.evening')}</option>
                <option value="night">{t('forms.night')}</option>
              </select>
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forms.department')}
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="kitchen">{t('departments.kitchen')}</option>
                <option value="counter">{t('departments.counter')}</option>
                <option value="cleaning">{t('departments.cleaning')}</option>
                <option value="management">{t('departments.management')}</option>
                <option value="delivery">{t('departments.delivery')}</option>
                <option value="other">{t('departments.other')}</option>
              </select>
            </div> */}
          </div>
        </div>

        {/* Form Sections */}
        {template.sections.map((section, sectionIdx) => (
          <div key={section.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">
                {sectionIdx + 1}. {isRTL ? section.label.ar : section.label.en}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Check if section uses table layout - render as input fields */}
              {section.advancedLayout?.layoutType === 'table' &&
                section.advancedLayout?.table?.enabled &&
                section.advancedLayout?.table?.columns &&
                section.advancedLayout?.table?.columns.length > 0 ? (
                // Render table columns as individual input fields with add/remove row functionality
                <div className="space-y-4">
                  {Array.from({ length: tableRowCounts[section.id] || 1 }).map((_, rowIdx) => (
                    <div key={rowIdx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-medium text-gray-600">
                          {t('forms.row') || 'Row'} {rowIdx + 1}
                        </div>
                        {(tableRowCounts[section.id] || 1) > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const currentRowCount = tableRowCounts[section.id] || 1;
                              // Remove this row's data
                              const newValues = { ...formData.values };
                              section.advancedLayout.table.columns.forEach((col, colIdx) => {
                                const cellKey = `${section.id}.row_${rowIdx}.col_${col.id || `col${colIdx + 1}`}`;
                                delete newValues[cellKey];
                              });

                              // Shift down all rows after this one
                              for (let i = rowIdx + 1; i < currentRowCount; i++) {
                                section.advancedLayout.table.columns.forEach((col, colIdx) => {
                                  const oldKey = `${section.id}.row_${i}.col_${col.id || `col${colIdx + 1}`}`;
                                  const newKey = `${section.id}.row_${i - 1}.col_${col.id || `col${colIdx + 1}`}`;
                                  if (newValues[oldKey] !== undefined) {
                                    newValues[newKey] = newValues[oldKey];
                                    delete newValues[oldKey];
                                  }
                                });
                              }

                              setFormData(prev => ({ ...prev, values: newValues }));
                              setTableRowCounts(prev => ({
                                ...prev,
                                [section.id]: currentRowCount - 1
                              }));
                            }}
                            className="p-1 text-primary hover:bg-primary rounded transition-colors"
                            title={t('common.delete') || 'Delete Row'}
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {section.advancedLayout.table.columns.map((col, colIdx) => {
                          const cellKey = `${section.id}.row_${rowIdx}.col_${col.id || `col${colIdx + 1}`}`;
                          const cellValue = formData.values[cellKey] || '';
                          const colLabel = col.label?.[isRTL ? 'ar' : 'en'] || col.label?.en || col.label?.ar || `Column ${colIdx + 1}`;

                          // Use fieldType from column definition, or determine from label as fallback
                          let fieldType = col.fieldType || 'text';
                          if (!col.fieldType) {
                            // Fallback: Determine field type based on column label
                            const labelLower = colLabel.toLowerCase();
                            if (labelLower.includes('date') || labelLower.includes('تاريخ')) {
                              fieldType = 'date';
                            } else if (labelLower.includes('time') || labelLower.includes('وقت')) {
                              fieldType = 'time';
                            } else if (labelLower.includes('quantity') || labelLower.includes('كميه') || labelLower.includes('amount') || labelLower.includes('مبلغ') || labelLower.includes('cost') || labelLower.includes('تكلفه') || labelLower.includes('value') || labelLower.includes('قيمه')) {
                              fieldType = 'number';
                            } else if (labelLower.includes('max') || labelLower.includes('حد') || labelLower.includes('maximum')) {
                              fieldType = 'number';
                            }
                          }

                          return (
                            <div key={col.id || colIdx}>
                              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {colLabel}
                              </label>
                              {fieldType === 'date' ? (
                                <input
                                  type="date"
                                  value={cellValue}
                                  onChange={(e) => handleInputChange(section.id, `row_${rowIdx}.col_${col.id || `col${colIdx + 1}`}`, e.target.value, 'date')}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              ) : fieldType === 'time' ? (
                                <input
                                  type="time"
                                  value={cellValue}
                                  onChange={(e) => handleInputChange(section.id, `row_${rowIdx}.col_${col.id || `col${colIdx + 1}`}`, e.target.value, 'time')}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              ) : fieldType === 'number' ? (
                                <input
                                  type="number"
                                  value={cellValue}
                                  onChange={(e) => handleInputChange(section.id, `row_${rowIdx}.col_${col.id || `col${colIdx + 1}`}`, e.target.value, 'number')}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                  min="0"
                                  step={colLabel.toLowerCase().includes('quantity') || colLabel.toLowerCase().includes('كميه') ? '1' : '0.01'}
                                />
                              ) : fieldType === 'textarea' ? (
                                <textarea
                                  value={cellValue}
                                  onChange={(e) => handleInputChange(section.id, `row_${rowIdx}.col_${col.id || `col${colIdx + 1}`}`, e.target.value, 'textarea')}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                  rows={3}
                                  placeholder={colLabel}
                                />
                              ) : fieldType === 'boolean' ? (
                                <select
                                  value={cellValue}
                                  onChange={(e) => handleInputChange(section.id, `row_${rowIdx}.col_${col.id || `col${colIdx + 1}`}`, e.target.value, 'boolean')}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                  <option value="">{t('common.select') || 'Select'}</option>
                                  <option value="true">{t('common.yes') || 'Yes'}</option>
                                  <option value="false">{t('common.no') || 'No'}</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={cellValue}
                                  onChange={(e) => handleInputChange(section.id, `row_${rowIdx}.col_${col.id || `col${colIdx + 1}`}`, e.target.value, 'text')}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                  placeholder={colLabel}
                                />
                              )}
                              {errors[cellKey] && (
                                <p className="mt-1 text-sm text-primary">
                                  {errors[cellKey]}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Add Row Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const currentRowCount = tableRowCounts[section.id] || 1;
                      const newRowCount = currentRowCount + 1;

                      // Initialize empty values for the new row
                      const newValues = { ...formData.values };
                      section.advancedLayout.table.columns.forEach((col, colIdx) => {
                        const cellKey = `${section.id}.row_${currentRowCount}.col_${col.id || `col${colIdx + 1}`}`;
                        newValues[cellKey] = '';
                      });

                      setFormData(prev => ({ ...prev, values: newValues }));
                      setTableRowCounts(prev => ({
                        ...prev,
                        [section.id]: newRowCount
                      }));
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <FaPlus className="text-sm" />
                    <span>{t('forms.addRow') || 'Add Row'}</span>
                  </button>
                </div>
              ) : section.sectionType === 'header' || section.sectionType === 'footer' ? (
                // Header/Footer sections don't need fields
                <div className="text-center py-4 text-gray-500 text-sm">
                  {t('forms.noFieldsForSection') || 'This section does not require fields'}
                </div>
              ) : (
                // Render regular fields
                section.fields.length > 0 ? (
                  section.fields.map((field, fieldIdx) => (
                    <div key={field.key}>
                      <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {isRTL ? field.label.ar : field.label.en}
                        {field.required && <span className="text-primary mr-1">*</span>}
                      </label>
                      {renderField(section, field)}
                      {errors[`${section.id}.${field.key}`] && (
                        <p className="mt-1 text-sm text-primary">
                          {errors[`${section.id}.${field.key}`]}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    {t('forms.noFields') || 'No fields in this section'}
                  </div>
                )
              )}
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end bg-white rounded-xl shadow-md p-6">
          <Button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <FaSave className={isRTL ? 'ml-2' : 'mr-2'} />
            {t('forms.saveAsDraft')}
          </Button>
          <Button
            onClick={() => handleSubmit('submitted')}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            <FaPaperPlane className={isRTL ? 'ml-2' : 'mr-2'} />
            {t('common.submit')}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default FillForm;

