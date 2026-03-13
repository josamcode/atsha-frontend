import React from 'react';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  className = '',
  icon: Icon
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-primary ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="auth-input-icon">
            <Icon />
          </span>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            Icon ? 'auth-input-with-icon' : 'px-3 py-2.5'
          } ${error ? 'border-primary' : 'border-gray-300'} ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-primary">{error}</p>}
    </div>
  );
};

export default Input;
