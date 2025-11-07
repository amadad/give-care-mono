# GiveCare Marketing Site - Next.js 15

## Quick Start

```bash
pnpm dev                    # Start dev server (Turbopack)
pnpm build                  # Production build
pnpm test                   # Run tests
pnpm lint                   # ESLint check
```

## Tech Stack

- **Framework**: Next.js 16.0.0 + React 19 + App Router
- **Styling**: Tailwind CSS v4.1.7 + DaisyUI
- **Animation**: Framer Motion
- **Content**: MDX for blog posts
- **Email**: Resend API
- **Testing**: Vitest + Playwright

## Critical Patterns

### Server Components first, Client Components only when needed
### Use 'use client' directive for interactivity
### Mobile-first responsive design (sm, md, lg, xl, 2xl)
### WCAG 2.1 AA compliance required
### Optimize images with next/image

## Architecture

**Server-First**: Default to Server Components for performance
**Performance**: Optimize for Core Web Vitals (LCP, FID, CLS)
**SEO**: Proper meta tags, structured data, semantic HTML

## Code Style

- TypeScript strict mode, no any types
- Functional components with proper interfaces
- Use cn() utility for className merging
- Async/await for data fetching in Server Components
- Error boundaries and loading states

## Key Files

```
app/                    # Next.js App Router
├── layout.tsx         # Root layout with providers
├── page.tsx          # Homepage
├── api/              # API routes
└── components/       # Page-specific components

components/
├── layout/           # Navbar, Footer
├── sections/         # Hero, Features, Testimonials
├── ui/              # Button, Card, Input
└── mdx/             # Blog components

lib/                  # Utilities
├── utils.ts         # cn(), helpers
└── constants.ts     # App constants

content/             # MDX blog posts
```

## Editorial Design System

**Typography**: `.heading-hero`, `.heading-section`, `.body-text`
**Buttons**: `.btn-editorial-primary`, `.btn-editorial-secondary`
**Spacing**: `.section-standard`, `.section-hero`
**Colors**: `bg-base-100`, `text-amber-950`, `text-amber-700`

## Monorepo Integration

**IMPORTANT**: Imports Convex backend types
```tsx
import { api } from "give-care-app/convex/_generated/api"
```

**Start backend first**: Run `npx convex dev` in give-care-app to generate types

## Common Issues

**Missing Convex types**: Start give-care-app backend first
**Hydration errors**: Check for client/server component mismatch
**Build fails**: Run `pnpm type-check` to find TypeScript errors

## Workflow

- Design component mockups first
- Build reusable TypeScript components
- Write tests before committing
- Check bundle size: `pnpm analyze`
- Commit specific files, never `git add .`
