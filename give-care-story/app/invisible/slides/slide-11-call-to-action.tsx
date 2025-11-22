import { SlideLayout, SlideTitle, SlideBody } from "../../components/slides";

export default function Slide11() {
  return (
    <SlideLayout variant="cream">
      <div className="max-w-5xl mx-auto py-12 md:py-16">
        <SlideTitle>Making Invisible Care Visible</SlideTitle>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white/50 p-6 rounded-lg">
            <h3 className="font-heading text-2xl md:text-3xl mb-4">For policymakers:</h3>
            <ul className="font-body text-lg leading-relaxed space-y-2">
              <li>Paid family leave (45pp gap between need and access)</li>
              <li>Medicare coverage for caregiver training</li>
              <li>Tax credits for caregiving expenses</li>
            </ul>
          </div>

          <div className="bg-white/50 p-6 rounded-lg">
            <h3 className="font-heading text-2xl md:text-3xl mb-4">For healthcare:</h3>
            <ul className="font-body text-lg leading-relaxed space-y-2">
              <li>Screen caregivers at patient appointments</li>
              <li>Prescribe respite like we prescribe medication</li>
              <li>Recognize unpaid labor as skilled labor</li>
            </ul>
          </div>

          <div className="bg-white/50 p-6 rounded-lg">
            <h3 className="font-heading text-2xl md:text-3xl mb-4">For technology:</h3>
            <ul className="font-body text-lg leading-relaxed space-y-2">
              <li>Build for 2am, not 9-5</li>
              <li>Design for relationship safety</li>
              <li>Center trauma-informed care</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 bg-white/50 p-8 rounded-lg">
          <h3 className="font-heading text-2xl md:text-3xl mb-6">What if:</h3>
          <ul className="font-body text-xl leading-relaxed space-y-3 ml-8 list-disc">
            <li>Every caregiver had 24/7 clinical-grade support</li>
            <li>Burnout was screened as routinely as blood pressure</li>
            <li>Technology respected trauma instead of causing it</li>
            <li>Women's unpaid labor was valued, supported, sustained</li>
          </ul>
        </div>

        <div className="mt-12 text-center">
          <SlideBody className="text-3xl md:text-4xl font-bold">
            63 million caregivers—61% women—are waiting.
          </SlideBody>
        </div>
      </div>
    </SlideLayout>
  );
}
