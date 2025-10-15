# GiveCare Marketing Website

The digital front door for GiveCare's AI-powered caregiving support platform. Built with Next.js 15, React 19, and Tailwind CSS v4.

## Overview

GiveCare provides SMS-based AI companionship and support for family caregivers and long-term care facilities. This marketing site showcases our services and enables user engagement through newsletter signups and demo bookings.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start
```

## Key Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **MDX Blog**: Rich content authoring with syntax highlighting
- **Newsletter Integration**: Resend API for email subscriptions
- **Stripe Checkout**: Embedded payment flow with subscription management
- **Convex Integration**: Direct connection to SMS agent backend for seamless signup
- **SMS Notifications**: Twilio integration for user onboarding and updates
- **Performance Optimized**: Core Web Vitals score 90+
- **Accessibility**: WCAG 2.1 AA compliant

## Tech Stack

- **Framework**: Next.js 15.3 with App Router
- **UI**: React 19 + Tailwind CSS v4 + DaisyUI
- **Animation**: Framer Motion
- **Content**: MDX with next-mdx-remote
- **Email**: Resend API
- **Payments**: Stripe Checkout & Webhooks
- **SMS**: Twilio Messaging Service
- **Backend**: Convex (serverless + real-time)
- **Deployment**: Cloudflare Pages

## Project Structure

```
app/                    # Next.js App Router
├── api/               # API routes (deprecated - migrating to Convex)
│   └── newsletter/    # Email subscription
├── components/        # Shared components
│   └── sections/
│       └── SignupFormConvex.tsx # New Convex-powered signup
├── providers/         # React providers
│   └── ConvexClientProvider.tsx # Convex integration
├── partners/          # Partner-specific pages
└── (routes)/          # Marketing pages

convex/                # Convex types (symlinked from give-care-type)
├── _generated/        # Auto-generated API types
└── convex.json        # Convex config

lib/                   # Core utilities
├── env.ts            # Environment validation
└── sms-service.ts    # Twilio SMS integration (deprecated)

content/posts/         # MDX blog posts
public/               # Static assets
```

## Development

```bash
# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format

# Type checking
pnpm type-check

# Bundle analysis
pnpm analyze
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Convex (NEW - replaces Supabase for signups)
NEXT_PUBLIC_CONVEX_URL=https://agreeable-lion-831.convex.cloud

# Stripe (client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID=price_...

# Resend (newsletter)
RESEND_API_KEY=re_...
RESEND_AUDIENCE_ID=...

# Application
NEXT_PUBLIC_SITE_URL=https://givecareapp.com

# Deprecated (migrating to Convex)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

See [Signup Deployment Guide](./docs/SIGNUP_DEPLOYMENT_GUIDE.md) for detailed setup instructions.

## Contributing

See [AGENTS.md](./AGENTS.md) for detailed development guidelines.

## Documentation

- **[Convex Integration Guide](./docs/CONVEX_INTEGRATION.md)** - 🆕 **Signup flow with Convex backend** (production ready)
- [Signup Deployment Guide](./docs/SIGNUP_DEPLOYMENT_GUIDE.md) - Legacy Supabase setup (deprecated)
- [Architecture](./docs/WEBSITE_ARCHITECTURE.md)
- [Development Workflow](./docs/WEBSITE_DEVELOPMENT_WORKFLOW.md)
- [Operations Guide](./docs/WEBSITE_OPERATIONS_GUIDE.md)
- [Component Library](./docs/COMPONENT_LIBRARY.md)
- [Content Guide](./docs/CONTENT_GUIDE.md)
- [Testing Guide](./docs/TESTING.md)

## License

Proprietary - GiveCare, Inc.