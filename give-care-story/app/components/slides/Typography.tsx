import { ReactNode } from 'react';

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function SlideTitle({ children, className = '' }: TypographyProps) {
  return (
    <h1 className={`font-heading text-3xl leading-tight mb-xl fade-in ${className}`}>
      {children}
    </h1>
  );
}

export function SlideSubtitle({ children, className = '' }: TypographyProps) {
  return (
    <h2 className={`font-heading text-xl leading-tight mb-lg fade-in ${className}`}>
      {children}
    </h2>
  );
}

export function SlideBody({ children, className = '' }: TypographyProps) {
  return (
    <p className={`font-body text-md leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function SlideQuote({ children, author, className = '' }: TypographyProps & { author?: string }) {
  return (
    <blockquote className={`font-body text-2xl leading-snug fade-in text-amber-900 ${className}`}>
      <p className="mb-lg">"{children}"</p>
      {author && (
        <footer className="font-heading text-md text-amber-800">
          — {author}
        </footer>
      )}
    </blockquote>
  );
}

export function VideoSlideTitle({ children, className = '' }: TypographyProps) {
  return (
    <h1 className={`font-heading text-4xl leading-snug mb-xl fade-in ${className}`}>
      {children}
    </h1>
  );
}

export function VideoSlideSubtitle({ children, className = '' }: TypographyProps) {
  return (
    <p className={`font-body text-xl mb-lg fade-in opacity-90 ${className}`}>
      {children}
    </p>
  );
}