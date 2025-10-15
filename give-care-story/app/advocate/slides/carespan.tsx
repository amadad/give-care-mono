import Image from "next/image";

export default function Slide8() {
  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-lg">
          <h1 className="font-heading text-3xl leading-tight text-amber-900 mb-md">
            Carespan vs. Lifespan
          </h1>
          <p className="font-body text-lg text-amber-800">The future isn’t just about living longer. It’s about caring longer — and better.</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <Image
            src="/carespan.png"
            alt="Chart showing the relationship between lifespan, healthspan, and carespan over time"
            width={900}
            height={500}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
        
        {/* Source at bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <a 
            href="https://www.linkedin.com/pulse/we-need-extend-our-carespans-max-mayblum-apnhe/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-body text-sm text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center"
          >
            We Need to Extend Our Carespans
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}