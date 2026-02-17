import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const baseClasses =
    'inline-flex max-w-full items-center justify-center gap-1 text-center font-medium leading-tight whitespace-normal break-words rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm max-[350px]:px-2 max-[350px]:py-1 max-[350px]:text-xs',
    md: 'px-4 py-2 text-base max-[350px]:px-3 max-[350px]:py-1.5 max-[350px]:text-sm',
    lg: 'px-6 py-3 text-lg max-[350px]:px-3 max-[350px]:py-2 max-[350px]:text-sm'
  };
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg focus:ring-primary-500',
    secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500',
    success: 'bg-fresh-green hover:bg-green-600 text-white shadow-md hover:shadow-lg focus:ring-green-500',
    danger: 'bg-fresh-red hover:bg-red-600 text-white shadow-md hover:shadow-lg focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500'
  };

  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    fullWidth && 'w-full',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
