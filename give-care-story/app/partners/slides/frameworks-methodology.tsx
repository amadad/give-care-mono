"use client";

import { SlideLayout, CenteredContent, SlideTitle, SlideBody } from "../../components/slides";

export default function FrameworksMethodology() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <SlideTitle className="mb-xl">
          Evidence-Based Assessment Framework
        </SlideTitle>
        <SlideBody className="text-center mb-xl">
          Tiered methodology for caregiver risk assessment via SMS
        </SlideBody>
        
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-2xl">
          <SlideBody className="text-center text-amber-900">
            <strong>Key Benefit:</strong> Validated clinical tools seamlessly integrated into conversational SMS, enabling continuous risk monitoring without survey fatigue
          </SlideBody>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Assessment Tier */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-amber-200">
            <div className="text-center mb-6">
              <div className="bg-green-100 px-4 py-2 rounded-lg inline-block mb-4">
                <h3 className="font-heading text-lg text-amber-900">Assessment</h3>
              </div>
              <SlideBody className="text-sm text-amber-900">Foundation Screening</SlideBody>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-heading text-sm mb-2 text-amber-900">REACH II RAM</h4>
                <SlideBody className="text-xs mb-2 text-amber-900">16 Y/N risk items</SlideBody>
                <SlideBody className="text-xs text-amber-900">4-item burst → 48h drip-feed</SlideBody>
              </div>
              
              <div>
                <h4 className="font-heading text-sm mb-2 text-amber-900">Caregiver Strain Index</h4>
                <SlideBody className="text-xs mb-2 text-amber-900">Weekly pulse check</SlideBody>
                <SlideBody className="text-xs text-amber-900">Single SMS every Friday</SlideBody>
              </div>
            </div>
          </div>

          {/* Monitoring Tier */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-amber-200">
            <div className="text-center mb-6">
              <div className="bg-blue-100 px-4 py-2 rounded-lg inline-block mb-4">
                <h3 className="font-heading text-lg text-amber-900">Monitoring</h3>
              </div>
              <SlideBody className="text-sm text-amber-900">Adaptive Tracking</SlideBody>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-heading text-sm mb-2 text-amber-900">PROMIS® CAT</h4>
                <SlideBody className="text-xs mb-2 text-amber-900">Adaptive distress assessment</SlideBody>
                <SlideBody className="text-xs text-amber-900">1-2 items per conversation</SlideBody>
              </div>
              
              <div>
                <h4 className="font-heading text-sm mb-2 text-amber-900">PRAPARE SDOH</h4>
                <SlideBody className="text-xs mb-2 text-amber-900">Social determinants screen</SlideBody>
                <SlideBody className="text-xs text-amber-900">Progressive chat week 2+</SlideBody>
              </div>
            </div>
          </div>

          {/* Intelligence Tier */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-amber-200">
            <div className="text-center mb-6">
              <div className="bg-purple-100 px-4 py-2 rounded-lg inline-block mb-4">
                <h3 className="font-heading text-lg text-amber-900">Intelligence</h3>
              </div>
              <SlideBody className="text-sm text-amber-900">Predictive Analytics</SlideBody>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-heading text-sm mb-2 text-amber-900">NYU Intervention</h4>
                <SlideBody className="text-xs mb-2 text-amber-900">Family dynamics baseline</SlideBody>
                <SlideBody className="text-xs text-amber-900">Pre-call SMS module</SlideBody>
              </div>
              
              <div>
                <h4 className="font-heading text-sm mb-2 text-amber-900">EMA + Sensors</h4>
                <SlideBody className="text-xs mb-2 text-amber-900">Real-time burnout prediction</SlideBody>
                <SlideBody className="text-xs text-amber-900">Daily diary + passive data</SlideBody>
              </div>
            </div>
          </div>
        </div>

      </CenteredContent>
    </SlideLayout>
  );
}