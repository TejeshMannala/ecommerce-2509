import React from 'react';

const Input = ({ 
  label, 
  error, 
  className = '',
  labelClassName = '',
  inputClassName = '',
  icon,
  endAdornment,
  ...props 
}) => {
  const baseInputClasses =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 max-[350px]:px-2.5 max-[350px]:py-2 max-[350px]:text-xs';
  
  const inputClasses = [
    baseInputClasses,
    icon ? 'pl-10' : '',
    endAdornment ? 'pr-11' : '',
    error ? 'border-red-500 focus:ring-red-500' : '',
    inputClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium text-gray-700 max-[350px]:text-xs ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {icon}
          </span>
        )}
        <input
          className={inputClasses}
          {...props}
        />
        {endAdornment && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            {endAdornment}
          </span>
        )}
      </div>
      {error && (
        <p className="text-red-600 text-sm break-words max-[350px]:text-xs">{error}</p>
      )}
    </div>
  );
};

export default Input;
