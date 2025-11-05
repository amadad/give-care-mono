/**
 * Quick script to fix your subscription status
 *
 * Usage:
 * 1. Update YOUR_PHONE_NUMBER below (E.164 format: +1XXXXXXXXXX)
 * 2. Copy this entire file
 * 3. Go to https://dashboard.convex.dev/deployment/doting-tortoise-411
 * 4. Click Functions → Run a function
 * 5. Select "subscriptions:fixUserSubscription"
 * 6. Paste the args object below
 */

// REPLACE WITH YOUR ACTUAL PHONE NUMBER
const YOUR_PHONE_NUMBER = "+1XXX...2932" // Your phone ending in 2932

// Args to paste into Convex dashboard
const args = {
  phoneNumber: YOUR_PHONE_NUMBER,
  subscriptionStatus: "active" as const
}

console.log("Copy this JSON and paste into Convex dashboard:")
console.log(JSON.stringify(args, null, 2))

export const fixSubscriptionArgs = args
