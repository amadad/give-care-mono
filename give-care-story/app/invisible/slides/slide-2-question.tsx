import {
  SlideLayout,
  BigHeadline,
  SupportingText,
  AnimatedList,
  ProgressiveReveal
} from "../../components/slides";

export default function Slide2() {
  const questions = [
    "Do you help your mom manage her medications?",
    "Drive your dad to doctor appointments?",
    "Handle your spouse's insurance paperwork?",
    "Check on your neighbor with dementia?"
  ];

  return (
    <SlideLayout variant="dark">
      <div className="flex flex-col justify-center h-full px-12 lg:px-24 max-w-6xl mx-auto">
        <BigHeadline size="2xl" className="mb-12">
          "Are you a caregiver?"
        </BigHeadline>

        <ProgressiveReveal startDelay={0.6} staggerDelay={0.4}>
          <SupportingText className="mb-8">Most people say no.</SupportingText>

          <div className="mb-8">
            <SupportingText className="mb-6">Then you ask:</SupportingText>
            <AnimatedList items={questions} startDelay={2.0} staggerDelay={0.3} />
          </div>

          <SupportingText className="mb-12">They say yes.</SupportingText>

          <div className="pt-8 border-t border-white/20">
            <BigHeadline size="xl">
              You just described caregiving.
            </BigHeadline>
          </div>
        </ProgressiveReveal>
      </div>
    </SlideLayout>
  );
}
