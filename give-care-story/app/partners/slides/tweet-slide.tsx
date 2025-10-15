import Image from "next/image";
import { SlideLayout, CenteredContent } from "../../components/slides";

export default function Slide13() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="4xl">
        <div className="bg-white/40 rounded-xl p-8">
          <Image
            src="/tweet.png"
            alt="Tweet about ChatGPT and universal human experiences"
            width={800}
            height={600}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
      </CenteredContent>
      
      {/* Source at bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <a 
          href="https://twitter.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-body text-sm text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center"
        >
          Social Media Post
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </SlideLayout>
  );
}