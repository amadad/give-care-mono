export default function RespiteCareSlide() {
  const keyTakeaways = [
    "Respite care gives family caregivers a short break from their duties.",
    "Breaks are crucial for caregivers' physical, emotional, and mental health.",
    "Respite can include time away or help with specific care tasks at home.",
    "It can be provided through various programs and volunteers.",
    "Finding affordable and accessible respite is a common need for caregivers."
  ];

  const decisionTriggers = [
    { signal: "Feeling exhausted or burned out", action: "Actively seek respite care options" },
    { signal: "Needing time for appointments/errands", action: "Arrange for temporary care" },
    { signal: "Wanting to prevent caregiver stress", action: "Plan for regular respite breaks if possible" }
  ];

  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] overflow-y-auto">
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-8">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl mb-4 text-amber-900">Respite Care</h1>
            <div className="bg-amber-100 rounded-lg p-4 mb-6">
              <p className="font-body text-sm text-amber-800">
                🔸 Respite care is a short break from caregiving. It's important for your well-being & can help you continue providing care.
              </p>
            </div>
            <p className="font-body text-md text-amber-800 max-w-3xl mx-auto">
              Respite care provides temporary relief for family caregivers, offering a necessary break from responsibilities to support their own well-being, which can take many forms depending on individual needs and cultural preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/90 rounded-xl p-6 shadow-lg">
              <h3 className="font-heading text-lg text-amber-900 mb-4">Key Takeaways</h3>
              <ul className="space-y-3">
                {keyTakeaways.map((takeaway, index) => (
                  <li key={index} className="font-body text-sm text-amber-800 flex items-start">
                    <span className="text-amber-600 mr-2 mt-1">⬤</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/90 rounded-xl p-6 shadow-lg">
              <h3 className="font-heading text-lg text-amber-900 mb-4">Decision Triggers</h3>
              <div className="space-y-3">
                {decisionTriggers.map((trigger, index) => (
                  <div key={index} className="border-l-4 border-amber-300 pl-4">
                    <p className="font-body text-sm text-amber-900 font-medium">{trigger.signal}</p>
                    <p className="font-body text-xs text-amber-700 mt-1">{trigger.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/90 rounded-xl p-6 shadow-lg mb-6">
            <h3 className="font-heading text-lg text-amber-900 mb-4">Practical How-To</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="bg-amber-200 text-amber-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                  <div>
                    <p className="font-body text-sm text-amber-900 font-medium">Define your need</p>
                    <p className="font-body text-xs text-amber-700">Decide what kind of break or specific help would be most meaningful.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="bg-amber-200 text-amber-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                  <div>
                    <p className="font-body text-sm text-amber-900 font-medium">Search for providers</p>
                    <p className="font-body text-xs text-amber-700">Use online locators or ask local agencies about available respite services.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="bg-amber-200 text-amber-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                  <div>
                    <p className="font-body text-sm text-amber-900 font-medium">Understand options</p>
                    <p className="font-body text-xs text-amber-700">Explore different types like in-home help, adult day services, or short-term facility stays.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="bg-amber-200 text-amber-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                  <div>
                    <p className="font-body text-sm text-amber-900 font-medium">Check eligibility/cost</p>
                    <p className="font-body text-xs text-amber-700">Learn about funding options like Medicare, Medicaid, or program-specific assistance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-xl p-6 text-center">
            <h3 className="font-heading text-md text-amber-900 mb-3">Quick Links</h3>
            <div className="space-y-2">
              <a 
                href="https://archrespite.org/respitelocator" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-body text-sm text-amber-800 hover:text-amber-900 hover:underline inline-flex items-center"
              >
                National Respite Locator → archrespite.org/respitelocator
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}