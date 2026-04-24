import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const variants = {
    primary: 'bg-blue text-white hover:opacity-90',
    secondary: 'bg-glass text-primary border-glass hover:bg-secondary',
    ghost: 'bg-transparent text-secondary hover:text-primary hover:bg-secondary',
    danger: 'bg-red text-white hover:opacity-90',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  // Mapping custom variant names to theme variables
  const variantStyles = {
    primary: { backgroundColor: 'var(--accent-blue)', color: 'white' },
    secondary: { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' },
    ghost: { backgroundColor: 'transparent', color: 'var(--text-secondary)' },
    danger: { backgroundColor: 'var(--accent-red)', color: 'white' },
  }[variant];

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${className}`}
      style={variantStyles}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
