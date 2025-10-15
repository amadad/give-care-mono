'use client';

const features = [
  {
    title: "See your exact burnout score",
    description: "Multiple validated assessments combine to show you a number (0-100). Finally, proof of what you're carrying.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )
  },
  {
    title: "Track changes over time",
    description: "Monitor your score week by week. Sparklines and milestones help you understand your progress.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    )
  },
  {
    title: "Get help that fits your life",
    description: "Resources matched to what's weighing on you most—respite funding, support groups, breathing exercises. Not generic lists.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  },
];

export default function FeaturesBentoGrid() {
  return (
    <section className="section-standard bg-amber-950">
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
            <div key={index} className="text-center">
              {/* Icon */}
              <div className="mb-5 flex justify-center">
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
