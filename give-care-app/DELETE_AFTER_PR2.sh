#!/bin/bash
# Deletion Script for PR 2 Cleanup
# Run this AFTER consolidating all imports and ensuring tests pass
# This script deletes all legacy files that have been merged into the new structure

set -e  # Exit on error

echo "🗑️  PR 2 Cleanup: Deleting legacy files..."
echo ""

# Check we're in the right directory
if [ ! -f "convex/schema.ts" ]; then
  echo "❌ Error: Must run from give-care-app root"
  exit 1
fi

echo "Deleting agents/ directory (3 files merged into agents.ts)..."
rm -rf convex/agents/main.ts
rm -rf convex/agents/crisis.ts
rm -rf convex/agents/assessment.ts
rmdir convex/agents/ 2>/dev/null || true

echo "Deleting workflows/ directory (2 files merged into workflows.ts)..."
rm -rf convex/workflows/crisis.ts
rm -rf convex/workflows/crisisSteps.ts
rmdir convex/workflows/ 2>/dev/null || true

echo "Deleting model/ directory (6 shim files, logic in core.ts)..."
rm -rf convex/model/users.ts
rm -rf convex/model/context.ts
rm -rf convex/model/messages.ts
rm -rf convex/model/subscriptions.ts
rm -rf convex/model/logs.ts
rm -rf convex/model/triggers.ts
rmdir convex/model/ 2>/dev/null || true

echo "Deleting internal/ directory (5 files, merged into internal.ts)..."
rm -rf convex/internal/metrics.ts
rm -rf convex/internal/onboarding.ts
rm -rf convex/internal/scheduler.ts
rm -rf convex/internal/seed.ts
rm -rf convex/internal/threads.ts
rmdir convex/internal/ 2>/dev/null || true

echo "Deleting functions/ files (consolidated into new structure)..."
rm -rf convex/functions/context.ts          # → public.ts
rm -rf convex/functions/billing.ts          # → billing.ts
rm -rf convex/functions/inbound.ts          # → inbound.ts
rm -rf convex/functions/inboundActions.ts   # → inbound.ts
rm -rf convex/functions/resources.ts        # → resources.ts
rm -rf convex/functions/admin.ts            # → internal.ts
rm -rf convex/functions/analytics.ts        # → internal.ts
rm -rf convex/functions/watchers.ts         # → internal.ts
rm -rf convex/functions/scheduler.ts        # → internal.ts
rm -rf convex/functions/wellness.ts         # → internal.ts
rm -rf convex/functions/interventions.ts    # → internal.ts
rm -rf convex/functions/logs.ts             # → internal.ts
rm -rf convex/functions/memory.ts           # → internal.ts
rm -rf convex/functions/messages.ts         # → internal.ts
rm -rf convex/functions/users.ts            # → internal.ts
rm -rf convex/functions/assessmentResults.ts # → internal.ts
rm -rf convex/functions/newsletterActions.ts # → internal.ts
rm -rf convex/functions/email.ts            # → internal.ts
rm -rf convex/functions/alerts.ts           # → internal.ts
rm -rf convex/functions/manualLinkSubscription.ts # → internal.ts
rm -rf convex/functions/assessments.ts      # → internal.ts or public.ts

# Check if functions/ is empty, then remove
if [ -z "$(ls -A convex/functions 2>/dev/null)" ]; then
  rmdir convex/functions/ 2>/dev/null || true
fi

echo "Deleting other legacy files..."
rm -rf convex/stripe.ts          # → billing.ts
rm -rf convex/lib/maps.ts        # → resources.ts

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Files remaining should be:"
echo "  - schema.ts, convex.config.ts, crons.ts, http.ts"
echo "  - public.ts, core.ts"
echo "  - agents.ts, workflows.ts"
echo "  - billing.ts, resources.ts, inbound.ts, internal.ts"
echo "  - lib/* (prompts, usage, types, etc.)"
echo ""
echo "⚠️  IMPORTANT: Run 'npm test' to verify nothing broke!"
