"use client";

import { SlideLayout, CenteredContent, SlideTitle, SlideBody } from "../../components/slides";

export default function PartnershipROI() {
  const benefits = [
    {
      title: "Evidence-Based Framework",
      description: "Built on validated clinical tools: REACH II, PROMIS CAT, CSI-13",
      icon: "📊"
    },
    {
      title: "SMS-First Approach", 
      description: "No app downloads required - works on any phone via text messaging",
      icon: "💬"
    },
    {
      title: "Learning AI Agents",
      description: "Domain expertise grows and accrues over time through caregiver interactions",
      icon: "🧠"
    },
    {
      title: "Scalable Support",
      description: "AI-powered system handles thousands of caregivers simultaneously",
      icon: "🔄"
    }
  ];

  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <SlideTitle className="mb-xl">
          Partnership Value
        </SlideTitle>
        <SlideBody className="text-center mb-2xl">
          Core advantages of the GiveCare platform
        </SlideBody>

        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((item, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-amber-200">
              <div className="flex items-start gap-4">
                <div className="text-2xl">{item.icon}</div>
                <div>
                  <h3 className="font-heading text-lg mb-3 text-amber-900">
                    {item.title}
                  </h3>
                  <SlideBody className="text-sm text-amber-900">
                    {item.description}
                  </SlideBody>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2xl bg-blue-50 rounded-xl p-6 border border-blue-200">
          <SlideBody className="text-center text-amber-900">
            <strong>Beta Results:</strong> Positive caregiver feedback • High engagement rates • Demonstrated value for "venting" and emotional support
          </SlideBody>
        </div>
      </CenteredContent>
    </SlideLayout>
  );
}