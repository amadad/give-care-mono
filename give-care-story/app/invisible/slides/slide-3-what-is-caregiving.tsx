import {
  SlideLayout,
  BigHeadline,
  SupportingText,
  LiveStats
} from "../../components/slides";

export default function Slide3() {
  return (
    <SlideLayout variant="cream">
      <div className="flex flex-col justify-center h-full px-12 lg:px-24">
        <div className="max-w-7xl mx-auto w-full text-center">
          <BigHeadline size="2xl" className="mb-16">
            The Scale
          </BigHeadline>

          <LiveStats
            fallbackValue="63 Million"
            label="American Caregivers"
            className="mb-12"
          />

          <SupportingText delay={1.0} className="text-3xl mb-8">
            1 in 4 adults
          </SupportingText>

          <SupportingText delay={1.5} className="text-2xl opacity-70">
            Larger than California and Texas combined
          </SupportingText>

          <div className="mt-16 pt-8 border-t border-amber-900/20">
            <SupportingText delay={2.0} className="text-3xl font-bold italic">
              Most don't even know they're caregivers
            </SupportingText>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}
