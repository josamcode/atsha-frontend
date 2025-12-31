import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  icon: Icon,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-primary-dark text-white hover:from-primary-dark hover:to-primary',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-gradient-to-r from-primary to-primary text-white hover:from-primary hover:to-primary-darko',
    success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
    >
      {Icon && <Icon />}
      {children}
    </button>
  );
};

export default Button;

