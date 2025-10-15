export default function Slide17() {
  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theme 1 */}
          <div className="bg-white/80 p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-amber-800 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">1</div>
              <div>
                <h3 className="font-heading text-lg text-amber-900 mb-2">Lived experience must drive every decision</h3>
                <p className="font-body text-sm text-amber-800">
                  Story after story—parents, teens, bereaved siblings—reminded policymakers that caregivers and patients are the experts on what works. PCORI's requirement that grantees include patients & caregivers from study design through dissemination is the right model, but it needs deeper, non-performative adoption.
                </p>
              </div>
            </div>
          </div>

          {/* Theme 2 */}
          <div className="bg-white/80 p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-amber-800 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">2</div>
              <div>
                <h3 className="font-heading text-lg text-amber-900 mb-2">"System" is a misnomer</h3>
                <p className="font-body text-sm text-amber-800">
                  Speakers called U.S. caregiving support a "patchwork" where every door feels like the wrong door. The CARE Act proves how hard even simple fixes are: 44 states require hospitals to record and train a family caregiver, yet enforcement and funding are spotty.
                </p>
              </div>
            </div>
          </div>

          {/* Theme 3 */}
          <div className="bg-white/80 p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-amber-800 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">3</div>
              <div>
                <h3 className="font-heading text-lg text-amber-900 mb-2">Caregiving is skilled labor, worth billions</h3>
                <p className="font-body text-sm text-amber-800">
                  Unpaid family caregivers supply care valued at $600 billion a year, up from $470 billion in 2017. They save Medicaid and Medicare but sacrifice their own earnings and Social-Security credits—an inequity multiple panelists flagged.
                </p>
              </div>
            </div>
          </div>

          {/* Theme 4 */}
          <div className="bg-white/80 p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-amber-800 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">4</div>
              <div>
                <h3 className="font-heading text-lg text-amber-900 mb-2">Young carers and bereaved caregivers remain an afterthought</h3>
                <p className="font-body text-sm text-amber-800">
                  Roughly 3.6 million U.S. teens and young adults provide essential care today and suffer higher anxiety and academic loss.<br />
                  Bereavement support is missing from most programs, yet grief can derail caregivers' long-term health and finances—underscored by several personal testimonies.
                </p>
              </div>
            </div>
          </div>

          {/* Theme 5 */}
          <div className="bg-white/80 p-6 rounded-lg lg:col-span-2">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-amber-800 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">5</div>
              <div>
                <h3 className="font-heading text-lg text-amber-900 mb-2">Culture change must travel with policy change</h3>
                <p className="font-body text-sm text-amber-800">
                  Laws alone won't deliver respect; provider education, compassionate language, and story-based advocacy are needed so caregivers stop being labeled "non-compliant."
                </p>
              </div>
            </div>
          </div>
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