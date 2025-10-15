import { SlideLayout, CenteredContent, ImageCard } from "../../components/slides";

export default function Slide6() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent className="space-y-4">
        <ImageCard
          src="/gen01.webp"
          alt="Generated content"
          className="h-[85vh] w-auto"
          caption="Source: HBR (April 2025)"
          link="https://hbr.org/2025/04/how-people-are-really-using-gen-ai-in-2025"
        />
      </CenteredContent>
    </SlideLayout>
  );
}