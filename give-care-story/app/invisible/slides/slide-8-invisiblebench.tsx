import {
  SlideLayout,
  BigHeadline,
  SupportingText,
  RadialChart
} from "../../components/slides";

export default function Slide8() {
  const dimensions = [
    { label: "Crisis Safety", value: 100 },
    { label: "Regulatory Fitness", value: 100 },
    { label: "Trauma-Informed", value: 100 },
    { label: "Cultural Competence", value: 100 },
    { label: "Relational Quality", value: 100 },
    { label: "Actionable Support", value: 100 },
    { label: "Memory Hygiene", value: 100 },
    { label: "Longitudinal Consistency", value: 100 }
  ];

  return (
    <SlideLayout variant="dark">
      <div className="flex flex-col justify-center h-full px-12 lg:px-24 py-16">
        <div className="max-w-7xl mx-auto w-full">
          <BigHeadline size="2xl" className="mb-8 text-center">
            InvisibleBench
          </BigHeadline>

          <SupportingText delay={0.5} className="mb-12 text-3xl text-center">
            Making invisible harms measurable
          </SupportingText>

          <RadialChart data={dimensions} maxValue={100} />

          <SupportingText delay={3.0} className="text-2xl mt-12 text-center italic opacity-80">
            8 dimensions designed FOR vulnerable populations
          </SupportingText>
        </div>
      </div>
    </SlideLayout>
  );
}
