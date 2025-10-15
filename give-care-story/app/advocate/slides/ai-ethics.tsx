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
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-7xl">
        <div className="text-center mb-lg">
          <h1 className="font-heading text-3xl leading-tight text-amber-900 mb-md">
            What's different?
          </h1>
        </div>
        
        <div className="bg-white/80 rounded-xl p-6 shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-amber-200">
                <th className="font-heading text-lg text-amber-900 p-4 text-left w-1/4">Dimension</th>
                <th className="font-heading text-lg text-amber-900 p-4 text-left w-3/8">"Netflix-era" recommender</th>
                <th className="font-heading text-lg text-amber-900 p-4 text-left w-3/8">Generative-AI aspirational engine</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <tr key={index} className="border-b border-amber-100 hover:bg-amber-50/50">
                  <td className="font-heading text-md text-amber-900 p-4 font-medium">{row.dimension}</td>
                  <td className="font-body text-sm text-amber-800 p-4 leading-relaxed">{row.netflix}</td>
                  <td className="font-body text-sm text-amber-800 p-4 leading-relaxed">{row.generative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}