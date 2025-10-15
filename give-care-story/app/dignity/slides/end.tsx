import { SlideLayout, VideoOverlay, GiveCareLogo, VideoSlideSubtitle } from "../../components/slides";

export default function Slide18() {
  return (
    <SlideLayout variant="video" videoSrc="/crow.mp4">
      <VideoOverlay>
        <div className="mb-8">
          <GiveCareLogo 
            size={100} 
            variant="light" 
            href="https://www.givecareapp.com"
          />
          <VideoSlideSubtitle>
            ali@givecareapp.com
          </VideoSlideSubtitle>
        </div>
      </VideoOverlay>
    </SlideLayout>
  );
}
