# GiveCare Marketing Website Architecture

## Overview

The GiveCare marketing website is built with Next.js 15.3.2 and serves as the digital front door for our AI-powered caregiving support platform. This document outlines the technical architecture, design patterns, and implementation details.

## Technology Stack

### Core Framework
- **Next.js 15.3.2**: React framework with App Router
- **React 19**: Latest React with improved performance
- **TypeScript 5.7**: Type-safe development
- **Turbopack**: Fast bundler for development

### Styling & UI
- **Tailwind CSS v4**: Utility-first CSS framework
- **DaisyUI**: Component library built on Tailwind
- **Framer Motion**: Animation library
- **Heroicons**: Icon library

### Content & Data
- **MDX**: Markdown with React components for blog
- **gray-matter**: Front matter parser for MDX
- **date-fns**: Date formatting utilities

### Email & Forms
- **Resend**: Email API for newsletter
- **React Hook Form**: Form management (if needed)

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **lint-staged**: Pre-commit linting

## Project Structure

```
give-care-site/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Homepage
│   ├── about/                   # About page
│   ├── news/                    # Blog/news section
│   ├── partners/                # Partner pages
│   ├── api/                     # API routes
│   │   └── newsletter/          # Newsletter subscription
│   └── components/              # Route-specific components
│
├── components/                   # Shared components
│   ├── layout/                  # Layout components
│   │   ├── Navbar.tsx          # Site navigation
│   │   └── Footer.tsx          # Site footer
│   ├── sections/               # Page sections
│   │   ├── Hero.tsx           # Homepage hero
│   │   ├── Features.tsx       # Feature showcase
│   │   ├── Stats.tsx          # Statistics display
│   │   └── Testimonials.tsx   # User testimonials
│   ├── ui/                     # Reusable UI components
│   │   ├── Button.tsx         # Button component
│   │   ├── Card.tsx           # Card component
│   │   └── Input.tsx          # Form inputs
│   └── mdx/                    # MDX components
│       └── BlogLayout.tsx      # Blog post layout
│
├── lib/                         # Utilities and helpers
│   ├── utils.ts                # Common utilities (cn, formatters)
│   ├── constants.ts            # App-wide constants
│   ├── api.ts                  # API client functions
│   └── mdx.ts                  # MDX processing utilities
│
├── content/                     # Content files
│   └── posts/                  # Blog posts in MDX
│
├── public/                      # Static assets
│   ├── images/                 # Image assets
│   └── fonts/                  # Custom fonts
│
├── styles/                      # Global styles
│   └── globals.css             # Global CSS and Tailwind imports
│
└── types/                       # TypeScript types
    └── index.d.ts              # Global type definitions
```

## Architecture Patterns

### 1. Server Components by Default

```typescript
// app/news/page.tsx - Server Component
export default async function NewsPage() {
  const posts = await getBlogPosts() // Server-side data fetching
  
  return (
    <div className="container mx-auto">
      <h1>Latest News</h1>
      <BlogList posts={posts} />
    </div>
  )
}
```

### 2. Client Components for Interactivity

```typescript
// components/Newsletter.tsx
'use client'

import { useState } from 'react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form implementation */}
    </form>
  )
}
```

### 3. API Route Pattern

```typescript
// app/api/newsletter/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      )
    }
    
    // Add to newsletter
    await resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 4. MDX Content Management

```typescript
// lib/mdx.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function getPost(slug: string) {
  const filePath = path.join(process.cwd(), 'content/posts', `${slug}.mdx`)
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContent)
  
  return {
    slug,
    frontMatter: data,
    content
  }
}

export async function getAllPosts() {
  const postsDirectory = path.join(process.cwd(), 'content/posts')
  const files = fs.readdirSync(postsDirectory)
  
  const posts = files.map(file => {
    const slug = file.replace('.mdx', '')
    return getPost(slug)
  })
  
  return Promise.all(posts)
}
```

## Performance Optimization

### 1. Image Optimization
```typescript
import Image from 'next/image'

export function HeroImage() {
  return (
    <Image
      src="/images/hero.webp"
      alt="Caregiving support"
      width={1200}
      height={600}
      priority // Load immediately for above-fold content
      placeholder="blur"
      blurDataURL={shimmer}
    />
  )
}
```

### 2. Code Splitting
```typescript
import dynamic from 'next/dynamic'

// Load heavy components only when needed
const AnimatedChat = dynamic(
  () => import('@/components/AnimatedChat'),
  { 
    loading: () => <ChatSkeleton />,
    ssr: false // Client-side only if needed
  }
)
```

### 3. Font Optimization
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

## SEO & Metadata

### Dynamic Metadata
```typescript
// app/news/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug)
  
  return {
    title: post.frontMatter.title,
    description: post.frontMatter.description,
    openGraph: {
      title: post.frontMatter.title,
      description: post.frontMatter.description,
      images: [post.frontMatter.image],
      type: 'article',
      publishedTime: post.frontMatter.date,
    }
  }
}
```

### Structured Data
```typescript
export function BlogPostStructuredData({ post }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Person',
      name: post.author
    },
    datePublished: post.date
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
```

## State Management

### React Context for Global State
```typescript
// context/AppContext.tsx
'use client'

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  
  return (
    <AppContext.Provider value={{ user, setUser }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
```

## Error Handling

### Error Boundaries
```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2>Something went wrong!</h2>
        <button onClick={reset} className="btn btn-primary mt-4">
          Try again
        </button>
      </div>
    </div>
  )
}
```

### Loading States
```typescript
// app/loading.tsx
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="loading loading-spinner loading-lg"></div>
    </div>
  )
}
```

## Deployment

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_SITE_URL=https://givecare.io
RESEND_API_KEY=re_xxxxx
RESEND_AUDIENCE_ID=xxxxx
```

### Build Configuration
```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

### Vercel Deployment
```json
// vercel.json
{
  "functions": {
    "app/api/newsletter/route.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/blog/:path*",
      "destination": "/news/:path*"
    }
  ]
}
```

## Security Considerations

1. **API Rate Limiting**: Implement rate limiting on API routes
2. **Input Validation**: Validate all user inputs
3. **CORS Configuration**: Properly configure CORS headers
4. **Environment Variables**: Never expose sensitive keys
5. **Content Security Policy**: Implement CSP headers

## Monitoring & Analytics

1. **Vercel Analytics**: Built-in performance monitoring
2. **Google Analytics**: User behavior tracking
3. **Error Tracking**: Sentry or similar for error monitoring
4. **Performance Monitoring**: Core Web Vitals tracking

## Future Considerations

1. **Internationalization**: i18n support for multiple languages
2. **A/B Testing**: Feature flag system for experiments
3. **CMS Integration**: Headless CMS for content management
4. **Search**: Algolia or similar for blog search
5. **Comments**: Disqus or custom comment system