'use client';

import { useState, useEffect } from 'react';
import { ScrollAnimationWrapper, useScrollAnimation } from '../../hooks/useScrollAnimation';

interface Stat {
  value: string;
  numericValue: number;
  suffix: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'amber' | 'orange';
}

// Static color mappings for Tailwind
const colorClasses = {
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-600',
    corner: 'bg-amber-200/30'
  },
  orange: {
    bg: 'bg-orange-100', 
    text: 'text-orange-600',
    corner: 'bg-orange-200/30'
  }
};

const stats: Stat[] = [
  {
    value: '10',
    numericValue: 10000,
    suffix: 'K+',
    title: 'Caregivers Supported',
    description: 'Families finding strength through AI-powered companionship',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'amber'
  },
  {
    value: '2.5',
    numericValue: 2.5,
    suffix: 'M+',
    title: 'Messages Exchanged',
    description: 'Moments of support, guidance, and understanding',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'orange'
  },
  {
    value: '24',
    numericValue: 24,
    suffix: '/7',
    title: 'Always Available',
    description: 'Round-the-clock support when caregivers need it most',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'amber'
  },
  {
    value: '4.8',
    numericValue: 4.8,
    suffix: '/5',
    title: 'Caregiver Rating',
    description: 'Trusted by families navigating care journeys',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    color: 'orange'
  }
];

function AnimatedNumber({ target, suffix, duration = 2000 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollAnimation({ triggerOnce: true });

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(target * easeOutExpo));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, target, duration]);

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      <span className="text-5xl font-bold font-serif">
        {count.toLocaleString()}{suffix}
      </span>
    </div>
  );
}

export default function ImpactStats() {
  return (
    <section className="py-16 bg-gradient-to-b from-amber-50/30 to-base-100 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <ScrollAnimationWrapper variant="fadeInUp">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif text-amber-950 mb-4">Our Growing Impact</h2>
            <p className="text-lg text-accessible-body max-w-2xl mx-auto">
              Every number represents a caregiver who found support when they needed it most
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <ScrollAnimationWrapper
              key={index}
              variant="scaleIn"
              delay={index * 100}
            >
              <div className="group card card-body shadow-lg hover:shadow-2xl transition-all duration-300 border border-amber-100 hover:border-amber-300 relative overflow-hidden">
                {/* Hover background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-full ${colorClasses[stat.color].bg} ${colorClasses[stat.color].text} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                  
                  {/* Animated number */}
                  <div className={`${colorClasses[stat.color].text} mb-2`}>
                    <AnimatedNumber target={stat.numericValue} suffix={stat.suffix} />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-amber-950 mb-2">{stat.title}</h3>
                  
                  {/* Description */}
                  <p className="text-sm text-accessible-muted">{stat.description}</p>
                </div>

                {/* Decorative corner element */}
                <div className={`absolute -bottom-2 -right-2 w-16 h-16 ${colorClasses[stat.color].corner} rounded-tl-full`} />
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>

        {/* Bottom CTA */}
        <ScrollAnimationWrapper variant="fadeInUp" delay={400}>
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-900 text-white px-6 py-3 rounded-full shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="font-medium">Growing every day with more families</span>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}