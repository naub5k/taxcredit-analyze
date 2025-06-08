import React from 'react';

// 🏷️ Badge UI 컴포넌트 (shadcn/ui 스타일)
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: '#dcfce7',
          color: '#166534',
          border: '1px solid #bbf7d0'
        };
      case 'warning':
        return {
          backgroundColor: '#fef3c7',
          color: '#92400e',
          border: '1px solid #fde68a'
        };
      case 'error':
        return {
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca'
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          color: '#374151',
          border: '1px solid #e5e7eb'
        };
    }
  };

  const variantStyles = getVariantStyles(variant);

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '500',
        lineHeight: '1.25',
        ...variantStyles
      }}
    >
      {children}
    </span>
  );
}; 