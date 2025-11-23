import { SlideLayout, CenteredContent, SlideTitle, SlideBody, GiveCareLogo } from "../../components/slides";

export default function Slide12() {
  return (
    <SlideLayout variant="dark">
      <CenteredContent>
        <div className="mb-8">
          <GiveCareLogo size={100} variant="light" />
        </div>

        <SlideTitle>Thank You</SlideTitle>

        <div className="mt-12 space-y-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl mb-4">Contact</h2>
            <div className="font-body text-xl space-y-2">
              <p>[Your name]</p>
              <p>[Email]</p>
              <p>[GiveCare website]</p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20">
            <h2 className="font-heading text-2xl md:text-3xl mb-4">Learn more:</h2>
            <div className="font-body text-lg space-y-2">
              <p>GiveCare platform: [URL]</p>
              <p>SupportBench research: [URL]</p>
              <p>Caregiving in the US 2025 report: [URL]</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20">
          <SlideBody className="text-center opacity-70">
            Making invisible care visible
          </SlideBody>
        </div>
      </CenteredContent>
    </SlideLayout>
  );
}
