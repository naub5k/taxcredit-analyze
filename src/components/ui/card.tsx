import React from 'react';

// 🎨 Card UI 컴포넌트 (shadcn/ui 스타일)
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        ...(!className.includes('bg-') && { backgroundColor: 'white' })
      }}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`px-6 py-4 ${className}`}
      style={{
        padding: '16px 24px',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 
      className={`text-lg font-semibold text-gray-900 ${className}`}
      style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#111827',
        margin: 0
      }}
    >
      {children}
    </h3>
  );
};

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`px-6 pb-6 ${className}`}
      style={{
        padding: '0 24px 24px 24px'
      }}
    >
      {children}
    </div>
  );
}; 