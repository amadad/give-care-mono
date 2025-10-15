'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-base-100 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-amber-950 mb-4">
            Check Your Email
          </h1>
          <p className="text-xl text-amber-800">
            We just sent your complete assessment results to:
          </p>
          <p className="text-2xl font-medium text-amber-900 mt-2">
            {decodeURIComponent(email)}
          </p>
        </div>

        {/* What's in the Email */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-amber-100 mb-8">
          <h2 className="text-2xl font-serif text-amber-950 mb-6 text-center">
            What's in Your Results Email
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-amber-950 mb-1">Your Burden Score (0-30)</h3>
                <p className="text-sm text-amber-700">Complete breakdown with interpretation and severity band</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-amber-950 mb-1">Top 3 Pressure Zones</h3>
                <p className="text-sm text-amber-700">Physical, emotional, financial, social, or future concerns</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-amber-950 mb-1">Personalized Strategies</h3>
                <p className="text-sm text-amber-700">Evidence-based interventions matched to your specific needs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Didn't Receive It? */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-amber-950 mb-3">Didn't receive the email?</h3>
          <ul className="text-sm text-amber-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Check your spam or promotions folder</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Email may take a few minutes to arrive</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Add hello@my.givecareapp.com to your contacts</span>
            </li>
          </ul>
        </div>

        {/* Next Steps */}
        <div className="bg-white border-2 border-amber-200 rounded-2xl p-8 shadow-xl text-center">
          <h2 className="text-2xl font-serif mb-4 text-amber-900">
            Ready to Lower Your Burden Score?
          </h2>
          <p className="text-amber-800 mb-6 max-w-xl mx-auto">
            GiveCare provides weekly SMS check-ins, evidence-based strategies, and tracks your progress over time. Monitor changes and work toward reducing your burden score.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-sm font-semibold text-amber-900 mb-1">Special offer included in your email</p>
            <p className="text-xs text-amber-700">Check your results email for an exclusive discount code</p>
          </div>
          <a
            href="https://givecareapp.com/signup"
            className="btn btn-lg bg-amber-900 text-white hover:bg-amber-800 border-none mb-4"
          >
            Start Your Free Trial
          </a>
          <p className="text-xs text-amber-600">
            Credit card required · Cancel anytime
          </p>
        </div>

        {/* Citation */}
        <div className="text-center text-xs text-amber-700 mt-12 pt-8 border-t border-amber-200">
          <p>
            <strong>Based on the BSFC</strong> (Burden Scale for Family Caregivers) — a clinically validated
            tool developed by Erlangen University Hospital and used across Europe in 20 languages.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentResultsThankYou() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-amber-600"></div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
