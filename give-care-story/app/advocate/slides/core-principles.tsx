import Image from "next/image";

export default function Slide24() {
  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <Image
            src="/ethic.jpeg"
            alt="Ethics diagram showing overlapping values: Privacy, Justice, Safety, Fairness, Inclusion, Diversity, and Equity"
            width={900}
            height={600}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
        
        {/* Source at bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <a 
            href="https://www.iaseai.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-body text-sm text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center"
          >
            Margaret Mitchell, Huggingface at IASEAI
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}