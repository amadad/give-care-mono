import { SlideLayout, CenteredContent, SlideTitle, SlideBody } from "../../components/slides";

export default function CareCaregiver() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <div className="flex flex-col items-center justify-center h-full">
          <SlideTitle className="mb-2xl">
            Who Cares for the Caregiver?
          </SlideTitle>
          
          {/* Three Circles with Arrows */}
          <div className="flex items-center justify-center gap-16 mb-2xl">
            {/* First Circle - Care Recipient */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-4 border-amber-900 bg-white flex items-center justify-center mb-lg">
                <span className="text-xl">🏥</span>
              </div>
              <div className="text-center">
                <h3 className="font-heading text-xl mb-md text-amber-900">Care Recipient</h3>
                <SlideBody className="text-md text-amber-900">Person needing support</SlideBody>
              </div>
            </div>
            
            {/* Arrow 1 - pointing left */}
            <div className="flex items-center">
              <svg className="w-12 h-12 text-amber-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
            </div>
            
            {/* Second Circle - Caregiver */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-4 border-amber-900 bg-white flex items-center justify-center mb-lg">
                <span className="text-xl">👥</span>
              </div>
              <div className="text-center">
                <h3 className="font-heading text-xl mb-md text-amber-900">Caregiver</h3>
                <SlideBody className="text-md text-amber-900">Family member or friend</SlideBody>
              </div>
            </div>
            
            {/* Arrow 2 - pointing left */}
            <div className="flex items-center">
              <svg className="w-12 h-12 text-amber-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
            </div>
            
            {/* Third Circle - Question Mark */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-4 border-amber-900 bg-white flex items-center justify-center mb-lg">
                <span className="text-xl">❓</span>
              </div>
              <div className="text-center">
                <h3 className="font-heading text-xl mb-md text-amber-900">Who Supports</h3>
                <SlideBody className="text-md text-amber-900">the Caregiver?</SlideBody>
              </div>
            </div>
          </div>
          
          {/* Quote in card */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-amber-200 max-w-4xl">
            <blockquote className="font-body text-lg mb-2 italic text-center text-amber-900">
              "Caregivers are Nagelians. Using whatever observations they can, they figure out what it's like to be the patient."
            </blockquote>
            <SlideBody className="text-sm text-center text-amber-900">
              Dr. Jason Karlawish, co-director of the Penn Memory Center
            </SlideBody>
          </div>
        </div>
        
      </CenteredContent>
    </SlideLayout>
  );
}
