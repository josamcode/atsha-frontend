import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Loading from '../../components/Common/Loading';
import Button from '../../components/Common/Button';
import DataTable from '../../components/Common/DataTable';
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
import {
  canManageTemplates,
  getDepartmentLabel
} from '../../utils/organizationUi';
import PageTitle from '../../components/Common/PageTilte';
import Card from '../../components/Common/Card';
import { isPlatformAdmin } from '../../utils/organization';

const TemplatesList = () => {
  const { t, i18n } = useTranslation();
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const platformAdminView = isPlatformAdmin(user);
  const canManageCurrentTemplates = canManageTemplates(user) && !platformAdminView;

  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchTemplates();
    if (platformAdminView) {
      fetchOrganizations();
    }
  }, [platformAdminView, organizationFilter]);

  useEffect(() => {
    filterTemplates();
  }, [organizationFilter, searchTerm, templates]);

  const fetchTemplates = async () => {
    try {
      const params = {};
      if (platformAdminView && organizationFilter) {
        params.organizationId = organizationFilter;
      }

      const response = await api.get('/form-templates', { params });
      setTemplates(response.data.data);
      setFilteredTemplates(response.data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      setOrganizations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const filterTemplates = () => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = templates.filter((template) => {
      const organizationName = template.organizationId?.branding?.displayName || template.organizationId?.name || '';
      const matchesSearch = !normalizedSearch || [
        template.title?.en,
        template.title?.ar,
        organizationName
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesOrganization = !organizationFilter || (template.organizationId?._id === organizationFilter || template.organizationId?.id === organizationFilter);

      return matchesSearch && matchesOrganization;
    });

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

  const templateColumns = [
    ...(platformAdminView ? [{
      key: 'organization',
      header: isRTL ? 'المؤسسة' : 'Organization',
      render: (template) => template.organizationId?.branding?.displayName || template.organizationId?.name || 'N/A'
    }] : []),
    {
      key: 'template',
      header: t('templates.template'),
      render: (template) => (
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
      )
    },
    {
      key: 'sections',
      header: t('templates.sections'),
      render: (template) => (
        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          {template.sections.length} {t('forms.sections')}
        </span>
      )
    },
    {
      key: 'departments',
      header: t('templates.departments'),
      render: (template) => (
        <div className="flex flex-wrap gap-1">
          {template.departments.slice(0, 2).map((dept) => (
            <span
              key={dept}
              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {getDepartmentLabel(dept, template.organizationId || organization, t, i18n.language)}
            </span>
          ))}
          {template.departments.length > 2 && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              +{template.departments.length - 2}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (template) => (
        template.isActive ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            <FaEye />
            {t('templates.active')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            <FaEyeSlash />
            {t('templates.inactive')}
          </span>
        )
      )
    },
    {
      key: 'actions',
      header: t('common.actions'),
      headerClassName: 'text-right',
      render: (template) => (
        <div className="flex items-center justify-end gap-2">
          {canManageCurrentTemplates && (
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
      )
    }
  ];

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
              <PageTitle
                title={t('forms.templates')}
                description={platformAdminView
                  ? (isRTL ? 'عرض جميع قوالب النظام عبر كل المؤسسات.' : 'Review templates across every organization in the platform.')
                  : t('templates.manageFormTemplates')}
                titleClass="text-white"
                descriptionClass="text-white/80"
              />
            </div>

            {canManageCurrentTemplates && (
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
          <div className={`grid gap-4 ${platformAdminView ? 'lg:grid-cols-[minmax(0,1fr)_18rem]' : ''}`}>
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

            {platformAdminView && (
              <select
                value={organizationFilter}
                onChange={(event) => setOrganizationFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">{isRTL ? 'كل المؤسسات' : 'All Organizations'}</option>
                {organizations.map((organizationItem) => (
                  <option key={organizationItem._id || organizationItem.id} value={organizationItem._id || organizationItem.id}>
                    {organizationItem.branding?.displayName || organizationItem.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Templates Table */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaFileAlt className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t('forms.noTemplatesFound')}
            </h3>
            {canManageCurrentTemplates && (
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
          <Card>
            {/* View Toggle */}
            <div className="pb-4 flex items-center justify-end">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded transition-all ${viewMode === 'table'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title={t('common.tableView')}
                >
                  <FaList className="text-sm" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded transition-all ${viewMode === 'cards'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title={t('common.cardsView')}
                >
                  <FaTh className="text-sm" />
                </button>
              </div>
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
              <DataTable
                columns={templateColumns}
                data={filteredTemplates}
                rowKey="_id"
                isRTL={isRTL}
                headClassName="bg-gradient-to-r from-gray-50 to-white"
                bodyClassName="bg-white divide-y divide-gray-100"
                headerCellClassName="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider"
              />
            )}

            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="p-0">
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
                          {platformAdminView && (
                            <>
                              <span className="text-xs text-gray-600">{isRTL ? 'المؤسسة' : 'Organization'}</span>
                              <span className="text-xs font-medium text-gray-900">
                                {template.organizationId?.branding?.displayName || template.organizationId?.name || 'N/A'}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{t('templates.departments')}</span>
                          <div className="flex flex-wrap gap-1">
                            {template.departments.slice(0, 2).map((dept) => (
                              <span
                                key={dept}
                                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {getDepartmentLabel(dept, template.organizationId || organization, t, i18n.language)}
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
                      {canManageCurrentTemplates && (
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
          </Card>
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

