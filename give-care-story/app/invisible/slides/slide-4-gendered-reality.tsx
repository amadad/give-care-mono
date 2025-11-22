import {
  SlideLayout,
  BigHeadline,
  SupportingText,
  AnimatedList,
  ProgressiveReveal
} from "../../components/slides";

export default function Slide4() {
  const womenCaregivers = [
    "Provide more intensive care (27 hours/week average)",
    "Do more ADLs (bathing, toileting, feeding)",
    "Manage more medical tasks (medications, wound care)",
    "18% of working caregivers provide 40+ hours/week"
  ];

  const whyWomen = [
    "Cultural: \"Women are natural caregivers\" (socialized from birth)",
    "Structural: Women earn less → \"makes sense\" to leave workforce",
    "Biological: Women live longer → more likely to need AND provide care",
    "Relational: Daughters-in-law care for in-laws"
  ];

  return (
    <SlideLayout variant="dark">
      <div className="flex flex-col justify-center h-full px-12 lg:px-24 py-16">
        <div className="max-w-7xl mx-auto w-full">
          <BigHeadline size="2xl" className="mb-8">
            The Gendered Reality
          </BigHeadline>

          <SupportingText delay={0.5} className="mb-12 text-4xl">
            61% of Caregivers Are Women
          </SupportingText>

          <ProgressiveReveal startDelay={0.8} staggerDelay={0.5}>
            <div className="mb-12">
              <h3 className="font-heading text-3xl md:text-4xl mb-6">Women caregivers:</h3>
              <AnimatedList items={womenCaregivers} startDelay={1.5} staggerDelay={0.2} />
            </div>

            <div className="mb-12">
              <h3 className="font-heading text-3xl md:text-4xl mb-6">Why women?</h3>
              <AnimatedList items={whyWomen} startDelay={2.5} staggerDelay={0.2} />
            </div>

            <div className="bg-white/10 p-8 rounded-2xl">
              <SupportingText className="text-3xl mb-4">
                Result: 56% had no choice in becoming a caregiver
              </SupportingText>
              <SupportingText className="text-2xl opacity-80">
                Obligation creates health consequences.
              </SupportingText>
            </div>
          </ProgressiveReveal>
        </div>
      </div>
    </SlideLayout>
  );
}
