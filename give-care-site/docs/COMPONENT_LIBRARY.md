# GiveCare Component Library

## Overview

This document catalogs all reusable components in the GiveCare marketing website, including usage examples, props, and best practices.

## Component Categories

### Layout Components

#### Navbar
Navigation bar with responsive mobile menu.

```typescript
// components/layout/Navbar.tsx
interface NavbarProps {
  transparent?: boolean // Transparent background on hero sections
  sticky?: boolean // Stick to top on scroll
}

// Usage
<Navbar transparent sticky />
```

#### Footer
Site footer with links and newsletter signup.

```typescript
// components/layout/Footer.tsx
interface FooterProps {
  showNewsletter?: boolean
  className?: string
}

// Usage
<Footer showNewsletter />
```

#### Container
Consistent page container with responsive padding.

```typescript
// components/layout/Container.tsx
interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

// Usage
<Container size="lg">
  <h1>Page Content</h1>
</Container>
```

### Section Components

#### Hero
Full-width hero section with background options.

```typescript
// components/sections/Hero.tsx
interface HeroProps {
  title: string
  subtitle?: string
  backgroundImage?: string
  backgroundVideo?: string
  overlay?: boolean
  centered?: boolean
  children?: ReactNode // For CTAs
}

// Usage
<Hero
  title="AI-Powered Caregiving Support"
  subtitle="Get personalized guidance when you need it most"
  backgroundImage="/images/hero-bg.jpg"
  overlay
>
  <Button size="lg" variant="primary">Get Started</Button>
  <Button size="lg" variant="outline">Learn More</Button>
</Hero>
```

#### Features
Feature grid with icons and descriptions.

```typescript
// components/sections/Features.tsx
interface Feature {
  icon: ReactNode
  title: string
  description: string
  link?: string
}

interface FeaturesProps {
  title?: string
  subtitle?: string
  features: Feature[]
  columns?: 2 | 3 | 4
}

// Usage
<Features
  title="How GiveCare Helps"
  features={[
    {
      icon: <HeartIcon className="w-8 h-8" />,
      title: "Emotional Support",
      description: "24/7 compassionate guidance"
    }
  ]}
  columns={3}
/>
```

#### Stats
Animated statistics display.

```typescript
// components/sections/Stats.tsx
interface Stat {
  label: string
  value: number
  suffix?: string // e.g., '+', '%', 'K'
  duration?: number // Animation duration
}

interface StatsProps {
  stats: Stat[]
  backgroundColor?: string
}

// Usage
<Stats
  stats={[
    { label: "Active Caregivers", value: 10000, suffix: "+" },
    { label: "Messages Sent", value: 1.5, suffix: "M" },
    { label: "Satisfaction Rate", value: 98, suffix: "%" }
  ]}
/>
```

#### Testimonials
User testimonial carousel.

```typescript
// components/sections/Testimonials.tsx
interface Testimonial {
  id: string
  quote: string
  author: string
  role?: string
  image?: string
  rating?: number
}

interface TestimonialsProps {
  testimonials: Testimonial[]
  autoPlay?: boolean
  interval?: number
}

// Usage
<Testimonials
  testimonials={testimonials}
  autoPlay
  interval={5000}
/>
```

### UI Components

#### Button
Versatile button component with variants.

```typescript
// components/ui/Button.tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

// Usage
<Button variant="primary" size="lg" loading={isLoading}>
  Submit
</Button>

// With icon
<Button icon={<ArrowRightIcon />} variant="outline">
  Learn More
</Button>
```

#### Card
Flexible card component.

```typescript
// components/ui/Card.tsx
interface CardProps {
  children: ReactNode
  hover?: boolean // Hover effects
  clickable?: boolean // Cursor pointer
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

// Usage
<Card hover clickable padding="lg">
  <h3>Card Title</h3>
  <p>Card content...</p>
</Card>
```

#### Input
Form input with validation states.

```typescript
// components/ui/Input.tsx
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

// Usage
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  error={errors.email}
  hint="We'll never share your email"
  icon={<MailIcon />}
/>
```

#### Modal
Accessible modal dialog.

```typescript
// components/ui/Modal.tsx
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
}

// Usage
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Welcome to GiveCare"
  size="md"
>
  <p>Modal content...</p>
  <Button onClick={() => setShowModal(false)}>
    Get Started
  </Button>
</Modal>
```

#### Badge
Status indicators and labels.

```typescript
// components/ui/Badge.tsx
interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
  rounded?: boolean
}

// Usage
<Badge variant="success" size="sm">
  New
</Badge>
```

### Form Components

#### Newsletter
Newsletter signup form.

```typescript
// components/forms/Newsletter.tsx
interface NewsletterProps {
  variant?: 'inline' | 'stacked' | 'minimal'
  showName?: boolean
  className?: string
}

// Usage
<Newsletter variant="inline" />
```

#### ContactForm
Multi-field contact form.

```typescript
// components/forms/ContactForm.tsx
interface ContactFormProps {
  subject?: string
  fields?: ('name' | 'email' | 'phone' | 'message' | 'company')[]
  onSuccess?: () => void
}

// Usage
<ContactForm
  subject="Partnership Inquiry"
  fields={['name', 'email', 'company', 'message']}
  onSuccess={() => setShowThankYou(true)}
/>
```

### Animation Components

#### AnimatedChat
Interactive chat demonstration.

```typescript
// components/AnimatedChat.tsx
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  delay?: number
}

interface AnimatedChatProps {
  messages: ChatMessage[]
  autoPlay?: boolean
  onComplete?: () => void
}

// Usage
<AnimatedChat
  messages={demoMessages}
  autoPlay
  onComplete={() => console.log('Demo complete')}
/>
```

#### FadeIn
Scroll-triggered fade animation.

```typescript
// components/animations/FadeIn.tsx
interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

// Usage
<FadeIn direction="up" delay={200}>
  <Card>Content appears on scroll</Card>
</FadeIn>
```

#### CountUp
Animated number counter.

```typescript
// components/animations/CountUp.tsx
interface CountUpProps {
  end: number
  duration?: number
  separator?: string
  prefix?: string
  suffix?: string
  onComplete?: () => void
}

// Usage
<CountUp
  end={10000}
  duration={2000}
  separator=","
  suffix="+"
/>
```

### MDX Components

#### Callout
Highlighted information boxes in blog posts.

```typescript
// components/mdx/Callout.tsx
interface CalloutProps {
  type?: 'info' | 'tip' | 'warning' | 'success'
  title?: string
  children: ReactNode
}

// Usage in MDX
<Callout type="tip" title="Pro Tip">
  Remember to take breaks throughout the day.
</Callout>
```

#### VideoEmbed
Responsive video embeds.

```typescript
// components/mdx/VideoEmbed.tsx
interface VideoEmbedProps {
  url: string
  title: string
  aspectRatio?: '16:9' | '4:3' | '1:1'
  caption?: string
}

// Usage in MDX
<VideoEmbed
  url="https://youtube.com/watch?v=..."
  title="Caregiving Tips"
  caption="5-minute guide to daily care routines"
/>
```

#### CodeBlock
Syntax highlighted code blocks.

```typescript
// components/mdx/CodeBlock.tsx
interface CodeBlockProps {
  children: string
  language?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
}

// Usage in MDX
<CodeBlock language="typescript" showLineNumbers>
{`function greet(name: string) {
  return \`Hello, \${name}!\`
}`}
</CodeBlock>
```

### Utility Components

#### SEO
Dynamic meta tags for pages.

```typescript
// components/SEO.tsx
interface SEOProps {
  title?: string
  description?: string
  image?: string
  article?: boolean
  publishedTime?: string
}

// Usage
<SEO
  title="About GiveCare"
  description="Learn about our mission to support family caregivers"
  image="/images/og-about.jpg"
/>
```

#### Loading
Loading states and skeletons.

```typescript
// components/Loading.tsx
interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'skeleton'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Usage
<Loading variant="spinner" size="lg" />

// Skeleton variant
<Loading variant="skeleton">
  <div className="h-4 w-32 mb-2" />
  <div className="h-4 w-full" />
</Loading>
```

#### ErrorBoundary
Graceful error handling.

```typescript
// components/ErrorBoundary.tsx
interface ErrorBoundaryProps {
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  children: ReactNode
}

// Usage
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error) => console.error(error)}
>
  <ComponentThatMightError />
</ErrorBoundary>
```

## Component Best Practices

### Accessibility

```typescript
// Always include ARIA labels
<button aria-label="Close modal" onClick={onClose}>
  <XIcon />
</button>

// Semantic HTML
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/about">About</a></li>
  </ul>
</nav>

// Keyboard navigation
<div 
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
```

### Performance

```typescript
// Lazy load heavy components
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { loading: () => <Loading /> }
)

// Memoize expensive computations
const MemoizedComponent = memo(({ data }) => {
  const processedData = useMemo(
    () => expensiveOperation(data),
    [data]
  )
  return <div>{processedData}</div>
})

// Image optimization
<Image
  src="/hero.jpg"
  alt="Description"
  width={1200}
  height={600}
  priority // for above-fold images
  placeholder="blur"
  blurDataURL={shimmerDataUrl}
/>
```

### TypeScript Patterns

```typescript
// Extend native HTML elements
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

// Generic components
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => ReactNode
  keyExtractor: (item: T) => string
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}
```

### Composition Patterns

```typescript
// Compound components
const Card = ({ children, className }: CardProps) => (
  <div className={cn("card", className)}>{children}</div>
)

Card.Header = ({ children }: { children: ReactNode }) => (
  <div className="card-header">{children}</div>
)

Card.Body = ({ children }: { children: ReactNode }) => (
  <div className="card-body">{children}</div>
)

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>

// Render props
interface ToggleProps {
  children: (props: { on: boolean; toggle: () => void }) => ReactNode
}

function Toggle({ children }: ToggleProps) {
  const [on, setOn] = useState(false)
  const toggle = () => setOn(!on)
  return <>{children({ on, toggle })}</>
}
```

## Styling Guidelines

### Tailwind Utilities

```typescript
// Use cn() helper for conditional classes
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes",
  className // Allow override
)} />

// Consistent spacing
const spacing = {
  xs: 'p-2',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12'
}

// Responsive design
<div className="px-4 md:px-6 lg:px-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
    Responsive heading
  </h1>
</div>
```

### DaisyUI Components

```typescript
// Use DaisyUI classes for complex components
<div className="drawer drawer-end">
  <input id="drawer-toggle" type="checkbox" className="drawer-toggle" />
  <div className="drawer-content">
    {/* Page content */}
  </div>
  <div className="drawer-side">
    <label htmlFor="drawer-toggle" className="drawer-overlay" />
    <aside className="menu p-4 w-80 bg-base-100">
      {/* Sidebar content */}
    </aside>
  </div>
</div>

// Combine with Tailwind
<button className="btn btn-primary hover:scale-105 transition-transform">
  Custom styled DaisyUI button
</button>
```

## Testing Components

### Unit Tests

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    
    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})
```

### Integration Tests

```typescript
// __tests__/integration/Newsletter.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Newsletter } from '@/components/forms/Newsletter'

// Mock fetch
global.fetch = jest.fn()

describe('Newsletter Integration', () => {
  it('subscribes successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    const user = userEvent.setup()
    render(<Newsletter />)
    
    const input = screen.getByPlaceholderText(/email/i)
    await user.type(input, 'test@example.com')
    await user.click(screen.getByText(/subscribe/i))
    
    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument()
    })
  })
})
```

## Component Documentation Template

When creating new components, use this template:

```typescript
/**
 * ComponentName
 * 
 * Description of what the component does and when to use it.
 * 
 * @example
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={variable}
 *   onAction={handleAction}
 * />
 * ```
 */

interface ComponentNameProps {
  /** Required prop description */
  prop1: string
  
  /** Optional prop description 
   * @default 'default value'
   */
  prop2?: string
  
  /** Callback description */
  onAction?: (value: string) => void
}

export function ComponentName({ 
  prop1, 
  prop2 = 'default value',
  onAction 
}: ComponentNameProps) {
  // Implementation
}
```