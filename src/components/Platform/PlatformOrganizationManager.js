import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaBuilding,
  FaEdit,
  FaGlobe,
  FaPlus,
  FaSearch,
  FaUsers
} from 'react-icons/fa';
import Button from '../Common/Button';
import Card from '../Common/Card';
import Input from '../Common/Input';
import Loading from '../Common/Loading';
import Modal from '../Common/Modal';
import PageTitle from '../Common/PageTilte';
import api from '../../utils/api';
import { showError, showSuccess } from '../../utils/toast';
import {
  getDepartmentLabel,
  getRoleBadgeColor,
  getRoleLabel
} from '../../utils/organizationUi';

const STATUS_OPTIONS = ['active', 'inactive', 'suspended'];
const PLAN_OPTIONS = ['free', 'plus', 'pro'];

const buildOrganizationForm = (organization = null) => ({
  name: organization?.name || '',
  slug: organization?.slug || '',
  status: organization?.status || 'active',
  plan: organization?.plan || organization?.subscription?.planCode || 'free',
  locale: organization?.locale || 'en',
  timezone: organization?.timezone || 'Africa/Cairo',
  allowedDomainsText: Array.isArray(organization?.allowedDomains)
    ? organization.allowedDomains.join('\n')
    : '',
  branding: {
    displayName: organization?.branding?.displayName || '',
    shortName: organization?.branding?.shortName || '',
    emailFromName: organization?.branding?.emailFromName || '',
    websiteUrl: organization?.branding?.websiteUrl || ''
  }
});

const getOrganizationId = (organization) => organization?._id || organization?.id || '';

const getOrganizationName = (organization) => (
  organization?.branding?.displayName ||
  organization?.name ||
  '--'
);

const getStatusClasses = (status) => {
  if (status === 'active') {
    return 'bg-green-100 text-green-800 border border-green-200';
  }

  if (status === 'suspended') {
    return 'bg-amber-100 text-amber-800 border border-amber-200';
  }

  return 'bg-gray-100 text-gray-700 border border-gray-200';
};

const getPlanClasses = (plan) => {
  if (plan === 'pro') {
    return 'bg-slate-900 text-white';
  }

  if (plan === 'plus') {
    return 'bg-blue-100 text-blue-800';
  }

  return 'bg-gray-100 text-gray-700';
};

const PlatformOrganizationManager = ({ mode = 'browse' }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const isManagementMode = mode === 'manage';
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    plan: ''
  });
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingOrganizationId, setEditingOrganizationId] = useState('');
  const [formData, setFormData] = useState(buildOrganizationForm());

  const titleText = isManagementMode
    ? (isRTL ? 'إدارة المنصة' : 'Platform Settings')
    : (isRTL ? 'المؤسسات' : 'Organizations');
  const descriptionText = isManagementMode
    ? (isRTL ? 'إدارة المؤسسات والخطط والإعدادات العامة من مكان واحد.' : 'Manage organizations, plans, and platform-wide setup from one place.')
    : (isRTL ? 'استعرض جميع المؤسسات واعرض أعضاء كل مؤسسة.' : 'Browse every organization in the system and inspect its members.');

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};

      if (filters.search) {
        params.search = filters.search;
      }

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.plan) {
        params.plan = filters.plan;
      }

      const response = await api.get('/organizations', { params });
      setOrganizations(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showError(isRTL ? 'تعذر تحميل المؤسسات.' : 'Unable to load organizations.');
    } finally {
      setLoading(false);
    }
  }, [filters.plan, filters.search, filters.status, isRTL]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const organizationCountLabel = useMemo(() => {
    const count = organizations.length;
    return isRTL ? `${count} مؤسسة` : `${count} organizations`;
  }, [isRTL, organizations.length]);

  const openMembersModal = async (organization) => {
    const organizationId = getOrganizationId(organization);
    if (!organizationId) {
      return;
    }

    setSelectedOrganization(organization);
    setMembers([]);
    setMembersModalOpen(true);
    setMembersLoading(true);

    try {
      const response = await api.get('/users', {
        params: {
          organizationId,
          limit: 100,
          sort: 'name'
        }
      });
      setMembers(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching organization members:', error);
      showError(isRTL ? 'تعذر تحميل أعضاء المؤسسة.' : 'Unable to load organization members.');
    } finally {
      setMembersLoading(false);
    }
  };

  const closeMembersModal = () => {
    setMembersModalOpen(false);
    setMembers([]);
    setSelectedOrganization(null);
  };

  const openCreateModal = () => {
    setEditingOrganizationId('');
    setFormData(buildOrganizationForm());
    setFormModalOpen(true);
  };

  const openEditModal = async (organization) => {
    const organizationId = getOrganizationId(organization);
    if (!organizationId) {
      return;
    }

    setEditingOrganizationId(organizationId);
    setFormLoading(true);
    setFormModalOpen(true);

    try {
      const response = await api.get(`/organizations/${organizationId}`);
      setFormData(buildOrganizationForm(response.data?.data));
    } catch (error) {
      console.error('Error fetching organization details:', error);
      showError(isRTL ? 'تعذر تحميل تفاصيل المؤسسة.' : 'Unable to load organization details.');
      setFormModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    setFormLoading(false);
    setEditingOrganizationId('');
    setFormData(buildOrganizationForm());
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    if (name.startsWith('branding.')) {
      const brandingField = name.split('.')[1];
      setFormData((currentValue) => ({
        ...currentValue,
        branding: {
          ...currentValue.branding,
          [brandingField]: value
        }
      }));
      return;
    }

    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value
    }));
  };

  const handleSaveOrganization = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        status: formData.status,
        plan: formData.plan,
        locale: formData.locale,
        timezone: formData.timezone,
        allowedDomains: formData.allowedDomainsText
          .split(/[\n,]/)
          .map((value) => value.trim())
          .filter(Boolean),
        branding: {
          displayName: formData.branding.displayName,
          shortName: formData.branding.shortName,
          emailFromName: formData.branding.emailFromName,
          websiteUrl: formData.branding.websiteUrl
        }
      };

      if (editingOrganizationId) {
        await api.put(`/organizations/${editingOrganizationId}`, payload);
        showSuccess(isRTL ? 'تم تحديث المؤسسة بنجاح.' : 'Organization updated successfully.');
      } else {
        await api.post('/organizations', payload);
        showSuccess(isRTL ? 'تم إنشاء المؤسسة بنجاح.' : 'Organization created successfully.');
      }

      closeFormModal();
      fetchOrganizations();
    } catch (error) {
      console.error('Error saving organization:', error);
      showError(error.response?.data?.message || (isRTL ? 'تعذر حفظ المؤسسة.' : 'Unable to save organization.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageTitle
          icon={FaBuilding}
          title={titleText}
          description={`${descriptionText} ${organizationCountLabel}`}
        />

        {isManagementMode && (
          <Button onClick={openCreateModal} icon={FaPlus} className="w-full lg:w-auto">
            {isRTL ? 'إضافة مؤسسة' : 'Add Organization'}
          </Button>
        )}
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]">
          <div className="relative">
            <FaSearch className={`absolute top-1/2 -translate-y-1/2 text-sm text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilters((currentValue) => ({ ...currentValue, search: event.target.value }))}
              placeholder={isRTL ? 'ابحث بالاسم أو المعرف' : 'Search by name or slug'}
              className={`w-full rounded-xl border border-gray-300 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'}`}
            />
          </div>

          <select
            value={filters.status}
            onChange={(event) => setFilters((currentValue) => ({ ...currentValue, status: event.target.value }))}
            className="rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">{isRTL ? 'كل الحالات' : 'All statuses'}</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={filters.plan}
            onChange={(event) => setFilters((currentValue) => ({ ...currentValue, plan: event.target.value }))}
            className="rounded-xl border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">{isRTL ? 'كل الخطط' : 'All plans'}</option>
            {PLAN_OPTIONS.map((plan) => (
              <option key={plan} value={plan}>
                {plan.toUpperCase()}
              </option>
            ))}
          </select>

          <Button variant="outline" onClick={fetchOrganizations}>
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </Card>

      {loading ? (
        <Loading />
      ) : organizations.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <FaBuilding className="mx-auto mb-4 text-5xl text-gray-300" />
            <p className="text-lg font-semibold text-gray-700">
              {isRTL ? 'لا توجد مؤسسات مطابقة.' : 'No organizations matched your filters.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {organizations.map((organization) => (
            <Card key={getOrganizationId(organization)} className="h-full">
              <div className="flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-10 w-10 rounded-2xl border"
                        style={{
                          background: `linear-gradient(135deg, ${organization?.branding?.primaryColor || '#01c853'}, ${organization?.branding?.secondaryColor || '#059669'})`
                        }}
                      />
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-gray-900">
                          {getOrganizationName(organization)}
                        </h3>
                        <p className="truncate text-sm text-gray-500">{organization.slug}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(organization.status)}`}>
                      {organization.status}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPlanClasses(organization.plan)}`}>
                      {(organization.plan || 'free').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {isRTL ? 'المستخدمون' : 'Users'}
                    </p>
                    <p className="text-xl font-bold text-gray-900">{organization?.summary?.users || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {isRTL ? 'النشطون' : 'Active'}
                    </p>
                    <p className="text-xl font-bold text-gray-900">{organization?.summary?.activeUsers || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {isRTL ? 'الدعوات' : 'Invites'}
                    </p>
                    <p className="text-xl font-bold text-gray-900">{organization?.summary?.pendingInvitations || 0}</p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 px-4 py-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                      {isRTL ? 'الموقع' : 'Website'}
                    </p>
                    <p className="truncate">
                      {organization?.branding?.websiteUrl || '--'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 px-4 py-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                      {isRTL ? 'الإعدادات المحلية' : 'Locale'}
                    </p>
                    <p>{organization?.locale || '--'} / {organization?.timezone || '--'}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 px-4 py-3 md:col-span-2">
                    <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                      {isRTL ? 'النطاقات المسموحة' : 'Allowed Domains'}
                    </p>
                    <p className="truncate">
                      {Array.isArray(organization?.allowedDomains) && organization.allowedDomains.length > 0
                        ? organization.allowedDomains.join(', ')
                        : '--'}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                  <Button variant="outline" onClick={() => openMembersModal(organization)} icon={FaUsers}>
                    {isRTL ? 'عرض الأعضاء' : 'View Members'}
                  </Button>

                  {isManagementMode && (
                    <Button onClick={() => openEditModal(organization)} icon={FaEdit}>
                      {isRTL ? 'تعديل المؤسسة' : 'Edit Organization'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={membersModalOpen}
        onClose={closeMembersModal}
        size="xl"
        title={selectedOrganization ? `${getOrganizationName(selectedOrganization)} ${isRTL ? '- الأعضاء' : '- Members'}` : ''}
      >
        {membersLoading ? (
          <Loading />
        ) : members.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            {isRTL ? 'لا يوجد أعضاء في هذه المؤسسة.' : 'This organization does not have any members yet.'}
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member._id || member.id}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="truncate text-sm text-gray-500">{member.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(member.organizationRole || member.role)}`}>
                    {getRoleLabel(member.organizationRole || member.role, t, i18n.language)}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {getDepartmentLabel(member.department, selectedOrganization, t, i18n.language)}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${member.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    {member.isActive !== false
                      ? (isRTL ? 'نشط' : 'Active')
                      : (isRTL ? 'غير نشط' : 'Inactive')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        size="xl"
        title={editingOrganizationId
          ? (isRTL ? 'تعديل المؤسسة' : 'Edit Organization')
          : (isRTL ? 'إضافة مؤسسة' : 'Add Organization')}
      >
        {formLoading ? (
          <Loading />
        ) : (
          <form onSubmit={handleSaveOrganization} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={isRTL ? 'اسم المؤسسة' : 'Organization Name'}
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
              <Input
                label={isRTL ? 'المعرف' : 'Slug'}
                name="slug"
                value={formData.slug}
                onChange={handleFormChange}
                required
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {isRTL ? 'الحالة' : 'Status'}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {isRTL ? 'الخطة' : 'Plan'}
                </label>
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {PLAN_OPTIONS.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {isRTL ? 'اللغة' : 'Locale'}
                </label>
                <select
                  name="locale"
                  value={formData.locale}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              <Input
                label={isRTL ? 'المنطقة الزمنية' : 'Timezone'}
                name="timezone"
                value={formData.timezone}
                onChange={handleFormChange}
              />
              <Input
                label={isRTL ? 'اسم العرض' : 'Display Name'}
                name="branding.displayName"
                value={formData.branding.displayName}
                onChange={handleFormChange}
              />
              <Input
                label={isRTL ? 'الاسم المختصر' : 'Short Name'}
                name="branding.shortName"
                value={formData.branding.shortName}
                onChange={handleFormChange}
              />
              <Input
                label={isRTL ? 'اسم مرسل البريد' : 'Email Sender Name'}
                name="branding.emailFromName"
                value={formData.branding.emailFromName}
                onChange={handleFormChange}
              />
              <Input
                label={isRTL ? 'الموقع الإلكتروني' : 'Website URL'}
                name="branding.websiteUrl"
                value={formData.branding.websiteUrl}
                onChange={handleFormChange}
                icon={FaGlobe}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {isRTL ? 'النطاقات المسموحة' : 'Allowed Domains'}
              </label>
              <textarea
                name="allowedDomainsText"
                value={formData.allowedDomainsText}
                onChange={handleFormChange}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={isRTL ? 'example.com' : 'example.com'}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
              <Button type="button" variant="outline" onClick={closeFormModal}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? (isRTL ? 'جارٍ الحفظ...' : 'Saving...')
                  : (editingOrganizationId
                    ? (isRTL ? 'حفظ التغييرات' : 'Save Changes')
                    : (isRTL ? 'إنشاء المؤسسة' : 'Create Organization'))}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default PlatformOrganizationManager;
