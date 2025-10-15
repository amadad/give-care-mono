import { ReactNode } from 'react';
import { ScrollAnimationWrapper } from '../../hooks/useScrollAnimation';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  children?: ReactNode;
  className?: string;
  animated?: boolean;
}

export default function SectionHeader({
  title,
  subtitle,
  centered = true,
  children,
  className = '',
  animated = true
}: SectionHeaderProps) {
  const content = (
    <div className={`mb-12 ${centered ? 'text-center' : ''} ${className}`}>
      <h2 className="text-3xl font-serif text-amber-950 mb-4">{title}</h2>
      {centered && <div className="h-px w-24 bg-amber-500 mx-auto mb-6"></div>}
      {subtitle && (
        <p className="text-lg text-accessible-muted max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );

  if (animated) {
    return (
      <ScrollAnimationWrapper variant="fadeInUp">
        {content}
      </ScrollAnimationWrapper>
    );
  }

  return content;
}

// Variant for pages that need different styling
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  animated?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  className = '',
  animated = true
}: PageHeaderProps) {
  const content = (
    <div className={`text-center mb-8 ${className}`}>
      <h1 className="text-4xl md:text-5xl font-serif text-amber-950 leading-tight tracking-tight mb-6">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg md:text-xl text-accessible-muted max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );

  if (animated) {
    return (
      <ScrollAnimationWrapper variant="fadeInUp">
        {content}
      </ScrollAnimationWrapper>
    );
  }

  return content;
}