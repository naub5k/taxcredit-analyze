import React from 'react';

// 🔘 Button UI 컴포넌트 (shadcn/ui 스타일)
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'default',
  size = 'default',
  className = '',
  type = 'button'
}) => {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: '#374151',
          border: '1px solid #d1d5db',
          '&:hover': {
            backgroundColor: '#f9fafb'
          }
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '#374151',
          border: 'none',
          '&:hover': {
            backgroundColor: '#f3f4f6'
          }
        };
      default:
        return {
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          '&:hover': {
            backgroundColor: '#2563eb'
          }
        };
    }
  };

  const getSizeStyles = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          padding: '6px 12px',
          fontSize: '12px'
        };
      case 'lg':
        return {
          padding: '12px 24px',
          fontSize: '16px'
        };
      default:
        return {
          padding: '8px 16px',
          fontSize: '14px'
        };
    }
  };

  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md font-medium transition-colors duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      style={{
        borderRadius: '6px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...variantStyles,
        ...sizeStyles,
        ...(disabled && { 
          backgroundColor: '#9ca3af',
          color: '#ffffff',
          border: 'none'
        })
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          if (variant === 'outline') {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          } else if (variant === 'ghost') {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          } else {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = variantStyles.backgroundColor;
        }
      }}
    >
      {children}
    </button>
  );
}; 