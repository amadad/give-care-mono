import { SlideLayout, SlideTitle, SlideBody, GiveCareLogo } from "../../components/slides";

export default function Slide9() {
  return (
    <SlideLayout variant="cream">
      <div className="max-w-5xl mx-auto py-12 md:py-16">
        <div className="flex items-center justify-center gap-6 mb-8">
          <GiveCareLogo size={80} />
          <SlideTitle>GiveCare</SlideTitle>
        </div>

        <h2 className="font-heading text-3xl md:text-4xl text-center mb-8">
          SMS-First AI That Passes SupportBench
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <div className="bg-white/50 p-6 rounded-lg">
            <ul className="font-body text-xl leading-relaxed space-y-3 ml-8 list-disc">
              <li>Built using SupportBench principles</li>
              <li>Tested against all 8 dimensions</li>
              <li>235+ passing tests, 900ms response time</li>
            </ul>
          </div>

          <div className="bg-white/50 p-6 rounded-lg">
            <h3 className="font-heading text-2xl md:text-3xl mb-4">Why SMS?</h3>
            <ul className="font-body text-lg leading-relaxed space-y-2">
              <li>Only 13% use respite services (can't download apps during crisis)</li>
              <li>Works on any phone (no smartphone required)</li>
              <li>Text between caregiving tasks (one-handed, asynchronous)</li>
              <li>Available 24/7</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 bg-white/50 p-6 rounded-lg">
          <h3 className="font-heading text-2xl md:text-3xl mb-4">3-agent system:</h3>
          <ul className="font-body text-xl leading-relaxed space-y-3 ml-8 list-disc">
            <li><strong>Main Agent</strong> (daily support, relationship continuity)</li>
            <li><strong>Crisis Agent</strong> (safety detection, immediate resources)</li>
            <li><strong>Assessment Agent</strong> (clinical screening: BSFC, REACH-II, SDOH)</li>
          </ul>
        </div>

        <div className="mt-12 text-center">
          <SlideBody className="text-xl italic">
            Trauma-informed by design, validated by research.
          </SlideBody>
        </div>
      </div>
    </SlideLayout>
  );
}
