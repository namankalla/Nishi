import React from 'react';
import { useThemeStore } from '../../store/useThemeStore';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'search';
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  fullWidth = false, 
  variant = 'default',
  className = '', 
  ...props 
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  
  const baseClasses = `
    px-4 py-3 rounded-lg border transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-opacity-50
    placeholder-slate-400
  `;
  
  const getVariantStyles = () => {
    const focusColor = variant === 'search' ? colors.secondary : colors.primary;
    
    return {
      borderColor: error ? '#ef4444' : '#e2e8f0',
      backgroundColor: variant === 'search' ? '#f8fafc' : 'white',
      '--tw-ring-color': error ? '#ef4444' : focusColor
    };
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const hoverClass = 'hover:border-slate-300';
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      
      <input
        className={`
          ${baseClasses}
          ${widthClass}
          ${hoverClass}
          ${className}
        `}
        style={getVariantStyles()}
        {...props}
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;