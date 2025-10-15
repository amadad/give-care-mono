import React from 'react';
import { FaCalendarAlt, FaEnvelope } from 'react-icons/fa';

export default function CTASection() {
  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto bg-base-100 rounded-2xl shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-2/3 p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-900 mb-6">
                Ready to Reduce Burnout and After-Hours Calls?
              </h2>
              <p className="text-lg text-amber-800/90 mb-8 max-w-2xl">
                Join our exclusive pilot program and be among the first to experience how GiveCare can enhance your facility's care, streamline operations, and improve resident satisfaction.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-3 text-amber-800/90">
                    <span className="font-medium">Limited pilot cohort</span> opens July 2025
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-3 text-amber-800/90">
                    <span className="font-medium">Pilot-only pricing</span> for first 10 facilities
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-3 text-amber-800/90">
                    <span className="font-medium">Hands-on onboarding</span> and weekly check-ins
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://cal.com/amadad/givecare?overlayCalendar=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg flex-1 justify-center"
                >
                  <FaCalendarAlt className="mr-2" />
                  Book a 15-Min Demo
                </a>
                <a
                  href="mailto:hello@givecare.com?subject=Pilot Program Inquiry"
                  className="btn btn-outline btn-lg flex-1 justify-center"
                >
                  <FaEnvelope className="mr-2" />
                  Ask a Question
                </a>
              </div>
            </div>
            
            <div className="hidden md:block md:w-1/3 bg-gradient-to-br from-amber-600 to-amber-700 relative">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'url(\'data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M11 0l5 5H8l-3-5zM0 30h80v10H0zM11 50l-3 5h8l-5-5zm19 0l-3 5h8l-5-5zm19 0l-3 5h8l-5-5zM0 70h80v10H0zM11 30l-3 5h8l-5-5zm19 0l-3 5h8l-5-5zm19 0l-3 5h8l-5-5z\'/%3E%3C/g%3E%3C/svg%3E\')',
                backgroundSize: '200px 200px',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}></div>
              <div className="absolute inset-0 flex items-center justify-center p-8 text-white text-center">
                <div>
                  <div className="text-4xl font-serif font-bold mb-2">Limited Time</div>
                  <p className="text-amber-100 mb-6">Pilot program spots are filling fast</p>
                  <div className="h-1 bg-amber-400/30 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-amber-300 rounded-full" style={{width: '75%'}}></div>
                  </div>
                  <div className="text-sm text-amber-200">
                    Only 3 spots remaining for Q3 2023
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
