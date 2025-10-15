'use client';

const features = [
  {
    title: "See your exact burnout score",
    description: "4 validated assessments combine to show you a number (0-100). Finally, proof of what you're carrying.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    badge: null
  },
  {
    title: "Track changes over time",
    description: "Monitor your score week by week. Sparklines and milestones help you understand your progress.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    badge: null
  },
  {
    title: "Get help that fits your life",
    description: "Resources matched to what's weighing on you most—respite funding, support groups, breathing exercises. Not generic lists.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    badge: null
  },
  {
    title: "We remember what matters to you",
    description: "Care routines, preferences, crisis triggers—saved forever. 50% fewer repeated questions. Your story never starts over.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    badge: null
  },
  {
    title: "We notice when you're struggling",
    description: "Sudden silence? Crisis signals? Declining scores? We check in before crisis hits. 20-30% churn reduction.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    badge: null
  },
  {
    title: "Reminders when YOU want them",
    description: "Not everyone wants 9am check-ins. Set your schedule—daily, weekly, Tue/Thu at 7pm ET. Your timezone, your pace.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    badge: null
  },
];

export default function FeaturesBentoGrid() {
  return (
    <section className="section-standard bg-amber-950 pt-16 md:pt-20">
      <div className="container-editorial">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="heading-section-dark">
            Help that actually helps
          </h2>
          <p className="text-lg text-amber-100 mt-4 max-w-2xl mx-auto font-light">
            Not just resources—the right resources, matched to what's weighing on you most
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {features.map((feature, index) => (
            <div key={index} className="text-center relative">
              {/* NEW Badge */}
              {feature.badge && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="inline-block px-3 py-1 text-xs font-medium tracking-wide text-amber-950 bg-amber-400 rounded-full uppercase">
                    {feature.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="mb-5 flex justify-center mt-4">
                <div className="text-amber-100">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="text-base md:text-lg font-normal text-amber-50 mb-3 tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-sm text-amber-100 leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
