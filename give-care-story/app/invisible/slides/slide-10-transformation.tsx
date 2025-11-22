import {
  SlideLayout,
  BigHeadline,
  SupportingText,
  InvisibleToVisible
} from "../../components/slides";

export default function Slide10() {
  return (
    <SlideLayout variant="cream">
      <div className="flex flex-col justify-center h-full px-12 lg:px-24">
        <div className="max-w-7xl mx-auto w-full">
          <BigHeadline size="2xl" className="mb-16 text-center">
            Making the Invisible Visible
          </BigHeadline>

          <InvisibleToVisible
            beforeLabel="Invisible Burnout"
            afterLabel="Visible Support"
          />

          <SupportingText delay={4.5} className="text-3xl mt-16 text-center">
            GiveCare transforms scattered, unseen struggles
          </SupportingText>

          <SupportingText delay={5.0} className="text-3xl mt-4 text-center font-bold">
            into organized, actionable support
          </SupportingText>
        </div>
      </div>
    </SlideLayout>
  );
}
