import React from 'react';

// 🚨 Alert UI 컴포넌트 (shadcn/ui 스타일)
interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'destructive':
        return {
          backgroundColor: '#fee2e2',
          borderColor: '#fecaca',
          color: '#dc2626'
        };
      case 'warning':
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#fde68a',
          color: '#92400e'
        };
      case 'success':
        return {
          backgroundColor: '#dcfce7',
          borderColor: '#bbf7d0',
          color: '#166534'
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          borderColor: '#e5e7eb',
          color: '#374151'
        };
    }
  };

  const variantStyles = getVariantStyles(variant);

  return (
    <div 
      className={`relative w-full rounded-lg border p-4 ${className}`}
      role="alert"
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '8px',
        border: `1px solid ${variantStyles.borderColor}`,
        padding: '16px',
        ...variantStyles
      }}
    >
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div 
      className={`text-sm [&_p]:leading-relaxed ${className}`}
      style={{
        fontSize: '14px',
        lineHeight: '1.5'
      }}
    >
      {children}
    </div>
  );
}; 