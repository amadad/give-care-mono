'use client';

import { ScrollAnimationWrapper } from '../../hooks/useScrollAnimation';
import { motion } from 'framer-motion';

const progressFeatures = [
  {
    title: "Early Warning for Burnout",
    metric: "24 hours",
    description: "Smart cooldowns prevent assessment fatigue while catching warning signs",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-2.27-.833-3.464 0L4.34 16.5c-.77.833.192 3 1.732 3z" />
      </svg>
    )
  },
  {
    title: "Your Wellness Journey",
    metric: "0-100 scale",
    description: "Track energy, mood, and coping levels over weeks and months",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    title: "Hospital-Grade Assessments",
    metric: "CWBS-14 & REACH II",
    description: "Evidence-based tools trusted by major research institutions",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    title: "Risk-Stratified Support",
    metric: "4 levels",
    description: "Crisis, high, moderate, low - tailored responses to your actual needs",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  }
];

const milestones = [
  { week: "Week 1", achievement: "First check-in completed", celebration: "You took the first step!" },
  { week: "Week 2", achievement: "Stress level decreased 15%", celebration: "Your coping strategies are working!" },
  { week: "Week 4", achievement: "Energy improved 2 points", celebration: "Small wins add up to big changes!" },
  { week: "Week 8", achievement: "Consistent self-care routine", celebration: "You're prioritizing yourself!" },
  { week: "Week 12", achievement: "Overall wellness up 25%", celebration: "Three months of growth!" }
];

export default function ProgressSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper variant="fadeInUp">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl md:text-4xl">
              See Your Progress, Celebrate Your Wins
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-amber-800">
              Finally, proof that you're doing better than you think
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Progress Features Grid */}
        <div className="mb-16 grid grid-cols-1 gap-6 max-w-6xl mx-auto md:grid-cols-2 lg:grid-cols-4">
          {progressFeatures.map((feature, index) => (
            <ScrollAnimationWrapper
              key={index}
              variant="scaleIn"
              delay={index * 100}
            >
              <div className="rounded-xl border border-amber-200 bg-white/95 p-6 shadow-[0_12px_30px_rgba(130,79,34,0.08)] transition-transform duration-200 hover:-translate-y-1">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-amber-100 text-amber-700">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-medium text-amber-950">
                  {feature.title}
                </h3>
                <div className="mb-2 text-2xl font-semibold text-amber-800">
                  {feature.metric}
                </div>
                <p className="text-sm text-amber-800">
                  {feature.description}
                </p>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>

        {/* Milestone Timeline */}
        <ScrollAnimationWrapper variant="fadeInUp">
          <div className="mx-auto max-w-3xl">
            <h3 className="mb-8 text-center text-2xl">
              Your Journey Milestones
            </h3>
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : index * 0.05 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <span className="mt-[6px] h-2 w-2 rounded-full bg-primary" />
                    {index < milestones.length - 1 && <span className="mt-2 h-full w-px bg-amber-200" />}
                  </div>
                  <div className="flex-1 rounded-xl border border-amber-200 bg-white/95 p-4 shadow-[0_12px_30px_rgba(130,79,34,0.06)]">
                    <div className="text-xs font-medium uppercase tracking-[0.1em] text-amber-600">
                      {milestone.week}
                    </div>
                    <div className="mt-2 text-base font-medium text-amber-950">
                      {milestone.achievement}
                    </div>
                    <div className="mt-1 text-sm italic text-amber-800">
                      "{milestone.celebration}"
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
              >
                <p className="mb-4 text-amber-800">
                  Start tracking your caregiving journey today
                </p>
                <a
                  href="/about"
                  className="btn btn-primary btn-md px-6"
                >
                  Begin your progress story
                </a>
              </motion.div>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
