import React from 'react';

// 🚨 Alert UI 컴포넌트 (shadcn/ui 스타일)
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  className = '', 
  variant = 'default', 
  ...props 
}) => {
  const variantClasses = {
    default: 'border-gray-200 bg-white text-gray-900',
    destructive: 'border-red-200 bg-red-50 text-red-900'
  };

  return (
    <div 
      className={`relative w-full rounded-lg border p-4 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div 
      className={`text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
