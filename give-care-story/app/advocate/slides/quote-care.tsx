export default function Slide11() {
  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl text-center">
        <blockquote className="font-body text-3xl leading-tight text-amber-900 fade-in">
          <p className="mb-lg">"Care doesn't really scale without becoming something else."</p>
          <footer className="font-heading text-xl text-amber-800">
            — Steven Scrawls
          </footer>
        </blockquote>
      </div>
      
      {/* Source at bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <a 
          href="https://stevenscrawls.com/care-doesnt-scale/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-body text-sm text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center"
        >
          Care Doesn't Scale
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
