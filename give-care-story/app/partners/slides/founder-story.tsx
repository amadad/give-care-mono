import { SlideLayout, CenteredContent, SlideTitle, SlideBody } from "../../components/slides";

export default function FounderStory() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="2xl">
        <SlideTitle className="mb-xl">
          Born from Lived Experience
        </SlideTitle>
        
        <div className="space-y-8">
          <SlideBody className="text-center">
            After seven years caring for both parents—my father with ALS and my mother with dementia—I created GiveCare: an AI-powered SMS companion for caregivers.
          </SlideBody>
          
          <SlideBody className="text-center">
            Caregiving exposed a hidden infrastructure: millions of family caregivers, mostly unpaid and unsupported, navigating complexity without a roadmap.
          </SlideBody>
          
          <SlideBody className="text-center">
            GiveCare exists to change that.
          </SlideBody>
          
          <SlideBody className="text-center">
            More than information—it offers presence. It listens, remembers, and delivers personalized support directly over text.
          </SlideBody>
          
          <SlideBody className="text-center">
            It's not an app. It's a companion.
          </SlideBody>
          
          <div className="mt-8 text-center">
            <SlideBody className="text-sm">
              — Ali Madad, Founder & Board-Certified Patient Advocate
            </SlideBody>
          </div>
        </div>
      </CenteredContent>
    </SlideLayout>
  );
}