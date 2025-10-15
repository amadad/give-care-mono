'use client';

import { ScrollAnimationWrapper } from '../../hooks/useScrollAnimation';

const benefits = [
  {
    title: "Responds like a tool, not a therapist",
    description: "Clear answers to your questions. No emotional theatrics or fake empathy.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    title: "Remembers context, skips the small talk",
    description: "Builds on your previous conversations without making you repeat yourself.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
  {
    title: "Evidence-based guidance, plain language",
    description: "Practical advice based on research, without the medical jargon.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    title: "Always available, never overwhelming",
    description: "24/7 access through simple SMS. No apps to download or accounts to create.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }
];

export default function BenefitsSection() {
  return (
    <section className="py-16 bg-base-100">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper variant="fadeInUp">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif text-amber-950 mb-4">
              Support without the performance
            </h2>
            <p className="text-lg text-accessible-body max-w-2xl mx-auto">
              AI that helps instead of trying to impress
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <ScrollAnimationWrapper
              key={index}
              variant="scaleIn"
              delay={index * 150}
            >
              <div className="group flex gap-4 p-6 rounded-lg border border-amber-100 hover:border-amber-300 bg-white hover:bg-amber-50/30 transition-all duration-300">
                <div className="flex-shrink-0">
                  <div className="inline-flex p-3 rounded-full bg-amber-100 text-amber-600 group-hover:bg-amber-200 group-hover:scale-110 transition-all duration-300">
                    {benefit.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-950 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-accessible-muted">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}