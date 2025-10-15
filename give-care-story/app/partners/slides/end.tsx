import { SlideLayout, VideoOverlay, GiveCareLogo, VideoSlideTitle, VideoSlideSubtitle } from "../../components/slides";

export default function Slide18() {
  return (
    <SlideLayout variant="video" videoSrc="/crow.mp4">
      <VideoOverlay>
        <div className="mb-8 text-center">
          <GiveCareLogo 
            size={120} 
            variant="light" 
            href="https://www.givecareapp.com"
          />
          <VideoSlideTitle>
            Let's Partner Together
          </VideoSlideTitle>
          <VideoSlideSubtitle>
            Ready to transform caregiver support?
          </VideoSlideSubtitle>
          
          <div className="mt-12 space-y-6">
            <VideoSlideSubtitle>
              ali@givecareapp.com
            </VideoSlideSubtitle>
            <VideoSlideSubtitle>
              www.givecareapp.com
            </VideoSlideSubtitle>
          </div>
        </div>
      </VideoOverlay>
    </SlideLayout>
  );
}
