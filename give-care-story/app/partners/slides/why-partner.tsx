"use client";

import { SlideLayout, CenteredContent, SlideTitle, SlideBody } from "../../components/slides";

export default function WhyPartner() {
  const benefits = [
    {
      icon: "📈",
      title: "Proven Outcomes",
      description: "Evidence-based interventions with measurable ROI and caregiver satisfaction metrics"
    },
    {
      icon: "🔧",
      title: "Easy Integration",
      description: "SMS-first approach requires no app downloads or complex onboarding for your members"
    },
    {
      icon: "📊",
      title: "Rich Analytics",
      description: "Detailed insights into caregiver stress patterns, intervention effectiveness, and cost savings"
    },
    {
      icon: "⚡",
      title: "Rapid Deployment",
      description: "From pilot to full rollout in 90 days with white-label options and custom branding"
    },
    {
      icon: "🎯",
      title: "Risk Reduction",
      description: "Proactive identification of high-risk caregivers before crisis points and expensive interventions"
    },
    {
      icon: "🤝",
      title: "Shared Success",
      description: "Outcome-based pricing models align our success with your member satisfaction and cost savings"
    }
  ];

  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <SlideTitle className="mb-xl">
          Why Partner with GiveCare?
        </SlideTitle>
        <SlideBody className="text-center mb-2xl">
          Strategic advantages for forward-thinking organizations
        </SlideBody>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-amber-200 flex flex-col h-full">
              <div className="text-center mb-6">
                <div className="text-xl mb-4">{benefit.icon}</div>
                <h3 className="font-heading text-lg mb-4 text-amber-900">
                  {benefit.title}
                </h3>
              </div>
              <SlideBody className="text-sm flex-grow text-center text-amber-900">
                {benefit.description}
              </SlideBody>
            </div>
          ))}
        </div>

        <div className="mt-2xl text-center">
          <SlideBody className="text-lg text-amber-900">
            <strong>Ready to transform caregiver support in your organization?</strong>
          </SlideBody>
        </div>
      </CenteredContent>
    </SlideLayout>
  );
}