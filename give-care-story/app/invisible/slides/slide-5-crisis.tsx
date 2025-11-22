import {
  SlideLayout,
  BigHeadline,
  SupportingText,
  RadialChart
} from "../../components/slides";

export default function Slide5() {
  const burnoutData = [
    { label: "Emotional Stress", value: 64 },
    { label: "Physical Strain", value: 45 },
    { label: "Financial Impact", value: 78 },
    { label: "Social Isolation", value: 24 },
    { label: "Health Decline", value: 20 },
    { label: "Sleep Disruption", value: 50 },
    { label: "Career Sacrifice", value: 67 },
    { label: "No Respite", value: 87 }
  ];

  return (
    <SlideLayout variant="dark">
      <div className="flex flex-col justify-center h-full px-12 lg:px-24">
        <div className="max-w-7xl mx-auto w-full">
          <BigHeadline size="2xl" className="mb-8 text-center">
            The Burnout Crisis
          </BigHeadline>

          <SupportingText delay={0.5} className="text-3xl mb-12 text-center">
            Caregivers are breaking
          </SupportingText>

          <RadialChart data={burnoutData} maxValue={100} />

          <SupportingText delay={3.0} className="text-2xl mt-12 text-center italic opacity-80">
            We can't "awareness campaign" our way out. We need infrastructure.
          </SupportingText>
        </div>
      </div>
    </SlideLayout>
  );
}
