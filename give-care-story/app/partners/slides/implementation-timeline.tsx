"use client";

import { SlideLayout, CenteredContent, SlideTitle, SlideBody } from "../../components/slides";

export default function ImplementationTimeline() {
  const phases = [
    {
      phase: "Phase 1",
      timeline: "Weeks 1-2",
      title: "Discovery & Setup",
      tasks: [
        "Partnership agreement & SOW",
        "Technical integration planning",
        "Pilot cohort selection (50-100 caregivers)",
        "Custom branding & messaging setup"
      ]
    },
    {
      phase: "Phase 2", 
      timeline: "Weeks 3-6",
      title: "Pilot Launch",
      tasks: [
        "Caregiver onboarding via SMS",
        "Baseline assessments (REACH II, CSI)",
        "Daily engagement monitoring",
        "Weekly partner reporting dashboards"
      ]
    },
    {
      phase: "Phase 3",
      timeline: "Weeks 7-12",
      title: "Scale & Optimize",
      tasks: [
        "Expand to full member population",
        "Advanced assessment deployment",
        "Outcome measurement & reporting",
        "Continuous improvement based on data"
      ]
    }
  ];

  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <SlideTitle className="mb-xl">
          90-Day Implementation Timeline
        </SlideTitle>
        <SlideBody className="text-center mb-2xl">
          From pilot to full deployment in three months
        </SlideBody>

        <div className="space-y-6">
          {phases.map((phase, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-amber-200">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/4">
                  <div className="bg-blue-100 px-4 py-2 rounded-lg inline-block mb-3">
                    <h3 className="font-heading text-lg text-amber-900">
                      {phase.phase}
                    </h3>
                  </div>
                  <SlideBody className="text-sm font-medium mb-3 text-amber-900">
                    {phase.timeline}
                  </SlideBody>
                  <h4 className="font-heading text-lg text-amber-900">
                    {phase.title}
                  </h4>
                </div>
                
                <div className="md:w-3/4">
                  <div className="grid grid-cols-1 gap-4">
                    {phase.tasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                        <SlideBody className="text-sm text-amber-900">
                          {task}
                        </SlideBody>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2xl bg-green-50 rounded-xl p-6 border border-green-200 text-center">
          <SlideBody className="font-medium text-amber-900">
            <strong>Success Guarantee:</strong> If pilot doesn't show measurable caregiver engagement within 60 days, full refund available
          </SlideBody>
        </div>
      </CenteredContent>
    </SlideLayout>
  );
}