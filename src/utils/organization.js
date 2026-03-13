const ORGANIZATION_QUERY_PARAM = 'organization';
const ORGANIZATION_SLUG_STORAGE_KEY = 'organizationSlug';
const ORGANIZATION_STORAGE_KEY = 'organization';

export const AUTH_STORAGE_KEYS = {
  user: 'user',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken'
};

const ROLE_ALIASES = {
  platform_admin: 'platform_admin',
  organization_admin: 'organization_admin',
  admin: 'organization_admin',
  supervisor: 'supervisor',
  employee: 'employee',
  qr_manager: 'qr_manager',
  'qr-manager': 'qr_manager'
};

const LEGACY_ROLE_ALIASES = {
  platform_admin: 'platform_admin',
  organization_admin: 'admin',
  supervisor: 'supervisor',
  employee: 'employee',
  qr_manager: 'qr-manager'
};

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const readStorage = (key) => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

const writeStorage = (key, value) => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // Ignore storage write failures.
  }
};

const removeStorage = (key) => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    // Ignore storage removal failures.
  }
};

export const normalizeOrganizationSlug = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue || null;
};

export const getOrganizationSlugFromSearch = (search = '') => {
  const params = new URLSearchParams(search || '');
  return normalizeOrganizationSlug(
    params.get('organizationSlug') || params.get(ORGANIZATION_QUERY_PARAM)
  );
};

export const getStoredOrganizationSlug = () => {
  return normalizeOrganizationSlug(readStorage(ORGANIZATION_SLUG_STORAGE_KEY));
};

export const setStoredOrganizationSlug = (slug) => {
  const normalizedSlug = normalizeOrganizationSlug(slug);

  if (!normalizedSlug) {
    removeStorage(ORGANIZATION_SLUG_STORAGE_KEY);
    return null;
  }

  writeStorage(ORGANIZATION_SLUG_STORAGE_KEY, normalizedSlug);
  return normalizedSlug;
};

export const clearStoredOrganizationSlug = () => {
  removeStorage(ORGANIZATION_SLUG_STORAGE_KEY);
};

export const getStoredOrganization = () => {
  const rawValue = readStorage(ORGANIZATION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object') {
      clearStoredOrganization();
      return null;
    }

    return parsedValue;
  } catch (error) {
    clearStoredOrganization();
    return null;
  }
};

export const setStoredOrganization = (organization) => {
  if (!organization || typeof organization !== 'object') {
    clearStoredOrganization();
    return null;
  }

  writeStorage(ORGANIZATION_STORAGE_KEY, JSON.stringify(organization));

  if (organization.slug) {
    setStoredOrganizationSlug(organization.slug);
  }

  return organization;
};

export const clearStoredOrganization = () => {
  removeStorage(ORGANIZATION_STORAGE_KEY);
};

export const getResolvedOrganizationSlug = ({ search = '', organization = null, fallbackSlug = null } = {}) => {
  return (
    getOrganizationSlugFromSearch(search) ||
    normalizeOrganizationSlug(fallbackSlug) ||
    normalizeOrganizationSlug(organization?.slug) ||
    getStoredOrganizationSlug() ||
    null
  );
};

export const normalizeClientRole = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  return ROLE_ALIASES[value] || value;
};

export const toLegacyClientRole = (value) => {
  const normalizedRole = normalizeClientRole(value);
  return LEGACY_ROLE_ALIASES[normalizedRole] || normalizedRole;
};

export const getUserOrganizationRole = (user) => {
  if (!user) {
    return null;
  }

  return normalizeClientRole(user.organizationRole || user.role);
};

export const roleMatches = (userOrRole, allowedRoles = []) => {
  if (!allowedRoles.length) {
    return true;
  }

  const normalizedUserRole = normalizeClientRole(
    typeof userOrRole === 'string' ? userOrRole : getUserOrganizationRole(userOrRole)
  );

  if (!normalizedUserRole) {
    return false;
  }

  return allowedRoles
    .map((role) => normalizeClientRole(role))
    .includes(normalizedUserRole);
};

export const isQrManager = (user) => {
  return getUserOrganizationRole(user) === 'qr_manager';
};

export const isPlatformAdmin = (user) => {
  return getUserOrganizationRole(user) === 'platform_admin';
};

export const isOrganizationAdmin = (user) => {
  return getUserOrganizationRole(user) === 'organization_admin';
};

export const hasOrganizationFeature = (organization, featureKey) => {
  if (!featureKey) {
    return true;
  }

  return Boolean(
    organization?.subscription?.entitlements?.features?.[featureKey]
  );
};

export const getDefaultAuthenticatedPath = (user) => {
  if (isQrManager(user)) {
    return '/qr';
  }

  return '/dashboard';
};

export const buildPathWithOrganization = (path, organizationSlug, extraParams = {}) => {
  const [pathname, rawSearch = ''] = String(path || '/').split('?');
  const params = new URLSearchParams(rawSearch);
  const normalizedSlug = normalizeOrganizationSlug(organizationSlug);

  if (normalizedSlug) {
    params.set(ORGANIZATION_QUERY_PARAM, normalizedSlug);
  } else {
    params.delete(ORGANIZATION_QUERY_PARAM);
    params.delete('organizationSlug');
  }

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      params.delete(key);
      return;
    }

    params.set(key, value);
  });

  const search = params.toString();
  return `${pathname || '/'}${search ? `?${search}` : ''}`;
};

export const buildLoginPath = (locationLike, organizationSlug) => {
  const pathname = typeof locationLike === 'string'
    ? locationLike
    : `${locationLike?.pathname || '/'}${locationLike?.search || ''}`;

  if (pathname.startsWith('/login')) {
    return buildPathWithOrganization('/login', organizationSlug);
  }

  return buildPathWithOrganization('/login', organizationSlug, {
    redirect: pathname
  });
};

export const buildOrganizationHeaders = (organizationSlug) => {
  const normalizedSlug = normalizeOrganizationSlug(organizationSlug);

  if (!normalizedSlug) {
    return {};
  }

  return {
    'X-Organization-Slug': normalizedSlug
  };
};

export const decodeJwtPayload = (token) => {
  if (!token) {
    return null;
  }

  try {
    const segments = token.split('.');
    if (segments.length !== 3) {
      return null;
    }

    return JSON.parse(atob(segments[1]));
  } catch (error) {
    return null;
  }
};

export const getTokenOrganizationId = (token) => {
  return decodeJwtPayload(token)?.organizationId || null;
};

export const getStoredUser = () => {
  const rawValue = readStorage(AUTH_STORAGE_KEYS.user);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : null;
  } catch (error) {
    removeStorage(AUTH_STORAGE_KEYS.user);
    return null;
  }
};

export const setStoredUser = (user) => {
  if (!user || typeof user !== 'object') {
    removeStorage(AUTH_STORAGE_KEYS.user);
    return null;
  }

  writeStorage(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
  return user;
};

export const getStoredAccessToken = () => {
  return readStorage(AUTH_STORAGE_KEYS.accessToken);
};

export const setStoredAccessToken = (token) => {
  if (!token) {
    removeStorage(AUTH_STORAGE_KEYS.accessToken);
    return null;
  }

  writeStorage(AUTH_STORAGE_KEYS.accessToken, token);
  return token;
};

export const getStoredRefreshToken = () => {
  return readStorage(AUTH_STORAGE_KEYS.refreshToken);
};

export const setStoredRefreshToken = (token) => {
  if (!token) {
    removeStorage(AUTH_STORAGE_KEYS.refreshToken);
    return null;
  }

  writeStorage(AUTH_STORAGE_KEYS.refreshToken, token);
  return token;
};

export const syncStoredAuthSession = ({ user, accessToken, refreshToken, organization }) => {
  setStoredUser(user);
  setStoredAccessToken(accessToken);
  setStoredRefreshToken(refreshToken);

  if (organization) {
    setStoredOrganization(organization);
  }
};

export const clearStoredAuthSession = ({ preserveOrganization = true } = {}) => {
  removeStorage(AUTH_STORAGE_KEYS.user);
  removeStorage(AUTH_STORAGE_KEYS.accessToken);
  removeStorage(AUTH_STORAGE_KEYS.refreshToken);

  if (!preserveOrganization) {
    clearStoredOrganization();
    clearStoredOrganizationSlug();
  }
};
