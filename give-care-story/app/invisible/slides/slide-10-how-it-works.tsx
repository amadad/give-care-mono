import { SlideLayout, SlideTitle, SlideBody } from "../../components/slides";

export default function Slide10() {
  return (
    <SlideLayout variant="dark">
      <div className="max-w-5xl mx-auto py-12 md:py-16">
        <SlideTitle>How It Works</SlideTitle>
        <h2 className="font-heading text-3xl md:text-4xl mt-6 mb-8">
          Real Support, Real Time
        </h2>

        <div className="bg-white/10 p-6 rounded-lg mb-8">
          <SlideBody className="text-xl italic mb-4">
            Caregiver texts at 2am: <span className="text-amber-300">"Mom fell again. I can't do this anymore."</span>
          </SlideBody>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-lg border-l-4 border-amber-400">
            <h3 className="font-heading text-xl md:text-2xl mb-2">1. Crisis detection</h3>
            <SlideBody>→ immediate safety resources (988, local ER)</SlideBody>
          </div>

          <div className="bg-white/5 p-6 rounded-lg border-l-4 border-amber-400">
            <h3 className="font-heading text-xl md:text-2xl mb-2">2. Emotional validation</h3>
            <SlideBody>→ "This is incredibly hard. You're not alone."</SlideBody>
          </div>

          <div className="bg-white/5 p-6 rounded-lg border-l-4 border-amber-400">
            <h3 className="font-heading text-xl md:text-2xl mb-2">3. Clinical assessment</h3>
            <SlideBody>→ BSFC burnout screening (4 pressure zones)</SlideBody>
          </div>

          <div className="bg-white/5 p-6 rounded-lg border-l-4 border-amber-400">
            <h3 className="font-heading text-xl md:text-2xl mb-2">4. Actionable support</h3>
            <SlideBody>→ local respite care, fall prevention resources</SlideBody>
          </div>

          <div className="bg-white/5 p-6 rounded-lg border-l-4 border-amber-400">
            <h3 className="font-heading text-xl md:text-2xl mb-2">5. Follow-up</h3>
            <SlideBody>→ checks in next day, tracks burnout trajectory</SlideBody>
          </div>
        </div>

        <div className="mt-12 space-y-6">
          <SlideBody className="text-xl text-center">
            Every response evaluated against SupportBench criteria.
          </SlideBody>
          <div className="text-center space-y-3">
            <SlideBody className="text-2xl font-bold">
              This isn't "move fast and break things."
            </SlideBody>
            <SlideBody className="text-2xl font-bold">
              This is "move carefully and support people."
            </SlideBody>
          </div>
          <SlideBody className="text-xl text-center italic">
            Not replacing human connection—scaffolding it.
          </SlideBody>
        </div>
      </div>
    </SlideLayout>
  );
}
