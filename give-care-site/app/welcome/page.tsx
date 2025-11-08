'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";

function WelcomeContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Fetch session details to get phone number
    if (sessionId) {
      // For now, we'll skip the Stripe API call and just show a generic message
      // In the future, you could call Stripe API to get the actual phone number
    }
  }, [sessionId]);

  return (
    <section className="pt-4 sm:pt-6 md:pt-12 pb-4 md:pb-8 bg-base-100">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        {/* Success Badge */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-success/10 border border-success/20 rounded-full text-success text-sm font-medium mb-4">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Payment Successful
          </div>

          <h1 className="heading-hero mb-3 md:mb-4">
            Welcome to GiveCare
          </h1>

          <p className="text-base sm:text-lg md:text-xl font-serif font-light text-amber-700 leading-relaxed max-w-2xl mx-auto">
            Check your phone for next steps
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white border border-amber-200 rounded-lg p-6 sm:p-8 space-y-6">
          {/* What Happens Next */}
          <div>
            <h2 className="text-2xl font-light text-amber-950 mb-4">
              What happens next
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium text-amber-950">We've sent you a text message</p>
                  <p className="text-sm text-amber-950/70 mt-1">
                    Check the mobile number you entered during signup. You should receive a welcome text within a few minutes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-amber-950">Reply to get started</p>
                  <p className="text-sm text-amber-950/70 mt-1">
                    Simply reply to the text message to complete your setup and start your caregiving support journey.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-amber-950">24/7 support ready</p>
                  <p className="text-sm text-amber-950/70 mt-1">
                    Once setup is complete, you can text anytime for caregiving guidance, resources, and emotional support.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-amber-200"></div>

          {/* Troubleshooting */}
          <div>
            <h3 className="text-lg font-medium text-amber-950 mb-3">
              Haven't received the text?
            </h3>
            <div className="space-y-3 text-sm text-amber-950/70">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>
                  <strong className="text-amber-950">Wait a few minutes</strong> - Text messages can take 2-5 minutes to arrive
                </p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>
                  <strong className="text-amber-950">Check your spam/blocked messages</strong> - The message comes from an unknown number
                </p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>
                  <strong className="text-amber-950">Wrong number?</strong> Email us at{' '}
                  <a href="mailto:support@givecareapp.com" className="text-primary hover:underline">
                    support@givecareapp.com
                  </a>{' '}
                  with your correct mobile number and we'll update it
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Link href="/" className="btn-editorial-secondary w-full sm:w-auto">
              Return to Homepage
            </Link>
          </div>
        </div>

        {/* Additional Help */}
        <p className="text-center text-sm text-amber-950/50 mt-6">
          Questions? Email us at{' '}
          <a href="mailto:support@givecareapp.com" className="text-primary hover:underline">
            support@givecareapp.com
          </a>
        </p>
      </div>
    </section>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="pt-12 pb-8 bg-base-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-amber-950/70">Loading...</p>
        </div>
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  );
}
