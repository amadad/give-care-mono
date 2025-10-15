"use client";

import { SlideLayout, CenteredContent, SlideTitle, SlideSubtitle, SlideBody } from "../../components/slides";

export default function WhoWePartnerWith() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <SlideTitle className="mb-xl fade-in">
          Who We Partner With
        </SlideTitle>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col h-full border border-amber-200">
            <SlideSubtitle className="mb-md text-left text-amber-900">
              Health Plans & Payers
            </SlideSubtitle>
            <SlideBody className="mb-md text-left text-amber-900">
              Readmissions rise when family caregivers are overwhelmed.
            </SlideBody>
            <SlideBody className="text-left font-medium text-amber-900">
              GiveCare SMS coaching lowers avoidable utilization.
            </SlideBody>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col h-full border border-amber-200">
            <SlideSubtitle className="mb-md text-left text-amber-900">
              Employers & Benefit Providers
            </SlideSubtitle>
            <SlideBody className="mb-md text-left text-amber-900">
              Caregiver employees show higher absenteeism & churn.
            </SlideBody>
            <SlideBody className="text-left font-medium text-amber-900">
              Offer GiveCare as a no‑app benefit to boost retention.
            </SlideBody>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col h-full border border-amber-200">
            <SlideSubtitle className="mb-md text-left text-amber-900">
              Community-Based Organizations
            </SlideSubtitle>
            <SlideBody className="mb-md text-left text-amber-900">
              Limited capacity to support growing caregiver demand.
            </SlideBody>
            <SlideBody className="text-left font-medium text-amber-900">
              Scale reach with an AI-powered text support line.
            </SlideBody>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col h-full border border-amber-200">
            <SlideSubtitle className="mb-md text-left text-amber-900">
              Long-Term Care & Senior Living
            </SlideSubtitle>
            <SlideBody className="mb-md text-left text-amber-900">
              Family anxiety spikes between visits, driving after-hours calls.
            </SlideBody>
            <SlideBody className="text-left font-medium text-amber-900">
              24/7 proactive updates keep families confident & informed.
            </SlideBody>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col h-full border border-amber-200">
            <SlideSubtitle className="mb-md text-left text-amber-900">
              Advocacy & Patient Support
            </SlideSubtitle>
            <SlideBody className="mb-md text-left text-amber-900">
              Volunteer hot-lines and peer mentors can't meet 24/7 demand.
            </SlideBody>
            <SlideBody className="text-left font-medium text-amber-900">
              Scale support with AI SMS, free volunteers for critical needs, and gain insights for advocacy.
            </SlideBody>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col h-full border border-amber-200">
            <SlideSubtitle className="mb-md text-left text-amber-900">
              Hospitals & Health Systems
            </SlideSubtitle>
            <SlideBody className="mb-md text-left text-amber-900">
              Care transitions break when caregivers lack guidance.
            </SlideBody>
            <SlideBody className="text-left font-medium text-amber-900">
              GiveCare bridges the post-discharge gap, lifting HCAHPS & cutting readmits.
            </SlideBody>
          </div>
        </div>
      </CenteredContent>
    </SlideLayout>
  );
}