import Link from 'next/link';
import { Metadata } from 'next';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Free Caregiver Burden Assessment | GiveCare',
  description: 'Take the BSFC-s (Burden Scale for Family Caregivers) — a clinically validated 3-minute assessment. Get your burnout score and personalized support plan.',
};

export default function AssessmentIntro() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Navbar />
      <main className="flex-1 section-tight">
        <div className="container-editorial-narrow">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-light text-amber-950 mb-4">
              Find out how much you're carrying
            </h1>
            <p className="text-xl text-amber-700 font-light">
              Burden Scale for Family Caregivers
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <div className="text-sm font-medium text-amber-950">Takes 3 minutes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌍</div>
              <div className="text-sm font-medium text-amber-950">Used across Europe</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔬</div>
              <div className="text-sm font-medium text-amber-950">Clinically validated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <div className="text-sm font-medium text-amber-950">Completely confidential</div>
            </div>
          </div>

        {/* What to Expect */}
        <div className="card-editorial-lg mb-8">
          <h2 className="heading-subsection mb-6">What to expect:</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-medium text-amber-950">10 questions about your caregiving experience</div>
                <div className="text-sm text-amber-700">Simple agree/disagree format</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-medium text-amber-950">Immediate results with your burden score</div>
                <div className="text-sm text-amber-700">See where you fall on the 0-30 scale</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-medium text-amber-950">Personalized recommendations</div>
                <div className="text-sm text-amber-700">Evidence-based strategies matched to your top pressure zones</div>
              </div>
            </li>
          </ul>
        </div>

          {/* CTA */}
          <div className="text-center mb-8">
            <Link
              href="/assessment/questions"
              className="btn-editorial-primary"
            >
              Start Free Assessment
            </Link>
            <p className="text-sm text-amber-600 mt-4">
              Email required to see your results
            </p>
          </div>

          {/* Citation */}
          <div className="text-center text-sm text-amber-700 border-t border-amber-200 pt-6">
            <p>Developed by Elmar Graessel et al.</p>
            <p>© 2002–2014 Erlangen University Hospital</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
