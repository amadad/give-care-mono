import { FaHandshake } from 'react-icons/fa';

export default function CTASection() {
  return (
    <section className="w-full py-16 bg-amber-50">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaHandshake className="h-8 w-8 text-amber-700" />
          </div>
          
          <h2 className="text-3xl font-bold mb-6 text-amber-900">Let's Amplify Care Together</h2>
          
          <p className="text-lg text-amber-800/90 mb-8">
            We're inviting advocacy groups into our early-access program to co-design features and measure impact.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://cal.com/amadad/givecare?overlayCalendar=true" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary btn-lg px-8 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Schedule a 15-Min Call
              <FaHandshake className="ml-2 h-4 w-4" />
            </a>
            <a 
              href="mailto:partners@givecareapp.com?subject=Advocacy Partnership Inquiry" 
              className="btn btn-outline btn-lg text-amber-800 border-amber-800 hover:bg-amber-50 hover:border-amber-700 hover:text-amber-900 font-medium"
            >
              Email the Team
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
