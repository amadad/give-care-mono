# GiveCare Website Development Workflow

> **Note**: This document covers the marketing website development. For SMS backend workflow, see [backend-reference/DEVELOPMENT_WORKFLOW.md](backend-reference/DEVELOPMENT_WORKFLOW.md)

## 🎯 **Development Philosophy**
Create an accessible, performant, and conversion-optimized website that reflects GiveCare's mission of supporting family caregivers with compassion and technology.

## 🏗️ **Development Setup**

### **Prerequisites**
- Node.js 18+ (LTS recommended)
- pnpm 8+ (faster than npm/yarn)
- VS Code with recommended extensions
- Git with configured SSH keys

### **Quick Start**
```bash
# Clone repository
git clone git@github.com:givecare/give-care-site.git
cd give-care-site

# Install pnpm globally if needed
npm install -g pnpm

# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
pnpm dev

# Open browser
open http://localhost:3000
```

### **VS Code Setup**
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}

// Recommended extensions:
// - ESLint
// - Prettier
// - Tailwind CSS IntelliSense
// - TypeScript Vue Plugin
// - MDX
```

## 🔄 **Development Workflow**

### **1. Feature Development Process**

#### **Component Creation**
```typescript
// 1. Create component file
// components/sections/NewFeature.tsx

import { cn } from '@/lib/utils'

interface NewFeatureProps {
  title: string
  description?: string
  className?: string
}

export function NewFeature({ 
  title, 
  description, 
  className 
}: NewFeatureProps) {
  return (
    <section className={cn("py-16", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        {description && (
          <p className="text-lg text-gray-600">{description}</p>
        )}
      </div>
    </section>
  )
}

// 2. Create test file
// __tests__/components/NewFeature.test.tsx

import { render, screen } from '@testing-library/react'
import { NewFeature } from '@/components/sections/NewFeature'

describe('NewFeature', () => {
  it('renders title and description', () => {
    render(
      <NewFeature 
        title="Test Title" 
        description="Test description" 
      />
    )
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })
})

// 3. Add to page
// app/page.tsx

import { NewFeature } from '@/components/sections/NewFeature'

export default function HomePage() {
  return (
    <>
      {/* Other sections */}
      <NewFeature 
        title="New Feature Section"
        description="This showcases our new feature"
      />
    </>
  )
}
```

#### **API Route Creation**
```typescript
// app/api/contact/route.ts

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Validation schema
const ContactSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  subject: z.string().min(5, 'Subject is too short'),
  message: z.string().min(10, 'Message is too short')
})

export async function POST(request: Request) {
  try {
    // Parse and validate body
    const body = await request.json()
    const validatedData = ContactSchema.parse(body)
    
    // Send email
    await resend.emails.send({
      from: 'GiveCare Contact <contact@givecare.io>',
      to: 'team@givecare.io',
      replyTo: validatedData.email,
      subject: `Contact Form: ${validatedData.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${validatedData.name} (${validatedData.email})</p>
        <p><strong>Subject:</strong> ${validatedData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${validatedData.message}</p>
      `
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
```

### **2. Content Management**

#### **Blog Post Creation**
```mdx
---
title: "10 Self-Care Tips for Family Caregivers"
description: "Practical strategies to maintain your well-being while caring for a loved one"
date: "2024-03-15"
author: "Sarah Johnson"
category: "wellness"
tags: ["self-care", "mental-health", "tips"]
image: "/images/blog/self-care-tips.jpg"
featured: true
---

import { Callout } from '@/components/mdx/Callout'
import { QuickTip } from '@/components/mdx/QuickTip'

# Introduction

Taking care of yourself isn't selfish—it's essential for providing the best care to your loved one...

<Callout type="tip">
  Remember: You can't pour from an empty cup. Your well-being matters.
</Callout>

## 1. Establish Morning Routines

Start your day with intention...

<QuickTip>
  Try waking up 15 minutes earlier for a peaceful morning coffee or meditation.
</QuickTip>

{/* Continue with remaining tips */}
```

### **3. Testing Strategy**

#### **Component Testing**
```typescript
// Test user interactions
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from '@/components/forms/ContactForm'

describe('ContactForm', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    
    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    // Check for validation messages
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
  })
  
  it('submits valid form', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    render(<ContactForm onSubmit={onSubmit} />)
    
    // Fill form
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/message/i), 'Test message')
    
    // Submit
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message'
    })
  })
})
```

#### **E2E Testing**
```typescript
// cypress/e2e/newsletter.cy.ts
describe('Newsletter Subscription', () => {
  beforeEach(() => {
    cy.visit('/')
  })
  
  it('subscribes to newsletter successfully', () => {
    // Find newsletter form
    cy.get('[data-testid="newsletter-form"]').within(() => {
      cy.get('input[type="email"]').type('test@example.com')
      cy.get('button[type="submit"]').click()
    })
    
    // Check success message
    cy.contains('Thank you for subscribing!').should('be.visible')
    
    // Verify API call
    cy.intercept('POST', '/api/newsletter', { success: true }).as('subscribe')
    cy.wait('@subscribe').its('request.body').should('deep.equal', {
      email: 'test@example.com'
    })
  })
})
```

## 🎨 **Styling Guidelines**

### **Tailwind CSS Best Practices**
```typescript
// Use cn() utility for conditional classes
import { cn } from '@/lib/utils'

// ❌ Bad: String concatenation
<div className={`px-4 ${isActive ? 'bg-blue-500' : 'bg-gray-500'}`}>

// ✅ Good: cn() utility
<div className={cn(
  "px-4 transition-colors",
  isActive ? "bg-blue-500" : "bg-gray-500"
)}>

// Complex example with variants
const buttonVariants = {
  base: "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  variants: {
    variant: {
      primary: "bg-primary text-white hover:bg-primary-dark",
      secondary: "bg-secondary text-white hover:bg-secondary-dark",
      outline: "border border-gray-300 hover:bg-gray-50"
    },
    size: {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2",
      lg: "px-6 py-3 text-lg"
    }
  }
}

<button className={cn(
  buttonVariants.base,
  buttonVariants.variants.variant[variant],
  buttonVariants.variants.size[size],
  className
)}>
```

### **Responsive Design**
```typescript
// Mobile-first approach
<div className="
  px-4           // Mobile: 16px padding
  md:px-6        // Tablet: 24px padding
  lg:px-8        // Desktop: 32px padding
  
  grid 
  grid-cols-1    // Mobile: 1 column
  md:grid-cols-2 // Tablet: 2 columns
  lg:grid-cols-3 // Desktop: 3 columns
  
  gap-4          // Mobile: 16px gap
  md:gap-6       // Tablet: 24px gap
  lg:gap-8       // Desktop: 32px gap
">
```

## 🚀 **Performance Optimization**

### **Image Optimization**
```typescript
// Always use next/image
import Image from 'next/image'

// ❌ Bad: Regular img tag
<img src="/hero.jpg" alt="Hero" />

// ✅ Good: Optimized image
<Image
  src="/hero.jpg"
  alt="Hero image showing caregiving support"
  width={1200}
  height={600}
  priority // For above-fold images
  placeholder="blur"
  blurDataURL={shimmerDataUrl}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Generate shimmer placeholder
const shimmerDataUrl = `data:image/svg+xml;base64,${toBase64(shimmer(1200, 600))}`
```

### **Code Splitting**
```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

// Only load chart library when needed
const DynamicChart = dynamic(
  () => import('@/components/Chart'),
  { 
    loading: () => <div>Loading chart...</div>,
    ssr: false // Don't render on server
  }
)

// Lazy load below-fold sections
const TestimonialsSection = dynamic(
  () => import('@/components/sections/Testimonials')
)
```

## 📊 **Analytics Implementation**

### **Event Tracking**
```typescript
// lib/analytics.ts
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    })
  }
}

// Usage in components
import { trackEvent } from '@/lib/analytics'

function NewsletterForm() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Track submission
    trackEvent('newsletter_signup', 'conversion', 'homepage_footer')
    
    // Submit form...
  }
}
```

## 🔍 **Code Review Checklist**

### **Before Submitting PR**
- [ ] All tests pass (`pnpm test`)
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] Code is formatted (`pnpm format`)
- [ ] No linting warnings (`pnpm lint`)
- [ ] Bundle size checked (`pnpm analyze`)
- [ ] Lighthouse score > 90
- [ ] Works on mobile devices
- [ ] Accessibility checked (keyboard nav, screen reader)
- [ ] SEO metadata added
- [ ] Documentation updated

### **Review Focus Areas**
1. **Performance Impact**
   - Bundle size increase
   - Image optimization
   - Code splitting opportunities

2. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation
   - Color contrast

3. **SEO**
   - Page titles and descriptions
   - Open Graph tags
   - Structured data
   - URL structure

4. **Code Quality**
   - TypeScript strict mode
   - Component reusability
   - Error handling
   - Test coverage

## 🚢 **Deployment Process**

### **Preview Deployments**
```bash
# Automatic on PR creation
# Preview URL: https://give-care-site-pr-123.vercel.app

# Manual preview
vercel

# Get preview URL
vercel --prod=false
```

### **Production Deployment**
```bash
# Merge to main branch triggers auto-deployment

# Manual production deployment
vercel --prod

# Rollback if needed
vercel rollback [deployment-url]
```

### **Environment Management**
```bash
# Pull production env vars
vercel env pull .env.production

# Add new env var
vercel env add RESEND_API_KEY

# List all env vars
vercel env ls
```

## 🐛 **Debugging Tips**

### **React DevTools**
```typescript
// Add display names for better debugging
NewsletterForm.displayName = 'NewsletterForm'

// Use React.memo with display name
const MemoizedComponent = React.memo(Component)
MemoizedComponent.displayName = 'MemoizedComponent'
```

### **Console Debugging**
```typescript
// Conditional logging for development
const debug = process.env.NODE_ENV === 'development' 
  ? console.log 
  : () => {}

debug('Component rendered with props:', props)
```

### **Network Debugging**
```typescript
// Log API calls in development
if (process.env.NODE_ENV === 'development') {
  console.log(`API Call: ${method} ${url}`, { body })
}
```

## 📚 **Resources**

### **Documentation**
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [MDX Docs](https://mdxjs.com)

### **Tools**
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress](https://www.cypress.io)

### **VS Code Extensions**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- MDX
- GitLens
- Error Lens

## 🎯 **Performance Targets**

| Metric | Target | Tool |
|--------|--------|------|
| Lighthouse Score | > 90 | Lighthouse |
| First Contentful Paint | < 1.8s | WebPageTest |
| Time to Interactive | < 3.8s | WebPageTest |
| Bundle Size (JS) | < 300KB | Bundle Analyzer |
| Test Coverage | > 80% | Jest |
| TypeScript Strict | 100% | tsc |

## 🔄 **Continuous Improvement**

1. **Weekly Performance Review**
   - Check Core Web Vitals
   - Review bundle size trends
   - Analyze user analytics

2. **Monthly Dependency Updates**
   - Run `pnpm update --interactive`
   - Test thoroughly after updates
   - Update types if needed

3. **Quarterly Architecture Review**
   - Evaluate component patterns
   - Refactor technical debt
   - Update documentation