import {
  getUserOrganizationRole,
  roleMatches
} from './organization';

const DEFAULT_DEPARTMENT_LABELS = {
  kitchen: { en: 'Kitchen', ar: 'المطبخ' },
  counter: { en: 'Counter', ar: 'الكاونتر' },
  cleaning: { en: 'Cleaning', ar: 'النظافة' },
  management: { en: 'Management', ar: 'الإدارة' },
  delivery: { en: 'Delivery', ar: 'التوصيل' },
  other: { en: 'Other', ar: 'أخرى' }
};
const DEFAULT_DEPARTMENT_CODES = Object.keys(DEFAULT_DEPARTMENT_LABELS);

const ROLE_LABEL_KEYS = {
  platform_admin: 'users.platformAdmin',
  organization_admin: 'users.organizationAdmin',
  supervisor: 'users.supervisor',
  employee: 'users.employee',
  qr_manager: 'users.qrManager'
};

const ROLE_FALLBACK_LABELS = {
  platform_admin: { en: 'Platform Admin', ar: 'مدير المنصة' },
  organization_admin: { en: 'Organization Admin', ar: 'مدير المنظمة' },
  supervisor: { en: 'Supervisor', ar: 'مشرف' },
  employee: { en: 'Employee', ar: 'موظف' },
  qr_manager: { en: 'QR Manager', ar: 'مسؤول QR' }
};

const ROLE_BADGE_CLASSES = {
  platform_admin: 'bg-slate-900 text-white',
  organization_admin: 'bg-primary text-white',
  supervisor: 'bg-blue-100 text-blue-800',
  employee: 'bg-green-100 text-green-800',
  qr_manager: 'bg-amber-100 text-amber-800'
};

const translateFallback = (t, key, fallbackValue) => {
  const translatedValue = t(key);
  return translatedValue === key ? fallbackValue : translatedValue;
};

export const getOrganizationDepartments = (organization, { includeInactive = false } = {}) => {
  const departments = Array.isArray(organization?.departments)
    ? organization.departments
    : [];

  const resolvedDepartments = departments.length > 0
    ? departments
    : DEFAULT_DEPARTMENT_CODES.map((code, index) => ({
      code,
      name: DEFAULT_DEPARTMENT_LABELS[code],
      isActive: true,
      sortOrder: index
    }));

  return resolvedDepartments
    .filter((department) => includeInactive || department?.isActive !== false)
    .sort((left, right) => (left?.sortOrder ?? 0) - (right?.sortOrder ?? 0));
};

export const getDepartmentLabel = (departmentCode, organization, t, language = 'en') => {
  if (!departmentCode) {
    return '--';
  }

  if (departmentCode === 'all') {
    return translateFallback(t, 'common.allDepartments', 'All Departments');
  }

  const organizationDepartment = getOrganizationDepartments(organization, { includeInactive: true })
    .find((department) => department.code === departmentCode);

  if (organizationDepartment) {
    return organizationDepartment.name?.[language] ||
      organizationDepartment.name?.en ||
      organizationDepartment.code;
  }

  const fallbackLabels = DEFAULT_DEPARTMENT_LABELS[departmentCode];
  if (fallbackLabels) {
    return fallbackLabels[language] || fallbackLabels.en;
  }

  const translatedValue = t(`departments.${departmentCode}`);
  return translatedValue === `departments.${departmentCode}`
    ? departmentCode
    : translatedValue;
};

export const getDepartmentOptions = (
  organization,
  t,
  language = 'en',
  { includeAll = false, includeInactive = false } = {}
) => {
  const options = getOrganizationDepartments(organization, { includeInactive })
    .map((department) => ({
      value: department.code,
      label: getDepartmentLabel(department.code, organization, t, language)
    }));

  if (!includeAll) {
    return options;
  }

  return [
    {
      value: 'all',
      label: translateFallback(t, 'common.allDepartments', 'All Departments')
    },
    ...options
  ];
};

export const getRoleLabel = (role, t, language = 'en') => {
  const normalizedRole = getUserOrganizationRole({ role, organizationRole: role });
  const labelKey = ROLE_LABEL_KEYS[normalizedRole];
  const fallbackLabels = ROLE_FALLBACK_LABELS[normalizedRole];

  if (!labelKey) {
    return fallbackLabels?.[language] || fallbackLabels?.en || String(normalizedRole || role || '--').replace(/_/g, ' ');
  }

  return translateFallback(
    t,
    labelKey,
    fallbackLabels?.[language] || fallbackLabels?.en || normalizedRole.replace(/_/g, ' ')
  );
};

export const getRoleBadgeColor = (role) => {
  const normalizedRole = getUserOrganizationRole({ role, organizationRole: role });
  return ROLE_BADGE_CLASSES[normalizedRole] || 'bg-gray-100 text-gray-800';
};

export const canManageUsers = (user) => roleMatches(user, ['platform_admin', 'organization_admin']);

export const canManageTemplates = (user) => roleMatches(user, ['platform_admin', 'organization_admin']);

export const canReviewForms = (user) => roleMatches(user, ['platform_admin', 'organization_admin', 'supervisor']);

export const canDeleteForms = (user) => roleMatches(user, ['platform_admin', 'organization_admin']);

export const canViewUserAnalytics = (user) => roleMatches(user, ['platform_admin', 'organization_admin']);

export const getAssignableRoleOptions = (actor, t, language = 'en') => {
  const options = [
    {
      value: 'organization_admin',
      label: getRoleLabel('organization_admin', t, language)
    },
    {
      value: 'supervisor',
      label: getRoleLabel('supervisor', t, language)
    },
    {
      value: 'employee',
      label: getRoleLabel('employee', t, language)
    },
    {
      value: 'qr_manager',
      label: getRoleLabel('qr_manager', t, language)
    }
  ];

  if (roleMatches(actor, ['platform_admin'])) {
    return [
      {
        value: 'platform_admin',
        label: getRoleLabel('platform_admin', t, language)
      },
      ...options
    ];
  }

  return options;
};

export const getManagedDepartmentCodes = (user) => {
  if (roleMatches(user, ['platform_admin', 'organization_admin'])) {
    return null;
  }

  const explicitDepartments = Array.isArray(user?.departments)
    ? user.departments.filter(Boolean)
    : [];

  if (explicitDepartments.includes('all')) {
    return null;
  }

  if (explicitDepartments.length > 0) {
    return explicitDepartments;
  }

  return user?.department ? [user.department] : [];
};

export const templateMatchesManagedDepartments = (template, user) => {
  if (!template) {
    return false;
  }

  if (roleMatches(user, ['platform_admin', 'organization_admin'])) {
    return true;
  }

  if (template.departments?.includes('all')) {
    return true;
  }

  const managedDepartments = getManagedDepartmentCodes(user);
  if (!managedDepartments || managedDepartments.length === 0) {
    return false;
  }

  return managedDepartments.some((departmentCode) => template.departments?.includes(departmentCode));
};
