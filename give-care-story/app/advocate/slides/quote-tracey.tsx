export default function TraceyQuoteSlide() {
  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="text-6xl text-amber-700 mb-8">"</div>
          <blockquote className="font-body text-2xl leading-relaxed text-amber-900 mb-8">
            It's such a good venting tool for me… It's kind of like journaling that I'm not gonna do. I can just spew and vent out loud…
          </blockquote>
        </div>
        
        <div className="space-y-2">
          <p className="font-heading text-xl text-amber-900">Tracey</p>
          <p className="font-body text-md text-amber-700">Caregiver</p>
          <p className="font-body text-sm text-amber-600">San Antonio, TX</p>
        </div>
      </div>
    </div>
  );
}