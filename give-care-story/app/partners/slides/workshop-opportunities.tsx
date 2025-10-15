import { SlideLayout, CenteredContent, SlideTitle, SlideBody, SlideQuote } from "../../components/slides";

export default function Slide17() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <SlideTitle className="mb-xl">
          Partnership Solutions
        </SlideTitle>
        
        <div className="mb-xl">
          <SlideQuote className="text-center">
            Partner with us to transform caregiving support from 
            reactive crisis management to proactive, scalable solutions.
          </SlideQuote>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-xl">
          <div className="bg-white/40 p-6 rounded-lg text-center">
            <div className="w-10 h-10 bg-amber-800 text-white rounded-full flex items-center justify-center font-heading text-lg mx-auto mb-md">1</div>
            <h3 className="font-heading text-lg mb-md">White-Label Integration</h3>
            <SlideBody className="text-sm">
              Deploy GiveCare under your brand with custom onboarding and messaging.
            </SlideBody>
          </div>
          
          <div className="bg-white/40 p-6 rounded-lg text-center">
            <div className="w-10 h-10 bg-amber-800 text-white rounded-full flex items-center justify-center font-heading text-lg mx-auto mb-md">2</div>
            <h3 className="font-heading text-lg mb-md">ROI Analytics Dashboard</h3>
            <SlideBody className="text-sm">
              Real-time metrics on utilization reduction, engagement rates, and cost savings.
            </SlideBody>
          </div>
          
          <div className="bg-white/40 p-6 rounded-lg text-center">
            <div className="w-10 h-10 bg-amber-800 text-white rounded-full flex items-center justify-center font-heading text-lg mx-auto mb-md">3</div>
            <h3 className="font-heading text-lg mb-md">API & System Integration</h3>
            <SlideBody className="text-sm">
              Seamless integration with EHRs, HRIS, and existing member platforms.
            </SlideBody>
          </div>
          
          <div className="bg-white/40 p-6 rounded-lg text-center">
            <div className="w-10 h-10 bg-amber-800 text-white rounded-full flex items-center justify-center font-heading text-lg mx-auto mb-md">4</div>
            <h3 className="font-heading text-lg mb-md">Dedicated Support Team</h3>
            <SlideBody className="text-sm">
              24/7 technical support and account management for enterprise partners.
            </SlideBody>
          </div>
          
          <div className="bg-white/40 p-6 rounded-lg text-center">
            <div className="w-10 h-10 bg-amber-800 text-white rounded-full flex items-center justify-center font-heading text-lg mx-auto mb-md">5</div>
            <h3 className="font-heading text-lg mb-md">Custom Training & Onboarding</h3>
            <SlideBody className="text-sm">
              Tailored training programs for your staff and member rollout strategies.
            </SlideBody>
          </div>
          
          <div className="flex items-center justify-center bg-white/40 p-6 rounded-lg">
            <div className="text-center">
              <div className="text-3xl mb-md">📊</div>
              <SlideBody className="font-medium">
                Data-driven solutions for scalable caregiver support
              </SlideBody>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-900/10 p-6 rounded-lg text-center">
          <SlideBody className="font-medium">
            Enterprise-grade platform + proven outcomes + seamless integration = partnership success
          </SlideBody>
        </div>
      </CenteredContent>
      
      {/* Source at bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <a 
          href="https://www.nationalacademies.org/our-work/strategies-and-interventions-to-strengthen-support-for-family-caregiving-and-to-alleviate-caregiver-burden-a-workshop" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-body text-sm text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center"
        >
          Strategies and Interventions to Strengthen Support for Family Caregiving and to Alleviate Caregiver Burden: A Workshop
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </SlideLayout>
  );
}