import {
  SlideLayout,
  BigHeadline,
  SupportingText,
  TwoColumnSlide,
  AnimatedList,
  ProgressiveReveal
} from "../../components/slides";

export default function Slide6() {
  const traditional = [
    "Hallucinations",
    "Toxic content",
    "Generic helpfulness"
  ];

  const caregivingNeeds = [
    "Crisis detection (64% high stress, 24% feel alone)",
    "Trauma-informed response (no dismissiveness)",
    "Regulatory fitness (no medical advice)",
    "Longitudinal relationship safety"
  ];

  const harmfulExamples = [
    "\"Have you tried meditation?\" (dismissive)",
    "Medical advice (illegal, harmful)",
    "\"Call your doctor\" at 2am (unhelpful)"
  ];

  return (
    <SlideLayout variant="dark">
      <div className="flex flex-col justify-center h-full px-12 lg:px-24 py-16">
        <div className="max-w-7xl mx-auto w-full">
          <BigHeadline size="2xl" className="mb-8">
            The AI Safety Problem
          </BigHeadline>

          <SupportingText delay={0.5} className="mb-12 text-3xl">
            Most Health Tech Fails Caregivers
          </SupportingText>

          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="font-heading text-3xl md:text-4xl mb-6">
                Traditional benchmarks:
              </h3>
              <AnimatedList items={traditional} startDelay={0.8} staggerDelay={0.2} />
            </div>
            <div>
              <h3 className="font-heading text-3xl md:text-4xl mb-6">
                Caregiving requires:
              </h3>
              <AnimatedList items={caregivingNeeds} startDelay={1.2} staggerDelay={0.2} />
            </div>
          </div>

          <ProgressiveReveal startDelay={2.5} staggerDelay={0.4}>
            <div className="bg-white/10 p-8 rounded-2xl mb-8">
              <h3 className="font-heading text-2xl md:text-3xl mb-6">
                What if someone in crisis gets:
              </h3>
              <AnimatedList items={harmfulExamples} startDelay={3.0} staggerDelay={0.2} />
            </div>

            <SupportingText className="text-3xl font-bold italic text-center">
              Generic AI benchmarks miss the harms that matter most to vulnerable populations.
            </SupportingText>
          </ProgressiveReveal>
        </div>
      </div>
    </SlideLayout>
  );
}
