#!/bin/bash
# Production Verification Script for GiveCare

set -e

echo "=== GiveCare Production Verification ==="
echo ""

# Check Convex deployment
echo "1. Checking Convex deployments..."
cd give-care-app
npx convex status 2>/dev/null || echo "  ⚠️  Run 'npx convex deploy' to create prod deployment"
echo ""

# Check environment variables
echo "2. Checking production environment variables..."
npx convex env list 2>/dev/null | grep -E "OPENAI|TWILIO|STRIPE" || echo "  ⚠️  Missing environment variables"
echo ""

# Check deployed functions
echo "3. Verifying deployed functions..."
npx convex run --yes internal/users:getAllUsers 2>/dev/null && echo "  ✅ Backend functions working" || echo "  ❌ Backend functions not accessible"
echo ""

# Check webhooks
echo "4. Production webhook endpoints:"
PROD_URL=$(cat .env.local | grep CONVEX_DEPLOYMENT | cut -d'=' -f2 | cut -d':' -f2 | xargs)
if [ ! -z "$PROD_URL" ]; then
  echo "  📥 Twilio SMS: https://$PROD_URL.convex.site/twilio/incoming-message"
  echo "  💳 Stripe: https://$PROD_URL.convex.site/stripe/webhook"
else
  echo "  ⚠️  Production URL not configured"
fi
echo ""

# Check frontend deployments
echo "5. Frontend deployment status:"
cd ../give-care-site
echo "  Marketing site: $(grep NEXT_PUBLIC_CONVEX_URL .env.local 2>/dev/null || echo 'Not configured')"
cd ../give-care-admin
echo "  Admin dashboard: $(grep VITE_CONVEX_URL .env.local 2>/dev/null || echo 'Not configured')"
echo ""

echo "=== Next Steps ==="
echo "1. Deploy backend: cd give-care-app && npx convex deploy"
echo "2. Set env vars: npx convex env set OPENAI_API_KEY 'your-key'"
echo "3. Update Twilio webhook: https://YOUR-PROD-URL.convex.site/twilio/incoming-message"
echo "4. Update Stripe webhook: https://YOUR-PROD-URL.convex.site/stripe/webhook"
echo "5. Deploy frontends to Vercel/hosting"
