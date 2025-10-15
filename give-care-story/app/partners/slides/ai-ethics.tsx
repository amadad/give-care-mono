import { SlideLayout, CenteredContent, SlideTitle } from "../../components/slides";

export default function Slide22() {
  const comparisonData = [
    {
      dimension: "Core task",
      netflix: "Rank existing items",
      generative: "Create or adapt new content"
    },
    {
      dimension: "Signal source",
      netflix: "Historic ratings, clicks, watch time",
      generative: "User goals, natural-language prompts, context windows"
    },
    {
      dimension: "Model type",
      netflix: "Collaborative filtering, matrix factorisation",
      generative: "Large language or multimodal foundation models (GPT-4-o, Gemini, etc.)"
    },
    {
      dimension: "Personalisation horizon",
      netflix: '"More like this" within known catalogue',
      generative: '"Pathways" toward desired state (learn Spanish, design workout, plan career pivot)'
    },
    {
      dimension: "Content diversity",
      netflix: "Limited to catalogue; risk of echo-chambers",
      generative: "Can synthesise novel combos, reduce filter bubbles"
    },
    {
      dimension: "Primary KPI",
      netflix: "Engagement minutes, retention",
      generative: "Goal attainment, user growth metrics (skills mastered, tasks completed)"
    },
    {
      dimension: "Ethical pinch-points",
      netflix: "Reinforces past biases, addictive loops",
      generative: "Hallucinations, over-reliance, value-misalignment"
    }
  ];

  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <SlideTitle className="mb-xl">
          What's different?
        </SlideTitle>
        
        <div className="bg-white/40 rounded-xl p-6 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-amber-200">
                <th className="font-heading text-lg p-4 text-left w-1/4">Dimension</th>
                <th className="font-heading text-lg p-4 text-left w-3/8">"Netflix-era" recommender</th>
                <th className="font-heading text-lg p-4 text-left w-3/8">Generative-AI aspirational engine</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <tr key={index} className="border-b border-amber-100 hover:bg-amber-50/50">
                  <td className="font-heading text-md p-4 font-medium">{row.dimension}</td>
                  <td className="font-body text-sm text-amber-800 p-4 leading-relaxed">{row.netflix}</td>
                  <td className="font-body text-sm text-amber-800 p-4 leading-relaxed">{row.generative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CenteredContent>
      
      {/* Source at bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <a 
          href="https://www.anthropic.com/research" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-body text-sm text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center"
        >
          AI Ethics Comparison Framework
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </SlideLayout>
  );
}