import {
  SlideLayout,
  BigHeadline,
  SupportingText,
  SankeyDiagram
} from "../../components/slides";

export default function Slide6() {
  const nodes = [
    { name: "Economic Instability", category: "sdoh" },
    { name: "Limited Healthcare Access", category: "sdoh" },
    { name: "Social Isolation", category: "sdoh" },
    { name: "Housing Insecurity", category: "sdoh" },
    { name: "Transportation Barriers", category: "sdoh" },
    { name: "Caregiver Burnout", category: "outcome" },
    { name: "Health Decline", category: "outcome" },
    { name: "Financial Crisis", category: "outcome" }
  ];

  const links = [
    { source: 0, target: 5, value: 30 },
    { source: 0, target: 7, value: 25 },
    { source: 1, target: 5, value: 20 },
    { source: 1, target: 6, value: 15 },
    { source: 2, target: 5, value: 25 },
    { source: 2, target: 6, value: 10 },
    { source: 3, target: 5, value: 15 },
    { source: 3, target: 7, value: 20 },
    { source: 4, target: 5, value: 10 },
    { source: 4, target: 6, value: 12 }
  ];

  return (
    <SlideLayout variant="cream">
      <div className="flex flex-col justify-center h-full px-12 lg:px-24 py-16">
        <div className="max-w-7xl mx-auto w-full">
          <BigHeadline size="2xl" className="mb-8 text-center">
            Social Determinants of Health
          </BigHeadline>

          <SupportingText delay={0.5} className="text-2xl mb-12 text-center">
            How SDOH factors compound caregiver burden
          </SupportingText>

          <SankeyDiagram nodes={nodes} links={links} />

          <SupportingText delay={4.0} className="text-2xl mt-12 text-center italic">
            GiveCare tracks SDOH to provide targeted, contextual support
          </SupportingText>
        </div>
      </div>
    </SlideLayout>
  );
}
