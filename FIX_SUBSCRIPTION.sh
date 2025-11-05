#!/bin/bash

# Fix Subscription Status Script
# This calls the deployed fixUserSubscription mutation

echo "🔧 Fixing subscription status..."
echo ""
echo "⚠️  IMPORTANT: Replace YOUR_PHONE_NUMBER below with your actual phone"
echo "    Format: +1XXXXXXXXXX (include country code)"
echo ""

# REPLACE THIS with your actual phone number
PHONE_NUMBER="+15162382932"

cd /Users/amadad/Projects/givecare/give-care-app

# Call the mutation using Convex CLI (JSON format)
npx convex run subscriptions:fixUserSubscription "{\"phoneNumber\":\"$PHONE_NUMBER\",\"subscriptionStatus\":\"active\"}"

echo ""
echo "✅ Done! Now test by texting: +1 (888) 966-8985"
echo "   Send: 'Hi'"
echo ""
echo "📋 Watch logs: npx convex logs --watch"
