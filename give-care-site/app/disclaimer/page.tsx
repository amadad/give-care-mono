import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Medical Disclaimer & Privacy Information',
  description: 'Important information about GiveCare services, medical disclaimers, and data privacy practices.',
}

export default function DisclaimerPage() {
  return (
    <div className="bg-base-100">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="heading-hero mb-12">Disclaimer & Privacy</h1>

        {/* Medical Disclaimer */}
        <section className="mb-16">
          <h2 className="heading-section mb-6">Medical Disclaimer</h2>

          <div className="prose prose-lg max-w-none space-y-4">
            <p className="text-lg">
              The information and assessments provided by GiveCare are for <strong>informational and educational purposes only</strong> and do not constitute medical advice, diagnosis, or treatment.
            </p>

            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold">In Case of Emergency</h3>
                <div className="text-sm">
                  If you are experiencing a mental health crisis, please contact:
                  <ul className="mt-2 space-y-1">
                    <li><strong>988 Suicide & Crisis Lifeline</strong> - Dial 988</li>
                    <li><strong>Emergency Services</strong> - Dial 911</li>
                    <li><strong>Crisis Text Line</strong> - Text HOME to 741741</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-4">Not a Substitute for Professional Care</h3>
            <p>
              GiveCare is designed to provide support and resources for family caregivers, but it does not replace professional medical, mental health, or clinical advice. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">Use of Assessments</h3>
            <p>
              Our burnout and stress assessments are screening tools based on validated instruments, but they are not diagnostic tools. Results should be discussed with a qualified healthcare professional who can provide proper evaluation and treatment recommendations.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">No Patient-Provider Relationship</h3>
            <p>
              Use of GiveCare services does not create a patient-provider or therapist-client relationship. Our AI-powered support system provides information and coping strategies but does not provide therapy, counseling, or clinical treatment.
            </p>
          </div>
        </section>

        {/* Privacy & Data Section */}
        <section className="mb-16">
          <h2 className="heading-section mb-6">Privacy & Your Data</h2>

          <div className="prose prose-lg max-w-none space-y-4">
            <h3 className="text-xl font-semibold mb-4">HIPAA Compliance</h3>
            <p>
              GiveCare is <strong>not a HIPAA-covered entity</strong>. We do not bill insurance, we are not healthcare providers, and we do not create or maintain protected health information (PHI) as defined by HIPAA regulations.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">What We Collect</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Phone number (for SMS delivery)</li>
              <li>Assessment responses and scores</li>
              <li>Conversation history with our AI assistant</li>
              <li>Usage patterns and preferences</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">How We Protect Your Data</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>End-to-end encryption for all messages</li>
              <li>Secure cloud infrastructure (Convex, Cloudflare)</li>
              <li>Limited data retention (messages deleted after 90 days)</li>
              <li>No selling or sharing of personal information with third parties</li>
              <li>Regular security audits and updates</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Request deletion of your data at any time</li>
              <li>Export your conversation history and assessment results</li>
              <li>Opt out of data collection (limited functionality)</li>
              <li>Cancel your subscription without penalty</li>
            </ul>

            <div className="alert alert-info mt-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>
                For full privacy details, see our <a href="/privacy" className="link underline font-medium">Privacy Policy</a>.
                For terms of use, see our <a href="/terms" className="link underline font-medium">Terms of Service</a>.
              </span>
            </div>
          </div>
        </section>

        {/* AI Disclosure */}
        <section className="mb-16">
          <h2 className="heading-section mb-6">AI-Powered Service</h2>

          <div className="prose prose-lg max-w-none space-y-4">
            <p>
              GiveCare uses artificial intelligence (AI) and large language models (LLMs) to provide personalized support and recommendations. While we use advanced AI technology:
            </p>

            <ul className="list-disc list-inside space-y-2">
              <li>AI responses may contain errors or inaccuracies</li>
              <li>AI cannot replace human judgment or professional expertise</li>
              <li>We actively monitor and improve AI outputs for safety and quality</li>
              <li>Conversations are reviewed to prevent harmful or inappropriate content</li>
            </ul>

            <p className="mt-4">
              If you receive concerning or inappropriate content, please contact us immediately at <a href="mailto:support@givecareapp.com" className="link underline font-medium">support@givecareapp.com</a>.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="heading-section mb-6">Questions?</h2>
          <p className="text-lg">
            If you have questions about this disclaimer, our privacy practices, or data handling, please contact us:
          </p>
          <div className="mt-4 space-y-2">
            <p><strong>Email:</strong> <a href="mailto:support@givecareapp.com" className="link underline font-medium">support@givecareapp.com</a></p>
            <p><strong>Privacy:</strong> <a href="mailto:privacy@givecareapp.com" className="link underline font-medium">privacy@givecareapp.com</a></p>
          </div>
        </section>

        <div className="text-sm text-base-content/60 mt-12 pt-8 border-t border-base-300">
          Last updated: November 7, 2024
        </div>
      </div>
    </div>
  )
}
