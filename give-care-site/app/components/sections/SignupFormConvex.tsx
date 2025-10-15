"use client"

import React, { useMemo, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { usePhoneFormat } from "@/app/hooks/usePhoneFormat"
import { useAction } from "convex/react"
import { api } from "give-care-app/convex/_generated/api"

type PlanType = "monthly" | "annual"

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

// Only initialize Stripe if the key is available
const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null

// Stripe Price IDs from environment (required - no defaults to prevent prod/staging mixups)
const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
const ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID

if (!MONTHLY_PRICE_ID || !ANNUAL_PRICE_ID) {
  console.error("[Stripe] Missing price IDs: Set NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID and NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID")
}

export function SignupFormConvex() {
  const [plan, setPlan] = useState<PlanType>("monthly")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const phone = usePhoneFormat("")
  const [consentSms, setConsentSms] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Convex action to create checkout session
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession)

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 1 &&
      /.+@.+\..+/.test(email) &&
      phone.value.replace(/\D/g, "").length >= 10 &&
      consentSms &&
      consentTerms &&
      !loading
    )
  }, [name, email, phone.value, consentSms, consentTerms, loading])

  async function startCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    try {
      setLoading(true)
      setError(null)

      // Get E.164 formatted phone number
      const phoneE164 = phone.getE164()

      // Get price ID based on plan
      const priceId = plan === "monthly" ? MONTHLY_PRICE_ID : ANNUAL_PRICE_ID

      // Fail fast if price IDs are not configured
      if (!priceId) {
        throw new Error(`Missing Stripe price ID for ${plan} plan. Check environment configuration.`)
      }

      console.log('[SignupForm] Creating checkout session...', {
        fullName: name,
        email,
        phoneNumber: phoneE164,
        priceId,
      })

      // Call Convex action to create checkout session
      const checkoutUrl = await createCheckoutSession({
        fullName: name,
        email,
        phoneNumber: phoneE164,
        priceId,
      })

      console.log('[SignupForm] Checkout URL received:', checkoutUrl)

      if (!checkoutUrl) {
        throw new Error('Failed to create checkout session')
      }

      // Instead of clientSecret, we now redirect to Stripe hosted page
      // Or if using embedded checkout, extract the client_secret from the URL
      // For now, let's redirect to the Stripe checkout URL
      window.location.href = checkoutUrl

    } catch (err: unknown) {
      console.error('[SignupForm] Error:', err)
      const errorMessage = err instanceof Error ? err.message : "Failed to start checkout"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen lg:min-h-0">
      {/* Form Section - Left Half */}
      <div className="bg-base-100 p-6 lg:p-12 flex flex-col justify-center">
        <div className="max-w-xl mx-auto w-full">
          <form onSubmit={startCheckout} className="space-y-6">
            {/* Contact Information Fieldset */}
            <fieldset className="fieldset border border-base-300 rounded-box p-4 lg:p-6">
              <legend className="fieldset-legend bg-base-100 px-2">Contact Information</legend>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Full Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-white focus:outline-none focus:border-primary"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Email Address</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full bg-white focus:outline-none focus:border-primary"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Phone Number</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered w-full bg-white focus:outline-none focus:border-primary"
                  placeholder="(555) 123-4567"
                  value={phone.value}
                  onChange={(e) => phone.setValue(e.target.value)}
                  required
                />
              </div>
            </fieldset>

            {/* Plan Selection Fieldset */}
            <fieldset className="fieldset border border-base-300 rounded-box p-4 lg:p-6">
              <legend className="fieldset-legend bg-base-100 px-2">Choose Your Plan</legend>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className={`card cursor-pointer transition-colors ${
                  plan === "monthly" ? "bg-primary text-primary-content" : "bg-base-200 hover:bg-base-300"
                }`} onClick={() => setPlan("monthly")}>
                  <div className="card-body py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="card-title text-sm">Monthly</h3>
                        <div className="text-base font-bold">$9.99</div>
                        <div className="text-sm opacity-70">per month</div>
                      </div>
                      <input
                        type="radio"
                        className="radio radio-primary"
                        name="plan"
                        checked={plan === "monthly"}
                        onChange={() => setPlan("monthly")}
                      />
                    </div>
                  </div>
                </div>

                <div className={`card cursor-pointer relative transition-colors ${
                  plan === "annual" ? "bg-primary text-primary-content" : "bg-base-200 hover:bg-base-300"
                }`} onClick={() => setPlan("annual")}>
                  <div className="badge badge-secondary absolute -top-2 -right-2">Save $20</div>
                  <div className="card-body py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="card-title text-sm">Annual</h3>
                        <div className="text-base font-bold">$99</div>
                        <div className="text-sm opacity-70">$8.25/month</div>
                      </div>
                      <input
                        type="radio"
                        className="radio radio-primary"
                        name="plan"
                        checked={plan === "annual"}
                        onChange={() => setPlan("annual")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Terms & Conditions Fieldset */}
            <fieldset className="fieldset border border-base-300 rounded-box p-4 lg:p-6">
              <legend className="fieldset-legend bg-base-100 px-2">Terms & Conditions</legend>

              <div className="space-y-4 mt-4">
                <div className="form-control">
                  <label className="cursor-pointer flex items-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary mr-3 mt-1 flex-shrink-0"
                      checked={consentSms}
                      onChange={(e) => setConsentSms(e.target.checked)}
                    />
                    <span className="label-text flex-1">I agree to receive text messages from GiveCare for caregiving support and updates.</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="cursor-pointer flex items-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary mr-3 mt-1 flex-shrink-0"
                      checked={consentTerms}
                      onChange={(e) => setConsentTerms(e.target.checked)}
                    />
                    <span className="label-text flex-1">I agree to the <a href="/terms" className="link">Terms of Service</a> and <a href="/privacy" className="link">Privacy Policy</a>.</span>
                  </label>
                </div>
              </div>
            </fieldset>

            {/* Submit Button - Matches form width */}
            <button
              className={`btn btn-block btn-lg ${
                canSubmit ? "btn-primary" : "btn-disabled"
              }`}
              disabled={!canSubmit}
              type="submit"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Processing...
                </>
              ) : (
                "Continue to Secure Payment →"
              )}
            </button>
            {error && (
              <div className="alert alert-error mt-4">
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Image Section - Right Half */}
      <div className="bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden min-h-[300px] lg:min-h-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-orange-400/10 to-emerald-400/10"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-primary/20">
            <div className="text-8xl mb-4">🤗</div>
            <div className="text-2xl font-bold">Caring Together</div>
          </div>
        </div>

        {/* Stripe Checkout Overlay */}
        {clientSecret && (
          <div className="absolute inset-0 bg-base-100 p-4 lg:p-8 flex items-center justify-center">
            <div className="w-full max-w-lg">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret }}
              >
                <div className="min-h-[500px] rounded-lg" data-testid="stripe-checkout">
                  <EmbeddedCheckout />
                </div>
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
