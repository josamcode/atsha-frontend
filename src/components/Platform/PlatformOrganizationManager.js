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
import FilterBar from '../Common/FilterBar';
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
const DEFAULT_PLAN_OPTIONS = ['free', 'plus', 'pro'];

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

const getOrganizationPlanCode = (organization) => (
  organization?.subscription?.effectivePlanCode
  || organization?.subscription?.subscribedPlanCode
  || organization?.subscription?.plan?.code
  || organization?.plan
  || 'free'
);

const getPlanName = (plan, language = 'en') => (
  plan?.name?.[language]
  || plan?.name?.en
  || String(plan?.code || '').toUpperCase()
);

const getPlanDescription = (plan, language = 'en') => (
  plan?.description?.[language]
  || plan?.description?.en
  || ''
);

const formatLabel = (value) => {
  const normalizedValue = String(value || '').replace(/[_-]+/g, ' ').trim();
  if (!normalizedValue) {
    return '--';
  }

  return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
};

const getStatusClasses = (status) => {
  if (status === 'active') {
    return 'border border-green-200 bg-green-50 text-green-700';
  }

  if (status === 'suspended') {
    return 'border border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border border-gray-200 bg-gray-50 text-gray-600';
};

const getPlanClasses = (plan) => {
  if (plan === 'pro') {
    return 'bg-slate-900 text-white border border-slate-900';
  }

  if (plan === 'plus') {
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  }

  return 'bg-gray-100 text-gray-700 border border-gray-200';
};

const PlatformOrganizationManager = ({ mode = 'browse' }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const isManagementMode = mode === 'manage';
  const [organizations, setOrganizations] = useState([]);
  const [planOptions, setPlanOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    plan: ''
  });
  const [searchValue, setSearchValue] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingOrganizationId, setEditingOrganizationId] = useState('');
  const [formData, setFormData] = useState(buildOrganizationForm());
  const availablePlans = planOptions.length > 0
    ? planOptions
    : DEFAULT_PLAN_OPTIONS.map((plan) => ({
      code: plan,
      name: {
        en: plan.toUpperCase()
      }
    }));
  const planLookup = useMemo(() => availablePlans.reduce((result, plan) => {
    result[plan.code] = plan;
    return result;
  }, {}), [availablePlans]);
  const filterConfig = useMemo(() => ([
    {
      name: 'status',
      label: isRTL ? 'الحالة' : 'Status',
      allLabel: isRTL ? 'كل الحالات' : 'All statuses',
      options: STATUS_OPTIONS.map((status) => ({
        value: status,
        label: formatLabel(status)
      }))
    },
    {
      name: 'plan',
      label: isRTL ? 'الخطة' : 'Plan',
      allLabel: isRTL ? 'كل الخطط' : 'All plans',
      options: availablePlans.map((plan) => ({
        value: plan.code,
        label: getPlanName(plan, i18n.language)
      }))
    }
  ]), [availablePlans, i18n.language, isRTL]);

  const titleText = isManagementMode
    ? (isRTL ? 'إدارة المنصة' : 'Platform Settings')
    : (isRTL ? 'المؤسسات' : 'Organizations');
  const descriptionText = isManagementMode
    ? (isRTL ? 'إدارة المؤسسات والخطط والإعدادات العامة من مكان واحد.' : 'Manage organizations, plans, and platform-wide setup from one place.')
    : (isRTL ? 'استعرض جميع المؤسسات واعرض أعضاء كل مؤسسة.' : 'Browse every organization in the system and inspect its members.');

  const fetchPlans = useCallback(async () => {
    try {
      const response = await api.get('/platform/plans', {
        params: {
          includeInactive: true
        }
      });
      setPlanOptions(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching platform plans:', error);
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};

      if (appliedSearch) {
        params.search = appliedSearch;
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
  }, [appliedSearch, filters.plan, filters.status, isRTL]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAppliedSearch(searchValue.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const organizationCountLabel = useMemo(() => {
    const count = organizations.length;
    return isRTL ? `${count} مؤسسة` : `${count} organizations`;
  }, [isRTL, organizations.length]);

  const listedSummary = useMemo(() => (
    organizations.reduce((result, organization) => ({
      organizations: result.organizations + 1,
      activeOrganizations: result.activeOrganizations + (organization.status === 'active' ? 1 : 0),
      users: result.users + (organization?.summary?.users || 0),
      pendingInvitations: result.pendingInvitations + (organization?.summary?.pendingInvitations || 0)
    }), {
      organizations: 0,
      activeOrganizations: 0,
      users: 0,
      pendingInvitations: 0
    })
  ), [organizations]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentValue) => ({
      ...currentValue,
      [name]: value
    }));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedSearch(searchValue.trim());
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      plan: ''
    });
    setSearchValue('');
    setAppliedSearch('');
  };

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
    setFormData({
      ...buildOrganizationForm(),
      plan: availablePlans[0]?.code || 'free'
    });
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

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        filterConfig={filterConfig}
        showSearch
        searchValue={searchValue}
        onSearchChange={(event) => setSearchValue(event.target.value)}
        onSearchSubmit={handleSearchSubmit}
        searchPlaceholder={isRTL ? 'ابحث بالاسم أو المعرف' : 'Search by name or slug'}
      />

      {false && (
      <Card>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]">
          <div className="relative">
            <FaSearch className={`absolute top-1/2 -translate-y-1/2 text-sm text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchValue}
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
            {availablePlans.map((plan) => (
              <option key={plan.code} value={plan.code}>
                {getPlanName(plan, i18n.language)}
              </option>
            ))}
          </select>

          <Button variant="outline" onClick={fetchOrganizations}>
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {isRTL ? 'المؤسسات' : 'Listed Organizations'}
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{listedSummary.organizations}</p>
          <p className="mt-1 text-sm text-gray-500">
            {isRTL ? `نشط: ${listedSummary.activeOrganizations}` : `${listedSummary.activeOrganizations} active`}
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {isRTL ? 'المستخدمون' : 'Users'}
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{listedSummary.users}</p>
          <p className="mt-1 text-sm text-gray-500">
            {isRTL ? 'عبر جميع المؤسسات' : 'Across the filtered organizations'}
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {isRTL ? 'الدعوات' : 'Pending Invites'}
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{listedSummary.pendingInvitations}</p>
          <p className="mt-1 text-sm text-gray-500">
            {isRTL ? 'بانتظار التفعيل' : 'Waiting for activation'}
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {isRTL ? 'الخطط' : 'Plan Catalog'}
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{availablePlans.length}</p>
          <p className="mt-1 text-sm text-gray-500">
            {isRTL ? 'خطط متاحة للتنظيم' : 'Live plans available for assignment'}
          </p>
        </div>
      </div>

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
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            {organizations.map((organization) => {
              const organizationPlanCode = getOrganizationPlanCode(organization);
              const organizationPlan = planLookup[organizationPlanCode] || { code: organizationPlanCode };

              return (
                <Card key={`simple-${getOrganizationId(organization)}`} className="h-full rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex h-full flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-sm font-semibold uppercase text-gray-700">
                          {(getOrganizationName(organization) || 'O').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-gray-900">
                            {getOrganizationName(organization)}
                          </h3>
                          <p className="mt-1 truncate text-sm text-gray-500">
                            {organization.slug || '--'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(organization.status)}`}>
                          {formatLabel(organization.status)}
                        </span>
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                          {getPlanName(organizationPlan, i18n.language)}
                        </span>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            {isRTL ? 'المستخدمون' : 'Users'}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-gray-900">
                            {organization?.summary?.users || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            {isRTL ? 'النشطون' : 'Active'}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-gray-900">
                            {organization?.summary?.activeUsers || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            {isRTL ? 'الدعوات' : 'Invites'}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-gray-900">
                            {organization?.summary?.pendingInvitations || 0}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-gray-500">
                        {organization?.locale || '--'} / {organization?.timezone || '--'}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-gray-200 px-5 py-4">
                      <Button variant="outline" onClick={() => openMembersModal(organization)} icon={FaUsers} className='w-full'>
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
              );
            })}
          </div>

          {false && (
        <div className="grid gap-5 xl:grid-cols-2">
          {organizations.map((organization) => (
            <Card key={getOrganizationId(organization)} className="h-full overflow-hidden rounded-3xl border border-gray-200 p-0 shadow-sm">
              <div className="flex h-full flex-col">
                <div
                  className="px-5 py-5 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${organization?.branding?.primaryColor || '#0f172a'}, ${organization?.branding?.secondaryColor || '#1d4ed8'})`
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold uppercase text-white shadow-sm"
                        >
                          {(getOrganizationName(organization) || 'O').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-bold">
                            {getOrganizationName(organization)}
                          </h3>
                          <p className="truncate text-sm text-white/75">{organization.slug}</p>
                          {getPlanDescription(planLookup[getOrganizationPlanCode(organization)], i18n.language) ? (
                            <p className="mt-2 line-clamp-2 text-sm text-white/80">
                              {getPlanDescription(planLookup[getOrganizationPlanCode(organization)], i18n.language)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(organization.status)}`}>
                        {organization.status}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPlanClasses(getOrganizationPlanCode(organization))}`}>
                        {getPlanName(planLookup[getOrganizationPlanCode(organization)] || { code: getOrganizationPlanCode(organization) }, i18n.language)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-wide text-white/70">
                        {isRTL ? 'المستخدمون' : 'Users'}
                      </p>
                      <p className="mt-2 text-2xl font-bold">{organization?.summary?.users || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-wide text-white/70">
                        {isRTL ? 'النشطون' : 'Active'}
                      </p>
                      <p className="mt-2 text-2xl font-bold">{organization?.summary?.activeUsers || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-wide text-white/70">
                        {isRTL ? 'الدعوات' : 'Invites'}
                      </p>
                      <p className="mt-2 text-2xl font-bold">{organization?.summary?.pendingInvitations || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {isRTL ? 'الموقع' : 'Website'}
                      </p>
                      <p className="mt-2 truncate text-sm font-medium text-gray-900">
                        {organization?.branding?.websiteUrl || '--'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {isRTL ? 'الإعدادات المحلية' : 'Locale'}
                      </p>
                      <p className="mt-2 text-sm font-medium text-gray-900">{organization?.locale || '--'} / {organization?.timezone || '--'}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-4 md:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {isRTL ? 'النطاقات المسموحة' : 'Allowed Domains'}
                      </p>
                      <p className="mt-2 truncate text-sm font-medium text-gray-900">
                        {Array.isArray(organization?.allowedDomains) && organization.allowedDomains.length > 0
                          ? organization.allowedDomains.join(', ')
                          : '--'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4">
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
              </div>
            </Card>
          ))}
        </div>
          )}
        </>
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
                  {availablePlans.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {getPlanName(plan, i18n.language)}
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
