import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCheck,
  FaChevronDown,
  FaSearch,
  FaSpinner,
  FaTimes
} from 'react-icons/fa';
import { getMediaUrl } from '../../utils/media';
import {
  getDepartmentLabel,
  getRoleBadgeColor,
  getRoleLabel
} from '../../utils/organizationUi';

const getUserId = (user) => String(user?._id || user?.id || '');

const UserAvatar = ({ user, size = 'md' }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = user?.image ? getMediaUrl(user.image) : '';
  const initials = String(user?.name || '?').trim().charAt(0).toUpperCase() || '?';

  const sizeClasses = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-11 w-11 text-sm'
  };

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-2xl ${sizeClasses[size] || sizeClasses.md}`}>
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={user?.name || 'User'}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {(!imageUrl || imageFailed) && (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-dark font-semibold text-white">
          {initials}
        </div>
      )}
    </div>
  );
};

const UserCard = ({ user, organization, selected = false, compact = false, trailing = null }) => {
  const { t, i18n } = useTranslation();
  const role = user?.organizationRole || user?.role;
  const resolvedOrganization = organization
    || (user?.organizationId && typeof user.organizationId === 'object' ? user.organizationId : null)
    || (user?.organization && typeof user.organization === 'object' ? user.organization : null);
  const roleLabel = getRoleLabel(role, t, i18n.language);
  const departmentLabel = getDepartmentLabel(
    user?.department,
    resolvedOrganization,
    t,
    i18n.language
  );
  const organizationName = resolvedOrganization?.branding?.displayName
    || resolvedOrganization?.name
    || '';
  const metaLine = organizationName
    ? `${organizationName}${departmentLabel && departmentLabel !== '--' ? ` • ${departmentLabel}` : ''}`
    : departmentLabel;

  return (
    <div className={`flex items-center gap-3 rounded-2xl ${compact ? 'p-2.5' : 'p-3.5'} ${selected ? 'bg-primary/5' : 'bg-white'}`}>
      <UserAvatar user={user} size={compact ? 'sm' : 'md'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">{user?.name || '--'}</p>
          {!compact && role && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeColor(role)}`}>
              {roleLabel}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-slate-500">{user?.email || '--'}</p>
        <p className="truncate text-xs text-slate-400">{metaLine}</p>
      </div>
      {trailing}
    </div>
  );
};

const UserPicker = ({
  name,
  users = [],
  value,
  onChange,
  multiple = false,
  disabled = false,
  loading = false,
  organization = null,
  placeholder,
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedIds = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
    }

    return value ? [String(value)] : [];
  }, [multiple, value]);

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedIds.includes(getUserId(user))),
    [selectedIds, users]
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      const roleLabel = getRoleLabel(user?.organizationRole || user?.role, t, i18n.language);
      const departmentLabel = getDepartmentLabel(
        user?.department,
        organization
          || (user?.organizationId && typeof user.organizationId === 'object' ? user.organizationId : null)
          || (user?.organization && typeof user.organization === 'object' ? user.organization : null),
        t,
        i18n.language
      );
      const organizationName = user?.organizationId?.branding?.displayName
        || user?.organizationId?.name
        || user?.organization?.branding?.displayName
        || user?.organization?.name
        || '';

      return [
        user?.name,
        user?.email,
        roleLabel,
        departmentLabel,
        organizationName
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [i18n.language, organization, searchTerm, t, users]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setSearchTerm('');
    }
  }, [disabled]);

  const emitChange = (nextValue) => {
    if (typeof onChange === 'function') {
      onChange({
        target: {
          name,
          value: nextValue
        }
      });
    }
  };

  const toggleUser = (user) => {
    const userId = getUserId(user);

    if (!userId || disabled) {
      return;
    }

    if (multiple) {
      const nextValue = selectedIds.includes(userId)
        ? selectedIds.filter((id) => id !== userId)
        : [...selectedIds, userId];

      emitChange(nextValue);
      return;
    }

    emitChange(userId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const removeUser = (userId, event) => {
    event.stopPropagation();

    if (!multiple || disabled) {
      return;
    }

    emitChange(selectedIds.filter((id) => id !== userId));
  };

  const resolvedPlaceholder = placeholder || (
    multiple
      ? t('messages.recipients')
      : t('messages.selectRecipient')
  );

  const renderTriggerContent = () => {
    if (loading && selectedUsers.length === 0) {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FaSpinner className="animate-spin text-primary" />
          <span>{t('messages.loading')}</span>
        </div>
      );
    }

    if (multiple) {
      if (selectedUsers.length === 0) {
        return (
          <div className="text-sm text-slate-500">
            {resolvedPlaceholder}
          </div>
        );
      }

      return (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => {
            const userId = getUserId(user);

            return (
              <div
                key={userId}
                className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-2 py-1"
              >
                <UserAvatar user={user} size="sm" />
                <span className="max-w-[140px] truncate text-xs font-medium text-slate-700">
                  {user?.name}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(event) => removeUser(userId, event)}
                    className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                    aria-label={user?.name || 'Remove user'}
                  >
                    <FaTimes className="text-[10px]" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (selectedUsers[0]) {
      return (
        <UserCard
          user={selectedUsers[0]}
          organization={organization}
          compact
          selected
        />
      );
    }

    return (
      <div className="text-sm text-slate-500">
        {resolvedPlaceholder}
      </div>
    );
  };

  return (
    <div ref={rootRef} className={className}>
      <div
        role={disabled ? undefined : 'button'}
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) {
            setIsOpen((currentValue) => !currentValue);
          }
        }}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen((currentValue) => !currentValue);
          }
        }}
        aria-disabled={disabled}
        className={`w-full rounded-2xl border px-3 py-3 transition ${isRTL ? 'text-right' : 'text-left'} ${
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-50'
            : isOpen
              ? 'border-primary bg-white shadow-lg shadow-primary/10'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
        }`}
        >
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="min-w-0 flex-1">
            {renderTriggerContent()}
          </div>
          {!disabled && (
            <FaChevronDown
              className={`shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180 text-primary' : ''}`}
            />
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-inner">
          <div className="relative mb-3">
            <FaSearch className={`absolute top-1/2 -translate-y-1/2 text-sm text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('messages.searchUsersPlaceholder')}
              className={`w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-primary focus:ring-2 focus:ring-primary/15 ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'}`}
            />
          </div>

          {multiple && selectedUsers.length > 0 && (
            <div className="mb-3 text-xs font-medium text-slate-500">
              {t('messages.selectedRecipientsCount', { count: selectedUsers.length })}
            </div>
          )}

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                <FaSpinner className="animate-spin text-primary" />
                <span>{t('messages.loading')}</span>
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const userId = getUserId(user);
                const isSelected = selectedIds.includes(userId);

                return (
                  <button
                    key={userId}
                    type="button"
                    onClick={() => toggleUser(user)}
                    className={`w-full rounded-2xl border transition ${isRTL ? 'text-right' : 'text-left'} ${isSelected ? 'border-primary bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                  >
                    <UserCard
                      user={user}
                      organization={organization}
                      selected={isSelected}
                      trailing={(
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${isSelected ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-300'}`}>
                          <FaCheck className="text-xs" />
                        </div>
                      )}
                    />
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {users.length > 0 ? t('messages.noRecipientsFound') : t('messages.noRecipientsAvailable')}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {users.length > 0 ? t('messages.tryDifferentFilter') : t('messages.noRecipientsAvailableHint')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPicker;
