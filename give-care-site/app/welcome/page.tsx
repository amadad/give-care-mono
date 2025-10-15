import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserByStripeCustomerId } from '@/lib/supabase-server'
import { retrieveCheckoutSession } from '@/lib/stripe-edge'
import Link from 'next/link'

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Welcome to GiveCare',
}

interface WelcomePageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  // Get session_id from URL query params
  const { session_id } = await searchParams

  if (!session_id) {
    // No session ID provided - redirect to signup
    redirect('/signup')
  }

  try {
    // Verify the session with Stripe
    const session = await retrieveCheckoutSession(session_id)

    if (!session || session.payment_status !== 'paid') {
      // Invalid or unpaid session - redirect to signup
      redirect('/signup')
    }

    // Get customer ID from session
    const customerId = session.customer as string

    // Fetch user data from Supabase
    const user = await getUserByStripeCustomerId(customerId)

    // Get user's name or fallback to generic greeting
    const userName = user?.first_name || 'there'

    return (
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold">🎉 Welcome to GiveCare, {userName}!</h1>
          <p className="mt-4 text-lg">
            Your subscription is now active. Check your phone for a welcome message shortly.
          </p>

          <div className="mt-8 rounded-xl border border-base-300 bg-base-200 p-6 text-left">
            <h2 className="text-xl font-semibold">What happens next?</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-6">
              <li>You'll receive a personalized welcome message via SMS</li>
              <li>We'll ask about your caregiving situation</li>
              <li>We'll create your personalized support plan</li>
              <li>Daily check-ins begin based on your needs</li>
            </ol>
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-sm text-base-content/70">
              Having trouble? Make sure you have SMS enabled on your phone.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/" className="btn btn-primary">
                Go to Homepage
              </Link>
              <Link href="/how-it-works" className="btn btn-outline">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  } catch (error) {
    console.error('Error verifying session:', error)
    // On error, redirect to signup
    redirect('/signup')
  }
}

