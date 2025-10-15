'use client';

import { useState } from 'react';
import { ScrollAnimationWrapper } from '../../hooks/useScrollAnimation';

interface Value {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
  color: string;
}

const VALUES: Value[] = [
  {
    id: 'compassion',
    title: 'Compassion First',
    description: 'We approach every challenge with empathy and understanding, recognizing the human story behind every need.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    examples: [
      'Every conversation starts with understanding, not solutions',
      'We remember personal details that matter to caregivers',
      'Our AI responds with warmth and validation'
    ],
    color: 'rose'
  },
  {
    id: 'innovation',
    title: 'Innovation with Purpose',
    description: 'We leverage cutting-edge technology to create solutions that make a real difference in caregivers\' lives.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    examples: [
      'AI that learns and adapts to each caregiver\'s journey',
      'SMS-first design for accessibility anywhere',
      'Continuous improvement based on real feedback'
    ],
    color: 'amber'
  },
  {
    id: 'trust',
    title: 'Trust & Privacy',
    description: 'We build our relationships on honesty, transparency, and unwavering commitment to privacy.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    examples: [
      'End-to-end encryption for all conversations',
      'Clear data policies with caregiver control',
      'Regular security audits and compliance checks'
    ],
    color: 'blue'
  },
  {
    id: 'accessibility',
    title: 'Accessibility for All',
    description: 'We ensure every caregiver can access support, regardless of technical expertise or resources.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    examples: [
      'Simple SMS interface - no app downloads required',
      'Support in multiple languages',
      'Affordable pricing with assistance programs'
    ],
    color: 'green'
  }
];

export default function CompanyValues() {
  const [expandedValue, setExpandedValue] = useState<string | null>(null);

  return (
    <section className="py-16 bg-base-100">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper variant="fadeInUp">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-amber-950 mb-4">Our Core Values</h2>
            <p className="text-lg text-accessible-body max-w-2xl mx-auto">
              The principles that guide every decision, feature, and interaction at GiveCare
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {VALUES.map((value, index) => (
            <ScrollAnimationWrapper
              key={value.id}
              variant="fadeInUp"
              delay={index * 100}
            >
              <div
                className={`group relative bg-gradient-to-br from-white to-${value.color}-50/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-${value.color}-100 hover:border-${value.color}-300 cursor-pointer`}
                onClick={() => setExpandedValue(expandedValue === value.id ? null : value.id)}
              >
                {/* Icon and Title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-full bg-${value.color}-100 text-${value.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                    {value.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-serif text-amber-950 mb-2">{value.title}</h3>
                    <p className="text-accessible-muted">{value.description}</p>
                  </div>
                </div>

                {/* Examples - Expandable */}
                <div className={`overflow-hidden transition-all duration-300 ${
                  expandedValue === value.id ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="pt-4 border-t border-amber-200">
                    <p className="text-sm font-medium text-amber-800 mb-2">In Practice:</p>
                    <ul className="space-y-2">
                      {value.examples.map((example, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-accessible-muted">
                          <span className={`text-${value.color}-500 mt-0.5`}>•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Expand/Collapse indicator */}
                <div className="absolute bottom-4 right-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-${value.color}-400 transition-transform duration-300 ${
                      expandedValue === value.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Decorative element */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-${value.color}-200/20 to-transparent rounded-bl-full`} />
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}