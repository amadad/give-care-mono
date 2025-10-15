import Image from "next/image";
import { SlideLayout, CenteredContent, SlideTitle, SlideSubtitle, SlideBody } from "../../components/slides";

export default function Slide38() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="4xl">
        <div className="flex flex-col items-center space-y-12">
          {/* Image */}
          <div className="flex justify-center">
            <Image
              src="/careg.jpg"
              alt="Colorful caregiving illustration with hands reaching to support each other"
              width={500}
              height={333}
              className="w-full max-w-md h-auto object-contain rounded-xl"
              priority
            />
          </div>
          
          {/* Offer */}
          <div className="space-y-6 max-w-2xl">
            <div className="text-center">
              <SlideTitle className="mb-md">
                Partnership Opportunity
              </SlideTitle>
              <SlideSubtitle>
                For Organizational Partners
              </SlideSubtitle>
            </div>
            
            <div className="bg-white/40 rounded-xl p-8">
              <div className="text-center mb-lg">
                <div className="flex items-center justify-center gap-4 mb-md">
                  <div className="text-6xl font-heading">50%</div>
                  <div className="text-6xl font-heading">OFF</div>
                </div>
                <SlideSubtitle>First 3 months</SlideSubtitle>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <SlideBody className="mb-md">
                    Scale this benefit across your member network
                  </SlideBody>
                </div>
                
                <div className="border-t border-amber-200 pt-4 text-center">
                  <SlideBody className="mb-md">
                    Questions or ready to get started?
                  </SlideBody>
                  <a 
                    href="mailto:ali@givecareapp.com"
                    className="font-heading text-lg hover:text-amber-700 underline"
                  >
                    ali@givecareapp.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CenteredContent>
    </SlideLayout>
  );
}