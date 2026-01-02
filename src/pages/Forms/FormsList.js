import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatDate } from '../../utils/dateUtils';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Loading from '../../components/Common/Loading';
import FilterBar from '../../components/Common/FilterBar';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { showSuccess, showError } from '../../utils/toast';
import { useConfirm } from '../../hooks/useConfirm';
import { FaFilePdf, FaCheckCircle, FaTimesCircle, FaTrashAlt, FaPlus, FaEye, FaTh, FaList, FaCalendarAlt, FaPaperPlane } from 'react-icons/fa';


const FormsList = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [forms, setForms] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    templateId: searchParams.get('templateId') || '',
    department: searchParams.get('department') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || ''
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const { confirmState, confirm, closeConfirm } = useConfirm();

  // Sync filters state with URL params when URL changes
  useEffect(() => {
    setFilters({
      status: searchParams.get('status') || '',
      templateId: searchParams.get('templateId') || '',
      department: searchParams.get('department') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || ''
    });
  }, [searchParams]);

  useEffect(() => {
    fetchForms();
    fetchTemplates();
  }, [filters]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.templateId) params.append('templateId', filters.templateId);
      if (filters.department) params.append('department', filters.department);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await api.get(`/form-instances?${params.toString()}`);
      setForms(response.data.data);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/form-templates');
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) params.set(key, newFilters[key]);
    });
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      templateId: '',
      department: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchParams(new URLSearchParams());
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: t('common.confirmDelete'),
      message: t('forms.confirmDeleteMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/form-instances/${id}`);
      showSuccess(t('forms.deletedSuccessfully'));
      fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      showError(t('forms.errorDeleting'));
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await api.put(`/form-instances/${id}/approve`, { status });
      showSuccess(t('forms.statusUpdated'));
      fetchForms();
    } catch (error) {
      console.error('Error updating form status:', error);
      showError(t('forms.errorUpdating'));
    }
  };

  const handleSubmit = async (id) => {
    const confirmed = await confirm({
      title: t('forms.submitForm'),
      message: t('forms.confirmSubmitMessage'),
      confirmText: t('forms.submit'),
      cancelText: t('common.cancel'),
      type: 'info'
    });

    if (!confirmed) return;

    try {
      await api.put(`/form-instances/${id}`, { status: 'submitted' });
      showSuccess(t('forms.submittedSuccessfully'));
      fetchForms();
    } catch (error) {
      console.error('Error submitting form:', error);
      showError(t('forms.errorSubmitting'));
    }
  };

  const exportPDF = async (id) => {
    try {
      const response = await api.get(`/form-instances/${id}/export`, {
        responseType: 'blob',
        params: { language: user?.languagePreference || 'ar' }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess(t('forms.exportSuccess'));
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError(t('forms.errorExporting'));
    }
  };

  if (loading) return <Loading />;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{t('forms.title')}</h1>
            <p className="text-gray-600 mt-1">{t('forms.manageAndTrackForms')}</p>
          </div>
          <Link to="/forms/new">
            <Button className="flex items-center space-x-2">
              <FaPlus />
              <span>{t('forms.createForm')}</span>
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          filterConfig={[
            {
              name: 'status',
              label: t('forms.status'),
              allLabel: t('common.all'),
              options: [
                { value: 'draft', label: t('forms.draft') },
                { value: 'submitted', label: t('forms.submitted') },
                { value: 'approved', label: t('forms.approved') },
                { value: 'rejected', label: t('forms.rejected') }
              ]
            },
            {
              name: 'templateId',
              label: t('forms.templates'),
              allLabel: t('forms.allTemplates'),
              options: templates.map(t => ({
                value: t._id,
                label: isRTL ? (t.title.ar || t.title.en) : t.title.en
              }))
            },
            ...(user?.role === 'admin' || user?.role === 'supervisor' ? [{
              name: 'department',
              label: t('forms.department'),
              allLabel: t('common.allDepartments'),
              options: [
                { value: 'kitchen', label: t('departments.kitchen') },
                { value: 'counter', label: t('departments.counter') },
                { value: 'cleaning', label: t('departments.cleaning') },
                { value: 'management', label: t('departments.management') },
                { value: 'delivery', label: t('departments.delivery') }
              ]
            }] : [])
          ]}
        />

        {/* Forms Table/Cards */}
        <Card>
          {forms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('forms.noForms')}
            </div>
          ) : (
            <>
              {/* View Toggle */}
              <div className="mb-4 flex items-center justify-end">
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
                    <thead className={`bg-gray-50 ${t('language') === 'ar' ? 'text-right' : 'text-left'}`}>
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('forms.templateDetails')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('forms.filledBy')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('forms.department')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('forms.status')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('forms.date')}
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          {t('common.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {forms.map((form) => (
                        <tr key={form._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <Link
                              to={`/forms/view/${form._id}`}
                              className="text-primary hover:text-primary-dark font-medium"
                            >
                              {isRTL ? (form.templateId?.title?.ar || 'N/A') : (form.templateId?.title?.en || 'N/A')}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {form.filledBy?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {form.department ? t(`departments.${form.department}`) : t('common.na')}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${form.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : form.status === 'submitted'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : form.status === 'rejected'
                                    ? 'bg-primary text-primary-darko'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {t(`forms.${form.status}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(form.date, i18n.language)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center space-x-3">
                              <Link
                                to={`/forms/view/${form._id}`}
                                className={`text-blue-600 hover:text-blue-800 hover:scale-110 transition-all ${isRTL ? 'ml-2' : ''}`}
                                title={t('common.view')}
                              >
                                <FaEye className="text-xl" />
                              </Link>
                              <button
                                onClick={() => navigate(`/forms/print/${form._id}`)}
                                className="text-primary hover:text-primary-darko hover:scale-110 transition-all"
                                title={t('forms.exportPDF')}
                              >
                                <FaFilePdf className="text-xl" />
                              </button>

                              {form.status === 'draft' && (
                                <button
                                  onClick={() => handleSubmit(form._id)}
                                  className="text-blue-600 hover:text-blue-800 hover:scale-110 transition-all"
                                  title={t('forms.submitForm')}
                                >
                                  <FaPaperPlane className="text-xl" />
                                </button>
                              )}

                              {(user?.role === 'admin' || user?.role === 'supervisor') &&
                                form.status === 'submitted' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(form._id, 'approved')}
                                      className="text-green-600 hover:text-green-800 hover:scale-110 transition-all"
                                      title={t('forms.approveForm')}
                                    >
                                      <FaCheckCircle className="text-xl" />
                                    </button>
                                    <button
                                      onClick={() => handleApprove(form._id, 'rejected')}
                                      className="text-primary hover:text-primary-darko hover:scale-110 transition-all"
                                      title={t('forms.rejectForm')}
                                    >
                                      <FaTimesCircle className="text-xl" />
                                    </button>
                                  </>
                                )}

                              {user?.role === 'admin' && (
                                <button
                                  onClick={() => handleDelete(form._id)}
                                  className="text-primary hover:text-primary-darko hover:scale-110 transition-all"
                                  title={t('common.delete')}
                                >
                                  <FaTrashAlt className="text-xl" />
                                </button>
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
                    {forms.map((form) => (
                      <div
                        key={form._id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <Link
                            to={`/forms/view/${form._id}`}
                            className="flex items-start gap-3 flex-1 group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FaFilePdf className="text-blue-600 text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                                {isRTL ? (form.templateId?.title?.ar || 'N/A') : (form.templateId?.title?.en || 'N/A')}
                              </h4>
                              <p className="text-xs text-gray-500">#{form._id.slice(-6)}</p>
                            </div>
                          </Link>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {form.filledBy?.name?.charAt(0).toUpperCase() || 'N'}
                            </div>
                            <span className="text-xs text-gray-600 truncate">{form.filledBy?.name || 'N/A'}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{t(`departments.${form.department}`) || form.department}</span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${form.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : form.status === 'submitted'
                                  ? 'bg-amber-100 text-amber-800'
                                  : form.status === 'rejected'
                                    ? 'bg-primary text-primary-darko'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {t(`forms.${form.status}`)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-gray-500 pt-2 border-t border-gray-100">
                            <FaCalendarAlt className="flex-shrink-0" />
                            <span>{formatDate(form.date, i18n.language)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/forms/view/${form._id}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title={t('common.view')}
                            >
                              <FaEye className="text-sm" />
                            </Link>
                            <button
                              onClick={() => exportPDF(form._id)}
                              className="text-primary hover:text-primary-darko transition-colors"
                              title={t('forms.exportPDF')}
                            >
                              <FaFilePdf className="text-sm" />
                            </button>

                            {form.status === 'draft' && (
                              <button
                                onClick={() => handleSubmit(form._id)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title={t('forms.submitForm')}
                              >
                                <FaPaperPlane className="text-sm" />
                              </button>
                            )}

                            {(user?.role === 'admin' || user?.role === 'supervisor') &&
                              form.status === 'submitted' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(form._id, 'approved')}
                                    className="text-green-600 hover:text-green-800 transition-colors"
                                    title={t('forms.approveForm')}
                                  >
                                    <FaCheckCircle className="text-sm" />
                                  </button>
                                  <button
                                    onClick={() => handleApprove(form._id, 'rejected')}
                                    className="text-primary hover:text-primary-darko transition-colors"
                                    title={t('forms.rejectForm')}
                                  >
                                    <FaTimesCircle className="text-sm" />
                                  </button>
                                </>
                              )}

                            {user?.role === 'admin' && (
                              <button
                                onClick={() => handleDelete(form._id)}
                                className="text-primary hover:text-primary-darko transition-colors"
                                title={t('common.delete')}
                              >
                                <FaTrashAlt className="text-sm" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
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

export default FormsList;

