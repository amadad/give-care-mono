# GiveCare Monorepo Integration Guide

## Architecture Overview

The GiveCare monorepo uses a **shared backend** architecture where:
- **give-care-app** = Convex backend (database, API, SMS handling, Stripe webhooks)
- **give-care-site** = Marketing website (Next.js) that connects to give-care-app's Convex backend
- **give-care-story** = Presentation system (standalone Next.js, no backend)

## How Convex Integration Works

### Shared Convex Backend

Both `give-care-app` and `give-care-site` connect to the **same Convex deployment**:

```
Convex Deployment: https://agreeable-lion-831.convex.cloud
Project: give-care-app
Team: givecare
```

### Integration Setup

#### 1. Workspace Dependency (package.json)

**give-care-site/package.json:**
```json
{
  "dependencies": {
    "convex": "^1.27.5",
    "give-care-app": "workspace:*"  // ✅ Links to give-care-app
  }
}
```

This allows `give-care-site` to import types from `give-care-app`:

```typescript
import { api } from "give-care-app/convex/_generated/api"
```

#### 2. Convex Client Provider

**give-care-site/app/providers/ConvexClientProvider.tsx:**
```typescript
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

#### 3. Environment Variables

**give-care-site/.env.local:**
```bash
# Convex connection
NEXT_PUBLIC_CONVEX_URL=https://agreeable-lion-831.convex.cloud

# Stripe (for checkout forms)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID=price_...
```

**give-care-app/.env.local:**
```bash
# Convex deployment
CONVEX_DEPLOYMENT=prod:agreeable-lion-831

# Stripe (for backend processing)
STRIPE_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=...
```

## Stripe Integration Flow

### User Signup Journey (give-care-site → give-care-app)

```
1. User visits givecareapp.com/signup
   ↓
2. Fills form: name, email, phone, plan selection
   ↓
3. SignupFormConvex.tsx calls Convex action:
   await createCheckoutSession({ fullName, email, phoneNumber, priceId })
   ↓
4. give-care-app/convex/stripe.ts creates Stripe checkout session
   ↓
5. User redirected to Stripe hosted checkout
   ↓
6. User completes payment
   ↓
7. Stripe sends webhook to give-care-app/convex/http.ts
   ↓
8. give-care-app updates user record + sends welcome SMS via Twilio
   ↓
9. User receives text: "Welcome to GiveCare! Reply to get started."
```

### Key Files

**Frontend (give-care-site):**
- `app/components/sections/SignupFormConvex.tsx` - Signup form component
- `app/providers/ConvexClientProvider.tsx` - Convex React provider
- `convex.json` - Points to give-care-app Convex deployment

**Backend (give-care-app):**
- `convex/stripe.ts` - Stripe checkout session creation
- `convex/http.ts` - Webhook endpoint for Stripe events
- `convex/functions/users.ts` - User management
- `convex/twilio.ts` - SMS message handler

## Shared Types via Workspace

The workspace dependency allows type-safe imports:

```typescript
// give-care-site can import from give-care-app
import { api } from "give-care-app/convex/_generated/api"
import type { Doc } from "give-care-app/convex/_generated/dataModel"

// Use Convex actions/queries/mutations
const checkoutUrl = await useAction(api.stripe.createCheckoutSession)({
  fullName: "John Doe",
  email: "john@example.com",
  phoneNumber: "+15551234567",
  priceId: "price_1234567890"
})
```

## Development Workflow

### Start Backend (give-care-app)
```bash
cd give-care-app
npx convex dev  # Starts Convex dev server + generates types
```

This generates `convex/_generated/` which includes:
- `api.ts` - Type-safe API references
- `dataModel.ts` - Database schema types
- `server.ts` - Server-side helpers

### Start Frontend (give-care-site)
```bash
cd give-care-site
pnpm dev  # Starts Next.js on port 3000
```

The frontend connects to Convex backend via `NEXT_PUBLIC_CONVEX_URL`.

## Deployment Architecture

### Convex Backend (give-care-app)
```bash
cd give-care-app
npx convex deploy --prod
```
Deploys to: https://agreeable-lion-831.convex.cloud

### Marketing Site (give-care-site)
```
Platform: Cloudflare Pages
Domain: givecareapp.com
Build: pnpm install && pnpm --filter give-care-site build
Output: give-care-site/out
```

### Presentations (give-care-story)
```
Platform: Cloudflare Pages
Domain: story.givecareapp.com
Build: pnpm install && pnpm --filter give-care-story build
Output: give-care-story/out
```

## Why This Architecture?

### ✅ Benefits

1. **Single Source of Truth** - One Convex backend, multiple frontends
2. **Type Safety** - Shared types via workspace dependency
3. **Independent Deployments** - Each frontend deploys separately
4. **Cost Efficient** - One backend serves all frontends
5. **Simplified Webhooks** - Stripe/Twilio webhooks go to one place

### ⚠️ Important Notes

1. **Convex must run first** - Start `give-care-app` Convex dev server before `give-care-site`
2. **Types regenerate** - Changes to `give-care-app/convex/schema.ts` auto-update types
3. **Environment vars** - Each project has its own `.env.local`
4. **Static export** - Both Next.js sites use `output: 'export'` for Cloudflare Pages

## Testing Integration

### Test Convex Connection
```bash
cd give-care-site
pnpm dev
# Visit http://localhost:3000/signup
# Open browser console
# Look for Convex connection logs
```

### Test Stripe Checkout
```bash
# Use Stripe test mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_KEY=sk_test_...

# Test card: 4242 4242 4242 4242
```

### Test SMS (Twilio Sandbox)
```bash
# Send test message to your verified number
# Reply to activate conversation
```

## Troubleshooting

### "Module not found: Can't resolve 'give-care-app/convex/_generated/api'"

**Solution:** Run `pnpm install` from root to link workspace dependency.

### "Convex client not initialized"

**Solution:** Check `NEXT_PUBLIC_CONVEX_URL` in give-care-site/.env.local

### "Stripe key not found"

**Solution:** Ensure `STRIPE_KEY` is set in give-care-app/.env.local (backend)
and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in give-care-site/.env.local (frontend)

### Types not updating

**Solution:** Restart Convex dev server:
```bash
cd give-care-app
npx convex dev
```

---

**Last updated**: 2025-10-14 (Monorepo consolidation)
