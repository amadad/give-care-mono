import { ReactNode } from 'react';

interface ContentLayoutProps {
  children: ReactNode;
  className?: string;
  centered?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl';
  padding?: 'sm' | 'md' | 'lg';
}

export function CenteredContent({ 
  children, 
  className = '', 
  maxWidth = '4xl',
  padding = 'md'
}: ContentLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl'
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12'
  };

  return (
    <div className={`flex h-full w-full items-center justify-center ${paddingClasses[padding]}`}>
      <div className={`${maxWidthClasses[maxWidth]} w-full text-center ${className}`}>
        {children}
      </div>
    </div>
  );
}

export function VideoOverlay({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center p-4 text-center ${className}`} style={{ backgroundColor: 'rgba(84, 52, 14, 0.7)' }}>
      {children}
    </div>
  );
}

export function TwoColumnLayout({ 
  left, 
  right, 
  className = '',
  leftWidth = '1/2',
  gap = '8'
}: { 
  left: ReactNode; 
  right: ReactNode; 
  className?: string;
  leftWidth?: '1/3' | '1/2' | '2/3';
  gap?: '4' | '6' | '8' | '12';
}) {
  const leftWidthClasses = {
    '1/3': 'lg:w-1/3',
    '1/2': 'lg:w-1/2', 
    '2/3': 'lg:w-2/3'
  };

  const rightWidthClasses = {
    '1/3': 'lg:w-2/3',
    '1/2': 'lg:w-1/2',
    '2/3': 'lg:w-1/3'
  };

  return (
    <div className={`flex flex-col lg:flex-row items-center gap-${gap} h-full p-8 ${className}`}>
      <div className={leftWidthClasses[leftWidth]}>
        {left}
      </div>
      <div className={rightWidthClasses[leftWidth]}>
        {right}
      </div>
    </div>
  );
}