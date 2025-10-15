'use client';

import { useState } from 'react';
import { ScrollAnimationWrapper } from '../../hooks/useScrollAnimation';

const visionTabs = [
  {
    id: 'mission',
    label: 'Mission',
    content: 'To provide every caregiver with the AI-powered support they need to navigate their journey with confidence, clarity, and compassion.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    id: 'vision',
    label: 'Vision',
    content: 'A world where no caregiver faces their journey alone, where technology amplifies human compassion, and where every family has access to the support they deserve.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  },
  {
    id: 'impact',
    label: 'Impact',
    content: 'Transforming the caregiving experience through personalized AI companionship, reducing caregiver burnout, and creating a sustainable support ecosystem for millions of families.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  }
];

export default function AboutHero() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="relative w-full bg-gradient-to-b from-base-100 via-amber-50/30 to-base-100 pt-24 pb-16 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <ScrollAnimationWrapper variant="fadeInUp">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-serif text-amber-950 mb-6 leading-tight">
                Built by Caregivers,
                <span className="block text-amber-700">For Caregivers</span>
              </h1>
              <p className="text-xl text-accessible-body max-w-3xl mx-auto">
                GiveCare emerged from real caregiving experiences, transforming personal struggle into purposeful innovation.
              </p>
            </div>
          </ScrollAnimationWrapper>

          {/* Interactive Tabs */}
          <ScrollAnimationWrapper variant="fadeInUp" delay={200}>
            <div className="mb-8">
              <div role="tablist" className="flex flex-wrap gap-3 justify-center">
                {visionTabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    role="tab"
                    className={`px-6 py-3 rounded-full transition-all flex items-center gap-2 ${
                      activeTab === index
                        ? 'bg-amber-900 text-white shadow-lg scale-105'
                        : 'bg-base-100 border border-amber-200 hover:bg-amber-50 text-amber-800'
                    }`}
                    onClick={() => setActiveTab(index)}
                  >
                    <span className={`transition-all ${activeTab === index ? 'text-amber-200' : 'text-amber-600'}`}>
                      {tab.icon}
                    </span>
                    <span className="font-medium">{tab.label}</span>
                    {activeTab === index && (
                      <span className="ml-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200"></span>
                        </span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </ScrollAnimationWrapper>

          {/* Tab Content */}
          <ScrollAnimationWrapper variant="scaleIn" delay={300}>
            <div className="bg-base-100 rounded-2xl shadow-xl p-8 md:p-12 border border-amber-100">
              <div className="text-center">
                <div className="mb-6 inline-flex p-4 bg-amber-50 rounded-full text-amber-700">
                  {visionTabs[activeTab].icon}
                </div>
                <h2 className="text-2xl md:text-3xl font-serif text-amber-950 mb-4">
                  {visionTabs[activeTab].label}
                </h2>
                <p className="text-lg text-accessible-body leading-relaxed max-w-3xl mx-auto">
                  {visionTabs[activeTab].content}
                </p>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </div>
    </section>
  );
}