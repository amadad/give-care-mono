import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  className?: string;
}

export default function Badge({
  children,
  variant = 'primary',
  className = ''
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-amber-100 text-amber-800 border-amber-200',
    secondary: 'bg-slate-100 text-slate-800 border-slate-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
