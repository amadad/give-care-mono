export default function Slide17() {
  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-lg">
          <h1 className="font-heading text-3xl leading-tight text-amber-900 mb-md">
            Workshop Action Items
          </h1>
        </div>
        
        {/* Framework Quote */}
        <div className="bg-white/60 p-6 rounded-lg mb-lg text-center">
          <blockquote className="font-body text-lg italic text-amber-900">
            "Complex problems require complex solutions, but also it's a simple problem... 
            the solution is investing in programs that support family caregivers."
          </blockquote>
        </div>
        
        {/* Action Items Grid - Simplified */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/80 p-6 rounded-lg text-center">
            <div className="w-10 h-10 bg-amber-800 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">1</div>
            <h3 className="font-heading text-lg text-amber-900 mb-3">Anti-Stigma Modules</h3>
            <p className="font-body text-sm text-amber-800">
              Bite-sized lessons that help parents tackle shame around mental-health challenges.
            </p>
          </div>
          
          <div className="bg-white/80 p-6 rounded-lg text-center">
            <div className="w-10 h-10 bg-amber-800 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">2</div>
            <h3 className="font-heading text-lg text-amber-900 mb-3">Employer Playbook</h3>
            <p className="font-body text-sm text-amber-800">
              Plug-and-play guide HR can hand to Finance to prove caregiving benefits save money.
            </p>
          </div>
          
          <div className="bg-white/80 p-6 rounded-lg text-center">
            <div className="w-10 h-10 bg-amber-800 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">3</div>
            <h3 className="font-heading text-lg text-amber-900 mb-3">Policy One-Pager</h3>
            <p className="font-body text-sm text-amber-800">
              Single-page brief that sells legislators on funding caregiver programs.
            </p>
          </div>
          
          <div className="bg-white/80 p-6 rounded-lg text-center">
            <div className="w-10 h-10 bg-amber-800 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">4</div>
            <h3 className="font-heading text-lg text-amber-900 mb-3">Quality-Assured Respite</h3>
            <p className="font-body text-sm text-amber-800">
              Respite care that's provably safe so caregivers don't return to a worse situation.
            </p>
          </div>
          
          <div className="bg-white/80 p-6 rounded-lg text-center">
            <div className="w-10 h-10 bg-amber-800 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">5</div>
            <h3 className="font-heading text-lg text-amber-900 mb-3">Partnership Marketplace</h3>
            <p className="font-body text-sm text-amber-800">
              Matchmaking map that connects community projects to funders.
            </p>
          </div>
          
          <div className="flex items-center justify-center bg-white/80 p-6 rounded-lg">
            <div className="text-center">
              <div className="text-3xl mb-3">📊</div>
              <p className="font-body text-md font-medium text-amber-900">
                Data-driven solutions for scalable caregiver support
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-lg bg-amber-900/10 p-6 rounded-lg text-center">
          <p className="font-body text-md font-medium text-amber-900">
            Lived-experience leadership + data-driven ROI + anti-stigma design = scalable caregiver support
          </p>
        </div>
        
        {/* Source at bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <a 
            href="https://www.nationalacademies.org/our-work/strategies-and-interventions-to-strengthen-support-for-family-caregiving-and-to-alleviate-caregiver-burden-a-workshop" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-body text-xs text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center text-center"
          >
            Strategies and Interventions to Strengthen Support for Family Caregiving and to Alleviate Caregiver Burden: A Workshop
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}