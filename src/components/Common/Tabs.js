import React from 'react';

const resolveClassName = (value, context) => {
  if (typeof value === 'function') {
    return value(context);
  }

  return value || '';
};

const Tabs = ({
  tabs = [],
  activeTab,
  onTabChange,
  ariaLabel = 'Tabs',
  containerClassName = 'flex overflow-x-auto border-b border-gray-200 scrollbar-hide',
  navClassName = '-mb-px flex gap-3',
  buttonClassName = 'whitespace-nowrap border-b-2 px-2 py-4 text-sm font-medium transition-colors',
  activeButtonClassName = 'border-primary text-primary',
  inactiveButtonClassName = 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
  iconClassName = 'text-sm'
}) => (
  <div className={containerClassName}>
    <nav className={navClassName} aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={[
              Icon ? 'inline-flex items-center gap-2' : 'flex',
              resolveClassName(buttonClassName, { isActive, tab }),
              resolveClassName(
                isActive ? activeButtonClassName : inactiveButtonClassName,
                { isActive, tab }
              )
            ].filter(Boolean).join(' ')}
          >
            {Icon ? (
              <Icon className={resolveClassName(iconClassName, { isActive, tab })} />
            ) : null}
            {tab.label}
          </button>
        );
      })}
    </nav>
  </div>
);

export default Tabs;
