import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Loading from '../../components/Common/Loading';
import {
  FaFileAlt,
  FaSearch,
  FaFilter,
  FaChevronRight,
  FaChevronLeft,
  FaClock,
  FaCheckCircle
} from 'react-icons/fa';

const SelectTemplate = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchTerm, departmentFilter, templates]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/form-templates');
      // Filter only active templates that user can edit and belong to their department
      const availableTemplates = response.data.data.filter(template => {
        // Must be active
        if (!template.isActive) return false;

        // User must have edit permission
        if (!template.editableByRoles.includes(user?.role)) return false;

        // Department filter:
        // - If template is for 'all' departments, show to everyone
        // - If user is management admin, show all templates
        // - Otherwise, show only templates for user's department
        if (template.departments.includes('all')) {
          return true;
        }

        // Management admins can see all templates
        if (user?.role === 'admin' && user?.department === 'management') {
          return true;
        }

        // For other users, check if template is for their department
        return template.departments.includes(user?.department);
      });
      setTemplates(availableTemplates);
      setFilteredTemplates(availableTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.title.ar.includes(searchTerm)
      );
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(template =>
        template.departments.includes(departmentFilter) ||
        template.departments.includes('all')
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleSelectTemplate = (templateId) => {
    navigate(`/forms/fill/${templateId}`);
  };

  if (loading) return <Loading />;

  const ChevronIcon = isRTL ? FaChevronLeft : FaChevronRight;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-darko rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FaFileAlt className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {t('forms.selectTemplate')}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {t('forms.chooseTemplateToFill')}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
              />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <FaFilter className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
              >
                <option value="all">{t('common.allDepartments')}</option>
                <option value="kitchen">{t('departments.kitchen')}</option>
                <option value="counter">{t('departments.counter')}</option>
                <option value="cleaning">{t('departments.cleaning')}</option>
                <option value="management">{t('departments.management')}</option>
                <option value="delivery">{t('departments.delivery')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaFileAlt className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t('forms.noTemplatesFound')}
            </h3>
            <p className="text-gray-500">
              {t('forms.tryDifferentFilters')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template._id}
                onClick={() => handleSelectTemplate(template._id)}
                className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-primary transform hover:-translate-y-1"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-primary to-primary-dark p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <FaFileAlt className="text-2xl text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">
                        {isRTL ? template.title.ar : template.title.en}
                      </h3>
                      <p className="text-white/80 text-xs">
                        {template.sections.length} {t('forms.sections')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {template.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {isRTL ? template.description.ar : template.description.en}
                    </p>
                  )}

                  {/* Info Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.departments.map((dept) => (
                      <span
                        key={dept}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {t(`departments.${dept}`)}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {template.requiresApproval ? (
                        <>
                          <FaCheckCircle className="text-green-500 flex-shrink-0" />
                          <span>{t('forms.requiresApproval')}</span>
                        </>
                      ) : (
                        <>
                          <FaClock className="text-blue-500 flex-shrink-0" />
                          <span>{t('forms.noApprovalNeeded')}</span>
                        </>
                      )}
                    </div>
                    <ChevronIcon className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SelectTemplate;

