"use client"

import React, { useMemo, useState } from "react"
import { usePhoneFormat } from "@/app/hooks/usePhoneFormat"
import { useAction } from "convex/react"
import { api } from "give-care-app/convex/_generated/api"

type PlanType = "monthly" | "annual"

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
  const [consentDisclaimer, setConsentDisclaimer] = useState(false)
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
      consentDisclaimer &&
      !loading
    )
  }, [name, email, phone.value, consentSms, consentTerms, consentDisclaimer, loading])

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

      // Log non-PII data only in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[SignupForm] Creating checkout session...', {
          priceId,
          hasName: !!name,
          hasEmail: !!email,
          hasPhone: !!phoneE164,
        })
      }

      // Call Convex action to create checkout session
      const checkoutUrl = await createCheckoutSession({
        fullName: name,
        email,
        phoneNumber: phoneE164,
        priceId,
      })

      // Don't log URLs that might contain tokens
      if (process.env.NODE_ENV === 'development') {
        console.log('[SignupForm] Checkout session created successfully')
      }

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
    <div className="w-full max-w-lg mx-auto">
      <form onSubmit={startCheckout} className="space-y-4 sm:space-y-6">
        {/* Contact Information - Minimal Design */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-light text-amber-950 mb-2">
              Full Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white border border-amber-200 rounded-lg text-base text-amber-950 placeholder:text-amber-500 focus:outline-none focus:border-amber-700 transition-colors"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-light text-amber-950 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-white border border-amber-200 rounded-lg text-base text-amber-950 placeholder:text-amber-500 focus:outline-none focus:border-amber-700 transition-colors"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label className="block text-sm font-light text-amber-950 mb-2">
              Mobile Phone Number
            </label>
            <input
              type="tel"
              className="w-full px-4 py-3 bg-white border border-amber-200 rounded-lg text-base text-amber-950 placeholder:text-amber-500 focus:outline-none focus:border-amber-700 transition-colors"
              placeholder="(555) 123-4567"
              value={phone.value}
              onChange={(e) => phone.setValue(e.target.value)}
              required
              autoComplete="tel"
              inputMode="tel"
            />
            <p className="text-xs text-amber-950/60 mt-1">
              We'll text you at this number for caregiving support
            </p>
          </div>
        </div>

        {/* Plan Selection - Proper Radio Group */}
        <fieldset className="space-y-2 sm:space-y-3">
          <legend className="block text-sm font-light text-amber-950 mb-2">
            Choose Your Plan
          </legend>

          <div className="grid grid-cols-2 gap-2 sm:gap-3" role="radiogroup" aria-label="Subscription plan">
            {/* Monthly Plan */}
            <label
              className={`w-full p-3 sm:p-4 border rounded-lg text-left transition-all cursor-pointer ${
                plan === "monthly"
                  ? "border-amber-950 bg-amber-50"
                  : "border-amber-200 bg-white hover:border-amber-300"
              }`}
            >
              <input
                type="radio"
                name="plan"
                value="monthly"
                checked={plan === "monthly"}
                onChange={(e) => setPlan(e.target.value as PlanType)}
                className="sr-only"
                aria-label="Monthly plan, $9.99 per month"
              />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-light text-amber-900">Monthly</div>
                  <div className="text-lg font-serif text-amber-900 mt-1">$9.99<span className="text-sm font-light text-amber-700">/month</span></div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  plan === "monthly" ? "border-amber-950" : "border-amber-300"
                }`} aria-hidden="true">
                  {plan === "monthly" && (
                    <div className="w-3 h-3 rounded-full bg-amber-950" />
                  )}
                </div>
              </div>
            </label>

            {/* Annual Plan */}
            <label
              className={`w-full p-3 sm:p-4 border rounded-lg text-left transition-all cursor-pointer relative ${
                plan === "annual"
                  ? "border-amber-950 bg-amber-50"
                  : "border-amber-200 bg-white hover:border-amber-300"
              }`}
            >
              <input
                type="radio"
                name="plan"
                value="annual"
                checked={plan === "annual"}
                onChange={(e) => setPlan(e.target.value as PlanType)}
                className="sr-only"
                aria-label="Annual plan, $99 per year, saves $20"
              />
              <span className="absolute -top-2 right-3 px-2 py-0.5 bg-amber-950 text-white text-xs rounded-full" aria-hidden="true">
                Save $20
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-light text-amber-900">Annual</div>
                  <div className="text-lg font-serif text-amber-900 mt-1">$99<span className="text-sm font-light text-amber-700">/year</span></div>
                  <div className="text-xs text-amber-700 mt-0.5">$8.25/month</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  plan === "annual" ? "border-amber-950" : "border-amber-300"
                }`} aria-hidden="true">
                  {plan === "annual" && (
                    <div className="w-3 h-3 rounded-full bg-amber-950" />
                  )}
                </div>
              </div>
            </label>
          </div>
        </fieldset>

        {/* Terms & Conditions - CTIA Compliant */}
        <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
          <label htmlFor="consent-sms" className="flex items-start gap-3 cursor-pointer">
            <input
              id="consent-sms"
              type="checkbox"
              className="mt-1 w-5 h-5 rounded border-2 border-amber-300 text-amber-950 focus:ring-2 focus:ring-amber-700 focus:ring-offset-0 accent-amber-950"
              checked={consentSms}
              onChange={(e) => setConsentSms(e.target.checked)}
              required
              aria-describedby="sms-consent-details"
            />
            <span className="text-sm font-light text-amber-900 leading-relaxed">
              <span id="sms-consent-details">
                I agree to receive text messages from GiveCare for support and updates. Message frequency varies. Message & data rates may apply. Text STOP to opt out, HELP for help.
              </span>
            </span>
          </label>

          <label htmlFor="consent-terms" className="flex items-start gap-3 cursor-pointer">
            <input
              id="consent-terms"
              type="checkbox"
              className="mt-1 w-5 h-5 rounded border-2 border-amber-300 text-amber-950 focus:ring-2 focus:ring-amber-700 focus:ring-offset-0 accent-amber-950"
              checked={consentTerms}
              onChange={(e) => setConsentTerms(e.target.checked)}
              required
            />
            <span className="text-sm font-light text-amber-900 leading-relaxed">
              I agree to the <a href="/terms" onClick={(e) => e.stopPropagation()} className="underline hover:text-amber-950 transition-colors">Terms of Service</a> and <a href="/privacy" onClick={(e) => e.stopPropagation()} className="underline hover:text-amber-950 transition-colors">Privacy Policy</a>.
            </span>
          </label>

          <label htmlFor="consent-disclaimer" className="flex items-start gap-3 cursor-pointer">
            <input
              id="consent-disclaimer"
              type="checkbox"
              className="mt-1 w-5 h-5 rounded border-2 border-amber-300 text-amber-950 focus:ring-2 focus:ring-amber-700 focus:ring-offset-0 accent-amber-950"
              checked={consentDisclaimer}
              onChange={(e) => setConsentDisclaimer(e.target.checked)}
              required
            />
            <span className="text-sm font-light text-amber-900 leading-relaxed">
              I understand this service provides information only, not medical advice. For emergencies, I will call 988 or 911. <a href="/disclaimer" onClick={(e) => e.stopPropagation()} className="underline hover:text-amber-950 transition-colors">Read full disclaimer</a>.
            </span>
          </label>
        </div>

        {/* Submit Button - Accessible */}
        <div className="pt-3 sm:pt-4">
          <button
            type="submit"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            className={`w-full px-8 py-3 rounded-lg text-sm tracking-widest transition-all ${
              canSubmit
                ? "bg-amber-950 text-white hover:bg-amber-900"
                : "bg-amber-300 text-amber-700 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing</span>
              </span>
            ) : (
              "Continue to Secure Checkout"
            )}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Trust Indicators - Minimal */}
        <div className="flex items-center justify-center gap-6 pt-4 sm:pt-6 text-xs text-amber-900 font-light">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Cancel Anytime
          </span>
        </div>
      </form>
    </div>
  )
}
