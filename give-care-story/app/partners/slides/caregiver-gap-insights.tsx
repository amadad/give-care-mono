import { SlideLayout, CenteredContent, SlideTitle, SlideSubtitle, SlideBody } from "../../components/slides";

export default function CaregiverGapInsights() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <SlideTitle className="mb-xl">
          The Caregiving Crisis by 2030
        </SlideTitle>
        
        <div className="grid md:grid-cols-2 gap-8 mb-xl">
          <div className="bg-white/40 rounded-lg p-6">
            <SlideSubtitle className="mb-md text-left text-amber-900">
              📈 Explosive Growth
            </SlideSubtitle>
            <div className="font-body text-md leading-relaxed text-left space-y-3">
              <div><strong>+9.5 million</strong> new family caregivers (2015-2020)</div>
              <div><strong>+19 million</strong> projected growth (2020-2030)</div>
              <div><strong>~1.9 million</strong> additional caregivers needed per year</div>
            </div>
          </div>

          <div className="bg-white/40 rounded-lg p-6">
            <SlideSubtitle className="mb-md text-left text-red-800">
              ⚠️ Supply-Demand Mismatch
            </SlideSubtitle>
            <div className="font-body text-md leading-relaxed text-left space-y-3">
              <div><strong>7:1 ratio</strong> today (potential caregivers per senior)</div>
              <div><strong>4:1 ratio</strong> projected by 2030</div>
              <div><strong>4 million</strong> caregiver shortfall predicted</div>
            </div>
          </div>
        </div>

        <div className="bg-amber-900/15 rounded-lg p-8">
          <SlideSubtitle className="mb-md text-center">
            Two Projection Scenarios
          </SlideSubtitle>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-heading mb-md text-green-700">72M</div>
              <SlideBody className="font-medium">
                <strong>Optimistic:</strong> Linear extrapolation assumes caregiving capacity keeps pace with demand
              </SlideBody>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-heading mb-md text-red-700">68M</div>
              <SlideBody className="font-medium">
                <strong>Realistic:</strong> Accounting for caregiver supply constraints and workforce limitations
              </SlideBody>
            </div>
          </div>
        </div>

        <div className="mt-lg text-center">
          <SlideBody className="font-medium text-amber-900">
            This growing gap creates unprecedented opportunities for scalable caregiving solutions
          </SlideBody>
        </div>
      </CenteredContent>
      
      {/* Source at bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <span className="font-body text-sm text-amber-700">
          Analysis: National Alliance for Caregiving, AARP, Bureau of Labor Statistics
        </span>
      </div>
    </SlideLayout>
  );
}