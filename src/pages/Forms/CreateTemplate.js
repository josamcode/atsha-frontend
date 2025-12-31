import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Button from '../../components/Common/Button';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import {
  FaPlus,
  FaTrash,
  FaSave,
  FaArrowLeft,
  FaFileAlt,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

const CreateTemplate = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [formData, setFormData] = useState({
    title: { en: '', ar: '' },
    description: { en: '', ar: '' },
    sections: [],
    visibleToRoles: ['admin', 'supervisor', 'employee'],
    editableByRoles: ['admin', 'supervisor', 'employee'],
    departments: ['all'],
    requiresApproval: true
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'select', label: 'Select' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Time' },
    { value: 'datetime', label: 'DateTime' },
    { value: 'file', label: 'File Upload' }
  ];

  const addSection = () => {
    const newSection = {
      id: `section_${Date.now()}`,
      label: { en: '', ar: '' },
      fields: []
    };
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const removeSection = (sectionIndex) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== sectionIndex)
    }));
  };

  const updateSection = (sectionIndex, field, value) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newSections[sectionIndex][parent][child] = value;
      } else {
        newSections[sectionIndex][field] = value;
      }
      return { ...prev, sections: newSections };
    });
  };

  const moveSectionUp = (sectionIndex) => {
    if (sectionIndex === 0) return;
    setFormData(prev => {
      const newSections = [...prev.sections];
      [newSections[sectionIndex - 1], newSections[sectionIndex]] =
        [newSections[sectionIndex], newSections[sectionIndex - 1]];
      return { ...prev, sections: newSections };
    });
  };

  const moveSectionDown = (sectionIndex) => {
    if (sectionIndex === formData.sections.length - 1) return;
    setFormData(prev => {
      const newSections = [...prev.sections];
      [newSections[sectionIndex], newSections[sectionIndex + 1]] =
        [newSections[sectionIndex + 1], newSections[sectionIndex]];
      return { ...prev, sections: newSections };
    });
  };

  const addField = (sectionIndex) => {
    const newField = {
      key: `field_${Date.now()}`,
      label: { en: '', ar: '' },
      type: 'text',
      options: [],
      required: false,
      placeholder: { en: '', ar: '' }
    };

    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].fields.push(newField);
      return { ...prev, sections: newSections };
    });
  };

  const removeField = (sectionIndex, fieldIndex) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].fields = newSections[sectionIndex].fields.filter((_, idx) => idx !== fieldIndex);
      return { ...prev, sections: newSections };
    });
  };

  const updateField = (sectionIndex, fieldIndex, field, value) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newSections[sectionIndex].fields[fieldIndex][parent][child] = value;
      } else {
        newSections[sectionIndex].fields[fieldIndex][field] = value;
      }
      return { ...prev, sections: newSections };
    });
  };

  const addOption = (sectionIndex, fieldIndex) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].fields[fieldIndex].options.push({ en: '', ar: '' });
      return { ...prev, sections: newSections };
    });
  };

  const updateOption = (sectionIndex, fieldIndex, optionIndex, lang, value) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].fields[fieldIndex].options[optionIndex][lang] = value;
      return { ...prev, sections: newSections };
    });
  };

  const removeOption = (sectionIndex, fieldIndex, optionIndex) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].fields[fieldIndex].options =
        newSections[sectionIndex].fields[fieldIndex].options.filter((_, idx) => idx !== optionIndex);
      return { ...prev, sections: newSections };
    });
  };

  const toggleRole = (type, role) => {
    setFormData(prev => {
      const roles = prev[type];
      const newRoles = roles.includes(role)
        ? roles.filter(r => r !== role)
        : [...roles, role];
      return { ...prev, [type]: newRoles };
    });
  };

  const toggleDepartment = (dept) => {
    setFormData(prev => {
      const departments = prev.departments;
      const newDepartments = departments.includes(dept)
        ? departments.filter(d => d !== dept)
        : [...departments, dept];
      return { ...prev, departments: newDepartments };
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.en.trim()) newErrors.titleEn = t('common.required');
    if (!formData.title.ar.trim()) newErrors.titleAr = t('common.required');

    if (formData.sections.length === 0) {
      newErrors.sections = t('templates.atLeastOneSection');
    }

    formData.sections.forEach((section, sIdx) => {
      if (!section.label.en.trim()) {
        newErrors[`section_${sIdx}_labelEn`] = t('common.required');
      }
      if (!section.label.ar.trim()) {
        newErrors[`section_${sIdx}_labelAr`] = t('common.required');
      }

      if (section.fields.length === 0) {
        newErrors[`section_${sIdx}_fields`] = t('templates.atLeastOneField');
      }

      section.fields.forEach((field, fIdx) => {
        if (!field.key.trim()) {
          newErrors[`section_${sIdx}_field_${fIdx}_key`] = t('common.required');
        }
        if (!field.label.en.trim()) {
          newErrors[`section_${sIdx}_field_${fIdx}_labelEn`] = t('common.required');
        }
        if (!field.label.ar.trim()) {
          newErrors[`section_${sIdx}_field_${fIdx}_labelAr`] = t('common.required');
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showWarning(t('templates.fixErrors'));
      return;
    }

    setSaving(true);
    try {
      await api.post('/form-templates', formData);
      showSuccess(t('templates.createdSuccessfully'));
      navigate('/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      showError(t('templates.errorCreating'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-darko rounded-2xl shadow-lg p-6">
          <button
            onClick={() => navigate('/templates')}
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
                {t('forms.createTemplate')}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {t('templates.createNewFormTemplate')}
              </p>
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('templates.basicInfo')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.titleEnglish')} <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={formData.title.en}
                onChange={(e) => setFormData(prev => ({ ...prev, title: { ...prev.title, en: e.target.value } }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.titleEn ? 'border-primary' : 'border-gray-300'}`}
                placeholder="Daily Report"
              />
              {errors.titleEn && <p className="mt-1 text-sm text-primary">{errors.titleEn}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.titleArabic')} <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={formData.title.ar}
                onChange={(e) => setFormData(prev => ({ ...prev, title: { ...prev.title, ar: e.target.value } }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.titleAr ? 'border-primary' : 'border-gray-300'}`}
                placeholder="التقرير اليومي"
                dir="rtl"
              />
              {errors.titleAr && <p className="mt-1 text-sm text-primary">{errors.titleAr}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.descriptionEnglish')}
              </label>
              <textarea
                value={formData.description.en}
                onChange={(e) => setFormData(prev => ({ ...prev, description: { ...prev.description, en: e.target.value } }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.descriptionArabic')}
              </label>
              <textarea
                value={formData.description.ar}
                onChange={(e) => setFormData(prev => ({ ...prev, description: { ...prev.description, ar: e.target.value } }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                dir="rtl"
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('templates.visibleToRoles')}</label>
              <div className="flex flex-wrap gap-3">
                {['admin', 'supervisor', 'employee'].map(role => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.visibleToRoles.includes(role)}
                      onChange={() => toggleRole('visibleToRoles', role)}
                      className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
                    />
                    <span className="text-gray-700 capitalize">{t(`users.${role}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('templates.editableByRoles')}</label>
              <div className="flex flex-wrap gap-3">
                {['admin', 'supervisor', 'employee'].map(role => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.editableByRoles.includes(role)}
                      onChange={() => toggleRole('editableByRoles', role)}
                      className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
                    />
                    <span className="text-gray-700 capitalize">{t(`users.${role}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('templates.departments')}</label>
              <div className="flex flex-wrap gap-3">
                {['all', 'kitchen', 'counter', 'cleaning', 'management', 'delivery', 'other'].map(dept => (
                  <label key={dept} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.departments.includes(dept)}
                      onChange={() => toggleDepartment(dept)}
                      className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
                    />
                    <span className="text-gray-700">{t(`departments.${dept}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                  className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
                />
                <span className="text-gray-700">{t('forms.requiresApproval')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">{t('templates.sections')}</h2>
            <Button onClick={addSection} variant="secondary">
              <FaPlus className={isRTL ? 'ml-2' : 'mr-2'} />
              {t('templates.addSection')}
            </Button>
          </div>

          {errors.sections && (
            <p className="text-sm text-primary">{errors.sections}</p>
          )}

          {formData.sections.map((section, sIdx) => (
            <div key={section.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">
                    {t('templates.section')} {sIdx + 1}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveSectionUp(sIdx)}
                      disabled={sIdx === 0}
                      className="p-2 text-gray-600 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t('templates.moveUp')}
                    >
                      <FaArrowUp />
                    </button>
                    <button
                      onClick={() => moveSectionDown(sIdx)}
                      disabled={sIdx === formData.sections.length - 1}
                      className="p-2 text-gray-600 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t('templates.moveDown')}
                    >
                      <FaArrowDown />
                    </button>
                    <button
                      onClick={() => removeSection(sIdx)}
                      className="p-2 text-primary hover:text-primary"
                      title={t('common.delete')}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Section Labels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.sectionId')} <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={section.id}
                      onChange={(e) => updateSection(sIdx, 'id', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="general_info"
                      disabled={true}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.labelEnglish')} <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={section.label.en}
                      onChange={(e) => updateSection(sIdx, 'label.en', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors[`section_${sIdx}_labelEn`] ? 'border-primary' : 'border-gray-300'}`}
                      placeholder="General Information"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.labelArabic')} <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={section.label.ar}
                      onChange={(e) => updateSection(sIdx, 'label.ar', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors[`section_${sIdx}_labelAr`] ? 'border-primary' : 'border-gray-300'}`}
                      placeholder="معلومات عامة"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-700">{t('templates.fields')}</h4>
                    <button
                      onClick={() => addField(sIdx)}
                      className="text-sm text-primary hover:text-primary-dark font-semibold flex items-center gap-1"
                    >
                      <FaPlus />
                      {t('templates.addField')}
                    </button>
                  </div>

                  {errors[`section_${sIdx}_fields`] && (
                    <p className="text-sm text-primary">{errors[`section_${sIdx}_fields`]}</p>
                  )}

                  {section.fields.map((field, fIdx) => (
                    <div key={fIdx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">{t('templates.field')} {fIdx + 1}</span>
                        <button
                          onClick={() => removeField(sIdx, fIdx)}
                          className="text-primary hover:text-primary"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {t('templates.fieldKey')} <span className="text-primary">*</span>
                          </label>
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => updateField(sIdx, fIdx, 'key', e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors[`section_${sIdx}_field_${fIdx}_key`] ? 'border-primary' : 'border-gray-300'}`}
                            placeholder="employee_name"
                            disabled={true}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {t('templates.labelEnglish')} <span className="text-primary">*</span>
                          </label>
                          <input
                            type="text"
                            value={field.label.en}
                            onChange={(e) => updateField(sIdx, fIdx, 'label.en', e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors[`section_${sIdx}_field_${fIdx}_labelEn`] ? 'border-primary' : 'border-gray-300'}`}
                            placeholder="Employee Name"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {t('templates.labelArabic')} <span className="text-primary">*</span>
                          </label>
                          <input
                            type="text"
                            value={field.label.ar}
                            onChange={(e) => updateField(sIdx, fIdx, 'label.ar', e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors[`section_${sIdx}_field_${fIdx}_labelAr`] ? 'border-primary' : 'border-gray-300'}`}
                            placeholder="اسم الموظف"
                            dir="rtl"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{t('templates.fieldType')}</label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(sIdx, fIdx, 'type', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            {fieldTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{t('templates.placeholderEn')}</label>
                          <input
                            type="text"
                            value={field.placeholder?.en || ''}
                            onChange={(e) => updateField(sIdx, fIdx, 'placeholder.en', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{t('templates.placeholderAr')}</label>
                          <input
                            type="text"
                            value={field.placeholder?.ar || ''}
                            onChange={(e) => updateField(sIdx, fIdx, 'placeholder.ar', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            dir="rtl"
                          />
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(sIdx, fIdx, 'required', e.target.checked)}
                              className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary rounded"
                            />
                            <span className="text-xs font-medium text-gray-600">{t('templates.required')}</span>
                          </label>
                        </div>
                      </div>

                      {/* Options for select fields */}
                      {field.type === 'select' && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-gray-600">{t('templates.options')}</label>
                            <button
                              onClick={() => addOption(sIdx, fIdx)}
                              className="text-xs text-primary hover:text-primary-dark font-semibold"
                            >
                              + {t('templates.addOption')}
                            </button>
                          </div>
                          <div className="space-y-2">
                            {field.options.map((option, oIdx) => (
                              <div key={oIdx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={option.en}
                                  onChange={(e) => updateOption(sIdx, fIdx, oIdx, 'en', e.target.value)}
                                  placeholder="English"
                                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                                />
                                <input
                                  type="text"
                                  value={option.ar}
                                  onChange={(e) => updateOption(sIdx, fIdx, oIdx, 'ar', e.target.value)}
                                  placeholder="العربية"
                                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                                  dir="rtl"
                                />
                                <button
                                  onClick={() => removeOption(sIdx, fIdx, oIdx)}
                                  className="px-3 py-1 text-primary hover:text-primary"
                                >
                                  <FaTrash size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => navigate('/templates')}
                variant="secondary"
                disabled={saving}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
              >
                <FaSave className={isRTL ? 'ml-2' : 'mr-2'} />
                {saving ? t('common.loading') : t('templates.createTemplate')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateTemplate;

