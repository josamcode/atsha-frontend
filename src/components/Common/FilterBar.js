import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomSelect from './CustomSelect';
import {
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';

const FilterBar = ({
  filters,
  onFilterChange,
  onReset,
  filterConfig,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Search...',
  className = '',
  // Sort props
  showSort = false,
  sortBy = '',
  sortOrder = 'asc',
  onSortChange,
  sortOptions = []
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = Object.values(filters).some(val => val !== '' && val !== null && val !== undefined) || searchValue;

  const handleReset = () => {
    onReset();
    setIsExpanded(false);
  };

  const activeFilterCount = Object.values(filters).filter(val => val !== '' && val !== null && val !== undefined).length;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`} style={{ overflow: 'visible' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 rounded-t-xl">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-gray-700 hover:text-primary transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FaFilter className="text-primary" />
          </div>
          <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="font-semibold text-gray-900">{t('common.filters')}</p>
            {activeFilterCount > 0 && (
              <p className="text-xs text-primary">
                {activeFilterCount} {t('common.active')}
              </p>
            )}
          </div>
          <div className="ml-2">
            {isExpanded ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
          </div>
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary rounded-lg transition-colors"
          >
            <FaTimes />
            <span>{t('common.clearFilters')}</span>
          </button>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 animate-fadeIn overflow-visible">
          {/* Search Bar */}
          {showSearch && (
            <form onSubmit={onSearchSubmit} className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchValue}
                  onChange={onSearchChange}
                  placeholder={searchPlaceholder}
                  className={`w-full px-4 py-3 ${isRTL ? 'pr-12' : 'pl-12'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                />
                <FaSearch className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} />
              </div>
            </form>
          )}

          {/* Filter Dropdowns */}
          <div className={`grid grid-cols-1 ${filterConfig.length === 2 ? 'md:grid-cols-2' : filterConfig.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4 overflow-visible`}>
            {filterConfig.map((config) => (
              <div key={config.name} className="overflow-visible">
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {config.label}
                </label>
                <CustomSelect
                  name={config.name}
                  value={filters[config.name] || ''}
                  onChange={onFilterChange}
                  placeholder={config.allLabel || t('common.all')}
                  options={config.options}
                />
              </div>
            ))}
          </div>

          {/* Sort By */}
          {showSort && sortOptions.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <label className={`flex items-center gap-2 text-sm font-medium text-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FaSort />
                  {t('common.sortBy')}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange && onSortChange({ sortBy: e.target.value, sortOrder })}
                  className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-xs ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onSortChange && onSortChange({ sortBy, sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-primary transition-colors"
                  title={sortOrder === 'asc' ? t('common.sortBy') + ' ↑' : t('common.sortBy') + ' ↓'}
                >
                  {sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
                </button>
              </div>
            </div>
          )}

          {/* Active Filters Tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {filterConfig.map((config) => {
                const value = filters[config.name];
                if (!value) return null;

                const option = config.options.find(opt => opt.value === value);
                if (!option) return null;

                return (
                  <button
                    key={config.name}
                    onClick={() => onFilterChange({ target: { name: config.name, value: '' } })}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    <span>{config.label}: {option.label}</span>
                    <FaTimes className="text-xs" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;

