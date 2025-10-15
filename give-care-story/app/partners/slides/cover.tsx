import { SlideLayout, VideoOverlay, GiveCareLogo, VideoSlideTitle, VideoSlideSubtitle } from "../../components/slides";

export default function Slide1() {
  return (
    <SlideLayout variant="video" videoSrc="/crow.mp4">
      <VideoOverlay>
        <div className="mb-8">
          <GiveCareLogo size={100} variant="light" />
          <VideoSlideTitle>
          Partnership
          </VideoSlideTitle>
          <VideoSlideSubtitle>
            Collaboration and Innovation          </VideoSlideSubtitle>
          <VideoSlideSubtitle>
            2025
          </VideoSlideSubtitle>
        </div>
      </VideoOverlay>
    </SlideLayout>
  );
}