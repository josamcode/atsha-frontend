import React from 'react';

/**
 * IconText Component - A reusable component for consistent icon-text spacing in RTL/LTR layouts
 * 
 * Usage:
 * <IconText icon={<FaUser />}>User Name</IconText>
 * <IconText icon={<FaUser />} reverse>User Name</IconText> // Icon after text
 * <IconText icon={<FaUser />} gap="sm">User Name</IconText> // Smaller gap
 */
const IconText = ({
  icon,
  children,
  reverse = false,
  gap = 'md',
  className = '',
  vertical = false,
  ...props
}) => {
  const gapClasses = {
    xs: 'gap-1.5',    // 6px
    sm: 'gap-2',      // 8px
    md: 'gap-3',      // 12px
    lg: 'gap-4'       // 16px
  };

  const gapClass = gapClasses[gap] || gapClasses.md;
  const direction = reverse ? 'flex-row-reverse' : 'flex-row';
  const verticalClass = vertical ? 'flex-col' : direction;

  return (
    <span
      className={`inline-flex items-center ${verticalClass} ${gapClass} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children && <span className="flex-1">{children}</span>}
    </span>
  );
};

export default IconText;

