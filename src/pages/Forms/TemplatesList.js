import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Loading from '../../components/Common/Loading';
import Button from '../../components/Common/Button';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { showSuccess, showError } from '../../utils/toast';
import { useConfirm } from '../../hooks/useConfirm';
import {
  FaPlus,
  FaFileAlt,
  FaEdit,
  FaTrash,
  FaCopy,
  FaEye,
  FaEyeSlash,
  FaSearch,
  FaTh,
  FaList
} from 'react-icons/fa';

const TemplatesList = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchTerm, templates]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/form-templates');
      setTemplates(response.data.data);
      setFilteredTemplates(response.data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    if (!searchTerm) {
      setFilteredTemplates(templates);
      return;
    }

    const filtered = templates.filter(template =>
      template.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.title.ar.includes(searchTerm)
    );
    setFilteredTemplates(filtered);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: t('templates.confirmDelete'),
      message: t('templates.confirmDeleteMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/form-templates/${id}`);
      showSuccess(t('templates.deletedSuccessfully'));
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showError(t('templates.errorDeleting'));
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/form-templates/${id}/duplicate`);
      showSuccess(t('templates.duplicatedSuccessfully'));
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      showError(t('templates.errorDuplicating'));
    }
  };

  const handleToggleActive = async (template) => {
    try {
      await api.put(`/form-templates/${template._id}`, {
        isActive: !template.isActive
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template status:', error);
      showError(t('templates.errorUpdating'));
    }
  };

  if (loading) return <Loading />;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-dark rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FaFileAlt className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {t('forms.templates')}
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  {t('templates.manageFormTemplates')}
                </p>
              </div>
            </div>

            {user?.role === 'admin' && user?.department === 'management' && (
              <Button
                onClick={() => navigate('/templates/create')}
                className="bg-white text-primary hover:bg-gray-100"
              >
                <FaPlus className={isRTL ? 'ml-2' : 'mr-2'} />
                {t('forms.createTemplate')}
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-6">
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
        </div>

        {/* Templates Table */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaFileAlt className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t('forms.noTemplatesFound')}
            </h3>
            {user?.role === 'admin' && user?.department === 'management' && (
              <Button
                onClick={() => navigate('/templates/create')}
                className="mt-4"
              >
                <FaPlus className={isRTL ? 'ml-2' : 'mr-2'} />
                {t('forms.createTemplate')}
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* View Toggle */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-end">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded transition-all ${viewMode === 'table'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title="Table View"
                >
                  <FaList className="text-sm" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded transition-all ${viewMode === 'cards'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title="Cards View"
                >
                  <FaTh className="text-sm" />
                </button>
              </div>
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={`bg-gradient-to-r from-gray-50 to-white ${t('language') === 'ar' ? 'text-right' : 'text-left'}`}>
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {t('templates.template')}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {t('templates.sections')}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {t('templates.departments')}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {t('common.status')}
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredTemplates.map((template) => (
                      <tr key={template._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {isRTL ? template.title.ar : template.title.en}
                            </p>
                            {template.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {isRTL ? template.description.ar : template.description.en}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {template.sections.length} {t('forms.sections')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {template.departments.slice(0, 2).map((dept) => (
                              <span
                                key={dept}
                                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {t(`departments.${dept}`)}
                              </span>
                            ))}
                            {template.departments.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                +{template.departments.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {template.isActive ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              <FaEye />
                              {t('templates.active')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                              <FaEyeSlash />
                              {t('templates.inactive')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {user?.role === 'admin' && user?.department === 'management' && (
                              <>
                                <button
                                  onClick={() => handleToggleActive(template)}
                                  className="p-2 text-gray-600 hover:text-primary transition-colors"
                                  title={template.isActive ? t('templates.deactivate') : t('templates.activate')}
                                >
                                  {template.isActive ? <FaEyeSlash /> : <FaEye />}
                                </button>
                                <button
                                  onClick={() => navigate(`/templates/edit/${template._id}`)}
                                  className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                                  title={t('common.edit')}
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDuplicate(template._id)}
                                  className="p-2 text-green-600 hover:text-green-700 transition-colors"
                                  title={t('templates.duplicate')}
                                >
                                  <FaCopy />
                                </button>
                                <button
                                  onClick={() => handleDelete(template._id)}
                                  className="p-2 text-primary hover:text-primary transition-colors"
                                  title={t('common.delete')}
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template._id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all"
                    >
                      {/* Template Header */}
                      <div className="mb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {isRTL ? template.title.ar : template.title.en}
                            </h4>
                            {template.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {isRTL ? template.description.ar : template.description.en}
                              </p>
                            )}
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            {template.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                <FaEye className="text-xs" />
                                {t('templates.active')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                                <FaEyeSlash className="text-xs" />
                                {t('templates.inactive')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{t('templates.sections')}</span>
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {template.sections.length} {t('forms.sections')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{t('templates.departments')}</span>
                          <div className="flex flex-wrap gap-1">
                            {template.departments.slice(0, 2).map((dept) => (
                              <span
                                key={dept}
                                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {t(`departments.${dept}`)}
                              </span>
                            ))}
                            {template.departments.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                +{template.departments.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {user?.role === 'admin' && user?.department === 'management' && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(template)}
                              className="p-2 text-gray-600 hover:text-primary transition-colors"
                              title={template.isActive ? t('templates.deactivate') : t('templates.activate')}
                            >
                              {template.isActive ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                            </button>
                            <button
                              onClick={() => navigate(`/templates/edit/${template._id}`)}
                              className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                              title={t('common.edit')}
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(template._id)}
                              className="p-2 text-green-600 hover:text-green-700 transition-colors"
                              title={t('templates.duplicate')}
                            >
                              <FaCopy className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDelete(template._id)}
                              className="p-2 text-primary hover:text-primary transition-colors"
                              title={t('common.delete')}
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
      />
    </Layout>
  );
};

export default TemplatesList;

