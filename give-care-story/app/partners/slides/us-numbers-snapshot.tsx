export default function Slide7() {
  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-2xl">
          <h1 className="font-heading text-4xl leading-tight mb-md text-amber-900">
            How the numbers stack up — U.S. snapshot, 2025
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-amber-900">
          <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-lg">
            <div className="text-3xl mb-3">🇺🇸</div>
            <div className="font-body text-md">
              <strong>U.S. resident population 341,145,670</strong><br />
              1.0 (reference)
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-lg">
            <div className="text-3xl mb-3">👥</div>
            <div className="font-body text-md">
              <strong>Unpaid family caregivers ≈ 53 million</strong><br />
              1 per 6.4 people
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-lg">
            <div className="text-3xl mb-3">🏥</div>
            <div className="font-body text-md">
              <strong>Adults with ≥ 1 chronic disease ≈ 129 million</strong><br />
              1 per 2.6 people
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-lg">
            <div className="text-3xl mb-3">🛏️</div>
            <div className="font-body text-md">
              <strong>Annual inpatient discharges (2022) ≈ 32.9 million stays</strong><br />
              1 per 10.4 people
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-lg">
            <div className="text-3xl mb-3">👩‍⚕️</div>
            <div className="font-body text-md">
              <strong>Community health workers (CHWs) 63,400 employees</strong><br />
              1 per 5,400 people
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-lg">
            <div className="text-3xl mb-3">🏢</div>
            <div className="font-body text-md">
              <strong>Hospital/clinic patient representatives 14,300 employees</strong><br />
              ≈ 1 per 24,000 people
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-lg">
            <div className="text-3xl mb-3">🎓</div>
            <div className="font-body text-md">
              <strong>Board-Certified Patient Advocates (BCPAs) 1,040 certificants (May 2022)</strong><br />
              1 per 328,000 people
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white/40 rounded-lg">
            <div className="text-3xl mb-3">📋</div>
            <div className="font-body text-md">
              <strong>Independent advocates in public directories likely &lt; 2,000 profiles</strong><br />
              (exact count not published) — GNANOW directory description
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="font-body text-sm text-amber-700 opacity-80">
            Source: Various (WIP)
          </p>
        </div>
      </div>
    </div>
  );
}