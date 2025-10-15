'use client';

import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    triggerOnce = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

// Animation variants for common patterns
export const animationVariants = {
  fadeInUp: {
    initial: 'opacity-0 translate-y-8',
    animate: 'opacity-100 translate-y-0',
    transition: 'transition-all duration-700 ease-out'
  },
  fadeInLeft: {
    initial: 'opacity-0 -translate-x-8',
    animate: 'opacity-100 translate-x-0',
    transition: 'transition-all duration-700 ease-out'
  },
  fadeInRight: {
    initial: 'opacity-0 translate-x-8',
    animate: 'opacity-100 translate-x-0',
    transition: 'transition-all duration-700 ease-out'
  },
  slideInLeft: {
    initial: 'opacity-0 -translate-x-12',
    animate: 'opacity-100 translate-x-0',
    transition: 'transition-all duration-600 ease-out'
  },
  slideInRight: {
    initial: 'opacity-0 translate-x-12',
    animate: 'opacity-100 translate-x-0',
    transition: 'transition-all duration-600 ease-out'
  },
  scaleIn: {
    initial: 'opacity-0 scale-95',
    animate: 'opacity-100 scale-100',
    transition: 'transition-all duration-500 ease-out'
  },
  staggerChildren: {
    initial: 'opacity-0 translate-y-4',
    animate: 'opacity-100 translate-y-0',
    transition: 'transition-all duration-500 ease-out'
  }
};

// Component wrapper for scroll animations
import React from 'react';

interface ScrollAnimationWrapperProps {
  children: React.ReactNode;
  variant?: keyof typeof animationVariants;
  delay?: number;
  className?: string;
}

export function ScrollAnimationWrapper({
  children,
  variant = 'fadeInUp',
  delay = 0,
  className = ''
}: ScrollAnimationWrapperProps) {
  const { ref, isVisible } = useScrollAnimation();
  const animation = animationVariants[variant];

  const delayStyle = delay > 0 ? { transitionDelay: `${delay}ms` } : {};

  return React.createElement(
    'div',
    {
      ref: ref as React.RefObject<HTMLDivElement>,
      className: `${animation.initial} ${isVisible ? animation.animate : ''} ${animation.transition} ${className}`,
      style: delayStyle
    },
    children
  );
}