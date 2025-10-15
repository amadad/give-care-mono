import { SlideLayout, VideoOverlay, GiveCareLogo, VideoSlideTitle, VideoSlideSubtitle } from "../../components/slides";

export default function Slide1() {
  return (
    <SlideLayout variant="video" videoSrc="/crow.mp4">
      <VideoOverlay>
        <div className="mb-8">
          <GiveCareLogo size={100} variant="light" />
          <VideoSlideTitle>
          Human-AI Partnership
          </VideoSlideTitle>
          <VideoSlideSubtitle>
            APHA Community Session
          </VideoSlideSubtitle>
          <h2 className="font-heading text-lg fade-in opacity-80">
            June 16, 2025
          </h2>
        </div>
      </VideoOverlay>
    </SlideLayout>
  );
}