'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'convex/react';
import { api } from 'give-care-app/convex/_generated/api';
import { BSFC_SHORT_QUESTIONS, SCALE_OPTIONS, identifyPressureZones } from '@/lib/bsfc';

export default function AssessmentQuestions() {
  const router = useRouter();
  const submitAssessment = useAction(api.functions.assessmentResults.submit);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<number[]>([]);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = BSFC_SHORT_QUESTIONS[currentQuestionIndex];
  const progress = useMemo(() => {
    return showEmailCapture
      ? 100
      : ((currentQuestionIndex + 1) / BSFC_SHORT_QUESTIONS.length) * 100;
  }, [currentQuestionIndex, showEmailCapture]);

  const handleAnswer = useCallback((value: number) => {
    const newResponses = [...responses, value];
    setResponses(newResponses);
    setError(null);

    if (currentQuestionIndex < BSFC_SHORT_QUESTIONS.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, show email capture
      setShowEmailCapture(true);
    }
  }, [responses, currentQuestionIndex]);

  const handleBack = useCallback(() => {
    setError(null);
    if (showEmailCapture) {
      // Go back from email capture to last question
      setShowEmailCapture(false);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setResponses(responses.slice(0, -1));
    }
  }, [showEmailCapture, currentQuestionIndex, responses]);

  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate pressure zones before submission
      const pressureZones = identifyPressureZones(responses);

      // Store in Convex database
      await submitAssessment({
        email,
        responses,
        pressureZones
      });

      // Send email with results
      const emailResponse = await fetch('/api/assessment/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          responses,
          pressureZones
        })
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      // Redirect to thank you page
      router.push(`/assessment/results?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError(err instanceof Error ? err.message : 'There was an error submitting your assessment. Please try again.');
      setIsSubmitting(false);
    }
  }, [email, responses, submitAssessment, router]);

  return (
    <>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-amber-950 mb-2">
            <span>
              {showEmailCapture
                ? 'Assessment Complete'
                : `Question ${currentQuestionIndex + 1} of ${BSFC_SHORT_QUESTIONS.length}`}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-amber-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card OR Email Capture */}
        {!showEmailCapture ? (
          <div className="bg-white border border-amber-100 rounded-xl p-8 shadow-lg mb-6">
            <div className="mb-8">
              <h2 className="text-3xl font-serif text-amber-950 mb-4">
                {currentQuestion.text}
              </h2>
              <p className="text-sm text-amber-700">
                How much do you agree with this statement?
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {SCALE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  disabled={isSubmitting}
                  className="w-full btn btn-lg bg-white hover:bg-amber-50 border-2 border-amber-200 hover:border-amber-400 text-amber-950 text-left justify-start normal-case font-normal transition-all"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-medium text-amber-950">
                      {option.value}
                    </span>
                    <span>{option.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-amber-100 rounded-xl p-8 shadow-lg mb-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-3xl font-serif text-amber-950 mb-4">
                Assessment Complete!
              </h2>
              <p className="text-lg text-amber-950 mb-2">
                Enter your email to receive your complete results
              </p>
              <p className="text-sm text-amber-700">
                We'll send you your burden score, interpretation, top pressure zones, and personalized strategies.
              </p>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit}>
              {error && (
                <div className="alert alert-error bg-red-50 border-2 border-red-200 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-red-600 shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-900">{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="btn btn-sm btn-ghost text-red-900"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              <div className="mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  disabled={isSubmitting}
                  className="input input-lg w-full text-amber-950 bg-white border-2 border-amber-200 focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-lg w-full bg-amber-950 text-white hover:bg-amber-900 border-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Sending Results...
                  </>
                ) : (
                  'Get My Results'
                )}
              </button>
            </form>

            <p className="text-xs text-amber-700 text-center mt-4">
              🔒 We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={(currentQuestionIndex === 0 && !showEmailCapture) || isSubmitting}
            className="btn btn-ghost text-amber-950 hover:bg-amber-50 disabled:opacity-30"
          >
            ← Back
          </button>

          <div className="text-sm text-amber-700">
            {showEmailCapture ? (
              <span>One last step!</span>
            ) : currentQuestionIndex === BSFC_SHORT_QUESTIONS.length - 1 ? (
              <span>Last question!</span>
            ) : (
              <span>{BSFC_SHORT_QUESTIONS.length - currentQuestionIndex - 1} remaining</span>
            )}
          </div>
        </div>

          {/* Footer Note */}
          <div className="mt-12 text-center text-xs text-amber-700">
            <p>Your responses are confidential and will only be used to calculate your burden score.</p>
          </div>
        </div>
      </div>
    </>
  );
}
