import { SlideLayout, CenteredContent, SlideBody } from "../../components/slides";

export default function TraceyQuoteSlide() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="4xl">
        <div className="text-center">
          <div className="text-6xl mb-8 text-amber-900">"</div>
          <blockquote className="font-body text-2xl leading-relaxed mb-8 text-amber-900">
            It's such a good venting tool for me… It's kind of like journaling that I'm not gonna do. I can just spew and vent out loud…
          </blockquote>
          
          <div className="space-y-2">
            <SlideBody className="font-heading text-xl text-amber-900">Tracey</SlideBody>
            <SlideBody className="text-md text-amber-900">Caregiver</SlideBody>
            <SlideBody className="text-sm text-amber-900">San Antonio, TX</SlideBody>
          </div>
        </div>
      </CenteredContent>
    </SlideLayout>
  );
}