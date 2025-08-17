import React from 'react';
import { Loader2 } from 'lucide-react';

interface GardenButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const GardenButton: React.FC<GardenButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };
  
  const variantClasses = {
    primary: `
      bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:shadow-md
      focus:ring-teal-500 focus:ring-opacity-50
    `,
    secondary: `
      bg-teal-100 text-teal-800 border border-teal-200 shadow-sm hover:bg-teal-200 hover:shadow-md
      focus:ring-teal-500 focus:ring-opacity-50
    `,
    outline: `
      border-2 border-teal-500 bg-transparent text-teal-600
      hover:bg-teal-50 hover:text-teal-700
      focus:ring-teal-500 focus:ring-opacity-50
    `,
    ghost: `
      bg-transparent text-teal-600
      hover:bg-teal-50 hover:text-teal-700
      focus:ring-teal-500 focus:ring-opacity-50
    `,
    danger: `
      bg-red-500 text-white
      hover:bg-red-600
      focus:ring-red-500 focus:ring-opacity-50
      shadow-sm hover:shadow-md
    `
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${widthClass}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {children}
    </button>
  );
};

export default GardenButton;
