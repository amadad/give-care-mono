import type { Metadata } from 'next'
import SignupHero from './SignupHero';

export const metadata: Metadata = {
  title: 'Sign Up - Get the Support You Deserve | GiveCare',
  description: 'Join GiveCare today. Text-based support for family caregivers starts immediately. No app required, works on any phone. Cancel anytime.',
  openGraph: {
    title: 'Sign Up for GiveCare - Caregiver Support via Text',
    description: 'Get personalized caregiver support through text messages. Track your capacity, get matched help, and receive proactive check-ins.',
    type: 'website',
    url: 'https://www.givecareapp.com/signup',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'GiveCare - Caregiver Support',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up for GiveCare',
    description: 'Get personalized caregiver support through text messages.',
    images: ['/og.png'],
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

