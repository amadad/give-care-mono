import Image from "next/image";
import { SlideLayout, CenteredContent } from "../../components/slides";

export default function Slide6() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent>
        <div className="relative h-[85vh] w-auto bg-white rounded-xl shadow-xl">
          <div className="p-8 h-full w-full flex items-center justify-center">
            <Image
              src="/gen01.webp"
              alt="Generated content"
              width={560}
              height={700}
              className="h-full w-auto object-contain"
              priority
            />
          </div>
        </div>
      </CenteredContent>
      
      {/* Source at bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <a 
          href="https://hbr.org/2025/04/how-people-are-really-using-gen-ai-in-2025"
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-sm text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center"
        >
          HBR (April 2025)
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </SlideLayout>
  );
}