import { SlideLayout, CenteredContent, SlideBody } from "../../components/slides";

export default function Slide11() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="4xl">
        <blockquote className="font-body text-3xl leading-tight fade-in text-center text-amber-900">
          <SlideBody className="mb-lg text-3xl text-amber-900">"Care doesn't really scale without becoming something else."</SlideBody>
          <footer className="font-heading text-xl text-amber-900">
            — Steven Scrawls
          </footer>
        </blockquote>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <a 
            href="https://stevenscrawls.com/care-doesnt-scale/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-body text-sm hover:underline inline-flex items-center text-amber-900"
          >
            Care Doesn't Scale
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </CenteredContent>
    </SlideLayout>
  );
}
