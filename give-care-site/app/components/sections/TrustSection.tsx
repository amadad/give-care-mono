'use client';

import { ScrollAnimationWrapper } from '../../hooks/useScrollAnimation';

const trustPoints = [
  {
    title: "No fake empathy",
    description: "Honest responses without emotional performance",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "No personality games",
    description: "A tool that helps, not an AI trying to be your friend",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    title: "No app downloads",
    description: "Works through SMS on any phone, anywhere",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: "Just straightforward help",
    description: "Practical guidance when you need it most",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
];

export default function TrustSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-base-100 to-amber-50/20">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper variant="fadeInUp">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif text-amber-950 mb-4">
              Built different
            </h2>
            <p className="text-lg text-accessible-body max-w-2xl mx-auto">
              What you won't find with GiveCare
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {trustPoints.map((point, index) => (
            <ScrollAnimationWrapper
              key={index}
              variant="scaleIn"
              delay={index * 150}
            >
              <div className="text-center p-6 rounded-lg border border-amber-100 bg-white hover:shadow-md transition-shadow duration-300">
                <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-600 mb-4">
                  {point.icon}
                </div>
                <h3 className="text-lg font-semibold text-amber-950 mb-2">
                  {point.title}
                </h3>
                <p className="text-sm text-accessible-muted">
                  {point.description}
                </p>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>

        <ScrollAnimationWrapper variant="fadeInUp">
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-6 py-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Simple. Honest. Helpful.</span>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}