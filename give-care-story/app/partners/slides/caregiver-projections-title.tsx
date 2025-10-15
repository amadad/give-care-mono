import { SlideLayout, CenteredContent, SlideTitle, SlideSubtitle, SlideBody } from "../../components/slides";

export default function CaregiverProjectionsTitle() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="4xl">
        <SlideTitle className="mb-xl">
          Projecting Unpaid Family Caregivers to 2030
        </SlideTitle>
        
        <SlideSubtitle className="mb-lg">
          The Growing Care Gap
        </SlideSubtitle>
        
        <div className="space-y-6">
          <SlideBody className="text-center">
            From 43.5 million caregivers in 2015 to an estimated 72 million in 2030
          </SlideBody>
          
          <div className="bg-white/40 rounded-lg p-6">
            <SlideBody className="text-center font-medium">
              While the 65+ population will expand ~67% from 2015 to 2030, 
              the pool of family caregivers is struggling to keep pace — 
              posing a serious care gap in the coming decade.
            </SlideBody>
          </div>
        </div>
      </CenteredContent>
      
      {/* Source at bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <span className="font-body text-sm text-amber-700">
          Analysis based on NAC/AARP surveys and U.S. Census projections
        </span>
      </div>
    </SlideLayout>
  );
}