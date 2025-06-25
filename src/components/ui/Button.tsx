import React from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  
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
      text-white shadow-sm hover:shadow-md
      focus:ring-opacity-50
    `,
    secondary: `
      text-white shadow-sm hover:shadow-md
      focus:ring-opacity-50
    `,
    outline: `
      border-2 bg-transparent
      hover:text-white
      focus:ring-opacity-50
    `,
    ghost: `
      bg-transparent
      hover:bg-slate-100
      focus:ring-slate-200
    `,
    danger: `
      bg-red-500 text-white
      hover:bg-red-600
      focus:ring-red-500
      shadow-sm hover:shadow-md
    `
  };
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          color: colors.accent,
          '--tw-ring-color': colors.primary
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          color: 'white',
          '--tw-ring-color': colors.secondary
        };
      case 'outline':
        return {
          borderColor: colors.primary,
          color: colors.primary,
          '--tw-ring-color': colors.primary
        };
      case 'ghost':
        return {
          color: colors.primary
        };
      default:
        return {};
    }
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
      style={getVariantStyles()}
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

export default Button;