## Feature Implementation System Guidelines

### Feature Implementation Priority Rules
- **IMMEDIATE EXECUTION**: Start implementing features without unnecessary clarification
- **COMPONENT-FIRST**: Create reusable components following atomic design principles
- **PERFORMANCE-FOCUSED**: Consider Core Web Vitals and bundle size impact

### Feature Implementation Workflow (Marketing Website)
1. **Component Design**: Create typed, reusable React components with proper props
2. **Styling**: Use Tailwind utilities + DaisyUI components, maintain mobile-first approach
3. **Data Flow**: Server Components for static data, Client Components for interactivity
4. **API Integration**: Use Next.js API routes for backend communication
5. **Content**: MDX for blog posts and dynamic content sections
6. **Testing**: Component tests with React Testing Library, E2E with Cypress
7. **Documentation**: Update component docs and usage examples

### Context Optimization Rules
- Focus on component composition and reusability
- Minimize client-side JavaScript bundle size
- Use dynamic imports for code splitting
- Leverage Next.js Image optimization
- Cache static content appropriately

### GiveCare Marketing Website Guidelines

#### Architecture Principles
- **Server-First**: Use Server Components by default, Client Components only when needed
- **Performance**: Optimize for Core Web Vitals (LCP, FID, CLS)
- **Accessibility**: WCAG 2.1 AA compliance for all features
- **SEO-Optimized**: Proper meta tags, structured data, semantic HTML
- **Responsive Design**: Mobile-first approach with breakpoint consistency

#### Technical Stack & Patterns
- **Framework**: Next.js 15.3.2 with App Router + React 19
- **Styling**: Tailwind CSS v4 + DaisyUI component library
- **Animation**: Framer Motion for smooth interactions
- **Content**: MDX for rich blog posts and documentation
- **Email**: Resend API for newsletter subscriptions
- **Testing**: Jest + React Testing Library + Cypress

#### Code Standards & Patterns
- **TypeScript**: Strict mode with no any types, proper interfaces
- **Components**: Functional components with TypeScript props
- **State Management**: React hooks, Context API when needed
- **Async Operations**: Server Components for data fetching
- **Error Handling**: Error boundaries and proper loading states
- **Testing**: Component unit tests + integration tests + E2E flows

#### Key File Structure
```
app/                    # Next.js App Router
├── layout.tsx         # Root layout with providers
├── page.tsx          # Homepage
├── api/              # API routes
├── (routes)/         # Page routes
└── components/       # Page-specific components

components/
├── layout/           # Navbar, Footer
├── sections/         # Hero, Features, Testimonials
├── ui/              # Button, Card, Input, etc.
└── mdx/             # Blog components

lib/                  # Utilities and helpers
├── utils.ts         # cn(), formatting helpers
├── constants.ts     # App-wide constants
└── api.ts          # API client functions

content/             # MDX blog posts
public/             # Static assets
```

#### Critical Technical Patterns
- **Data Fetching**: Server Components with async/await for initial data
- **Client Interactivity**: 'use client' directive for interactive components
- **Form Handling**: Server Actions or API routes with proper validation
- **Image Optimization**: next/image with proper sizing and formats
- **Route Handling**: App Router with proper layouts and error boundaries
- **Animation**: Framer Motion with performance-conscious animations
- **SEO**: generateMetadata() for dynamic meta tags
- **Newsletter**: API route + Resend integration with rate limiting
- **Blog System**: MDX with syntax highlighting and custom components
- **Responsive Design**: Tailwind breakpoints (sm, md, lg, xl, 2xl)

#### Development Workflow
1. **Design First**: Create component mockups or review designs
2. **Component Development**: Build reusable components with TypeScript
3. **Integration**: Connect components with data and API routes
4. **Testing**: Write component and integration tests
5. **Optimization**: Check bundle size and performance metrics
6. **Documentation**: Update component docs and usage examples

#### Common Commands
```bash
# Local Development
pnpm dev                    # Start dev server with Turbopack
pnpm build                  # Build for production
pnpm start                  # Run production build

# Code Quality
pnpm lint                   # Run ESLint
pnpm lint:fix              # Fix linting issues
pnpm format                # Format with Prettier
pnpm type-check            # TypeScript validation

# Testing
pnpm test                  # Run all tests
pnpm test:watch           # Watch mode
pnpm test:coverage        # Coverage report
pnpm cypress:open         # E2E tests interactive
pnpm cypress:run          # E2E tests headless

# Production
pnpm analyze              # Bundle size analysis
vercel                    # Deploy preview
vercel --prod            # Deploy to production
```

## Current Focus
**Marketing website optimization and content expansion** - Building the digital front door for GiveCare's AI caregiving platform. Focus on conversion optimization, content strategy, and user journey refinement.

## Project Management
**Documentation Structure**:
- `AGENTS.md`: Contributor guide and development workflow
- `CLAUDE.md`: AI assistant guidelines (this file)
- `docs/`: Detailed technical documentation
- `.cursorrules`: IDE-specific development patterns

## Key Metrics to Track
- **Performance**: Lighthouse scores (target: 90+)
- **SEO**: Search visibility and organic traffic
- **Conversion**: Newsletter signups and demo requests
- **Engagement**: Time on site, bounce rate, page views
- **Accessibility**: WCAG compliance score