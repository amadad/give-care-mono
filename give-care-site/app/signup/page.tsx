import type { Metadata } from 'next'
import SignupHero from './SignupHero';

export const metadata: Metadata = {
  title: 'Sign Up - Get the Support You Deserve | GiveCare',
  description: 'Join GiveCare today. Text-based support for family caregivers starts immediately. No app required, works on any phone. Cancel anytime.',
  openGraph: {
    title: 'Sign Up for GiveCare - Caregiver Support via Text',
    description: 'Get personalized caregiver support through text messages. Track your capacity, get matched help, and receive proactive check-ins.',
    type: 'website',
  },
}

export default function SignupPage() {
  return (
    <>
      <section id="main-content" className="bg-base-100">
        <SignupHero />
      </section>
    </>
  )
}

