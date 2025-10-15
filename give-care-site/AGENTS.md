# GiveCare Marketing Website Contributor Guide

## 🚀 Dev Environment Setup

### **Node.js Environment**
```bash
# Ensure Node.js 18+ is installed
node --version  # Should be 18.x or higher

# Install pnpm (recommended package manager)
npm install -g pnpm

# Install dependencies
pnpm install

# Set up git hooks (Husky)
pnpm prepare

# Start development server
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start
```

### **Environment Variables**
```bash
# Copy example environment file and configure your values
cp .env.local.example .env.local
# Edit .env.local with your actual API keys

# Required variables:
# - RESEND_API_KEY: Email service for newsletter
# - NEXT_PUBLIC_SITE_URL: Your site URL (for metadata)

# Optional variables:
# - NEXT_PUBLIC_GA_ID: Google Analytics tracking
# - NEXT_PUBLIC_HOTJAR_ID: User behavior analytics
```

### **Local Development**
```bash
# Start Next.js development server with Turbopack
pnpm dev

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Format code with Prettier
pnpm format

# Check formatting
pnpm format:check
```

---

## 🧪 Testing Instructions

### **Test Structure**
```
__tests__/
├── components/             # Component unit tests
├── integration/           # API route tests
└── e2e/                  # End-to-end tests

cypress/                  # E2E test scenarios
├── e2e/
├── fixtures/
└── support/

jest.config.js           # Jest configuration
jest.setup.js           # Test environment setup
```

### **Running Tests**
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- AnimatedChat.test.tsx

# Run E2E tests with Cypress
pnpm cypress:open  # Interactive mode
pnpm cypress:run   # Headless mode

# Run component tests
pnpm test:components

# Run integration tests
pnpm test:integration

# Troubleshooting: Clear test cache
pnpm test -- --clearCache
```

### **Test Categories**
- **Unit Tests**: Component rendering and behavior
- **Integration Tests**: API routes and data fetching
- **E2E Tests**: User journeys (landing → signup → newsletter)
- **Visual Tests**: Component appearance and animations
- **Accessibility Tests**: WCAG compliance checks

### **Adding Tests**
```typescript
// Example component test
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnimatedChat } from '@/components/AnimatedChat'

describe('AnimatedChat', () => {
  it('should display user message and AI response', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<AnimatedChat />)
    
    // Act
    const input = screen.getByPlaceholderText('Type a message...')
    await user.type(input, 'Hello')
    await user.click(screen.getByRole('button', { name: /send/i }))
    
    // Assert
    expect(screen.getByText('Hello')).toBeInTheDocument()
    await screen.findByText(/I understand/i) // AI response
  })
})
```

---

## 🔄 Git Workflow & PR Instructions

### **Branch Naming**
```bash
# Feature branches
git checkout -b feature/hero-animation
git checkout -b feature/pricing-page
git checkout -b feature/blog-categories

# Bug fixes
git checkout -b fix/mobile-menu-overflow
git checkout -b fix/newsletter-validation

# Chore/maintenance
git checkout -b chore/update-dependencies
git checkout -b chore/optimize-images
```

### **Commit Message Format**
```bash
# Format: type(scope): description
feat(hero): add animated scenario transitions
fix(nav): resolve mobile menu z-index issue
docs(mdx): add caregiving resource guide
test(newsletter): add API route integration tests
style(ui): update button hover states
perf(images): implement lazy loading for blog

# Include context in commit body
git commit -m "feat(blog): add MDX blog system

- Set up MDX processor with custom components
- Add blog listing with pagination
- Implement reading time calculation
- Add RSS feed generation

Resolves #123"
```

### **Pull Request Guidelines**

#### **Title Format**
```
[scope] Brief description of changes

Examples:
[profiling] Implement progressive user data collection
[sms] Fix webhook timeout handling
[docs] Update API documentation
[test] Add integration tests for memory system
```

#### **PR Template**
```markdown
## Summary
Brief description of what this PR accomplishes.

## Changes
- [ ] Component additions/updates
- [ ] Style/UI improvements
- [ ] API route changes
- [ ] Content updates (MDX/copy)

## Testing
- [ ] Component tests pass
- [ ] Visual regression checked
- [ ] Mobile responsive tested
- [ ] Accessibility validated
- [ ] Lighthouse score maintained

## Screenshots
<!-- Add before/after screenshots for UI changes -->

## Checklist
- [ ] Code follows Next.js best practices
- [ ] TypeScript types are proper
- [ ] No console errors/warnings
- [ ] SEO meta tags updated if needed
- [ ] Performance optimized (images, bundles)
```

---

## 🛠️ Development Patterns

### **File Organization**
```
app/                       # Next.js App Router
├── layout.tsx            # Root layout with providers
├── page.tsx              # Homepage
├── about/page.tsx        # About page
├── blog/                 # Blog pages
├── api/                  # API routes
└── components/           # Shared components

components/
├── layout/               # Navbar, Footer
├── sections/             # Page sections
├── ui/                   # Reusable UI components
└── mdx/                  # MDX components

lib/                      # Utilities and helpers
├── utils.ts              # Common utilities
├── constants.ts          # App constants
└── mdx.ts               # MDX processing

content/                  # MDX blog posts
public/                   # Static assets
```

### **Code Style Standards**
```typescript
// TypeScript interfaces for type safety
interface UserProfile {
  name?: string
  email: string
  subscribedAt?: Date
}

// Server Components by default
export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  return <Article {...post} />
}

// Client Components when needed
'use client'

export function Newsletter() {
  const [email, setEmail] = useState('')
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await subscribeToNewsletter(email)
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}

// Custom hooks for logic reuse
export function useAnimatedValue(target: number) {
  const [value, setValue] = useState(0)
  // Animation logic
  return value
}
```

### **Component Development**
```typescript
// Component structure pattern
interface ComponentProps {
  title: string
  description?: string
  variant?: 'primary' | 'secondary'
  className?: string
}

export function FeatureCard({ 
  title, 
  description, 
  variant = 'primary',
  className 
}: ComponentProps) {
  return (
    <div className={cn(
      'rounded-lg p-6',
      variant === 'primary' ? 'bg-primary' : 'bg-secondary',
      className
    )}>
      <h3 className="text-xl font-bold">{title}</h3>
      {description && <p className="mt-2">{description}</p>}
    </div>
  )
}

// Animation patterns with Framer Motion
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// MDX component registration
const mdxComponents = {
  h1: (props) => <h1 className="text-4xl font-bold mt-8" {...props} />,
  code: (props) => <Code {...props} />,
  // ... other components
}
```

---

## 🔍 Code Review Process

### **Review Checklist**
- [ ] **Functionality**: Features work across browsers
- [ ] **Responsive**: Mobile, tablet, desktop views
- [ ] **Accessibility**: Keyboard nav, screen readers
- [ ] **Performance**: Bundle size, Core Web Vitals
- [ ] **SEO**: Meta tags, structured data
- [ ] **TypeScript**: Proper types, no any usage
- [ ] **Components**: Reusable, well-organized
- [ ] **Styling**: Consistent with design system

### **Review Guidelines**
1. **Be Constructive**: Focus on code improvement, not criticism
2. **Ask Questions**: Clarify intent before suggesting changes
3. **Suggest Alternatives**: Provide specific improvement suggestions
4. **Test Locally**: Verify changes work in development environment
5. **Consider Impact**: Assess changes on user experience and system performance

---

## 📚 Documentation Standards

### **Code Documentation**
```typescript
/**
 * Animated chat component demonstrating AI caregiving support
 * 
 * @param initialMessages - Pre-populated demo messages
 * @param onComplete - Callback when demo sequence completes
 * @returns Interactive chat interface
 * 
 * @example
 * <AnimatedChat 
 *   initialMessages={demoMessages}
 *   onComplete={() => console.log('Demo complete')}
 * />
 */
export function AnimatedChat({ 
  initialMessages = [], 
  onComplete 
}: AnimatedChatProps) {
  // Component implementation
}
```

### **Feature Documentation**
- Update relevant files in `docs/` when adding features
- Include examples and use cases
- Document configuration options and environment variables
- Add troubleshooting information for common issues

---

## 🚨 Emergency Procedures

### **Hotfix Process**
1. **Create Hotfix Branch**: `git checkout -b hotfix/critical-issue`
2. **Implement Fix**: Minimal changes to resolve issue
3. **Test Locally**: Verify fix in development
4. **Deploy to Preview**: Test on Vercel preview URL
5. **Fast-Track Review**: Request immediate review
6. **Deploy to Production**: Merge to main
7. **Monitor**: Check analytics and error tracking

### **Rollback Procedure**
```bash
# Revert to previous deployment (Vercel)
# Use Vercel dashboard to instant rollback
# OR via CLI:
vercel rollback [deployment-url]

# Git revert if needed
git revert <commit-hash>
git push origin main
```

---

## 📋 Definition of Done

### **Feature Completion**
- [ ] **Implementation**: Feature works across devices
- [ ] **Tests**: Component and integration tests pass
- [ ] **Documentation**: README and inline docs updated
- [ ] **Performance**: Lighthouse score 90+ maintained
- [ ] **Accessibility**: WCAG 2.1 AA compliant
- [ ] **SEO**: Meta tags and structured data added
- [ ] **Responsive**: Mobile-first design implemented
- [ ] **Analytics**: Events tracked appropriately
- [ ] **Review**: Code review completed and approved

---

## 🔧 Troubleshooting

### **Common Development Issues**

#### **"Module not found" errors**
```bash
# Problem: Import paths not resolving
# Solution: Check tsconfig.json paths
# Ensure using @ alias correctly:
import { Button } from '@/components/ui/Button'
# Clear Next.js cache:
rm -rf .next
pnpm dev
```

#### **Hydration mismatch errors**
```bash
# Problem: Server/client render mismatch
# Solutions:
# 1. Ensure dynamic content uses useEffect
# 2. Wrap dynamic components with Suspense
# 3. Use suppressHydrationWarning sparingly
# 4. Check for browser-only APIs in SSR
```

#### **Tailwind styles not applying**
```bash
# Problem: Classes not generating CSS
# Solutions:
# 1. Check tailwind.config.js content paths
# 2. Restart dev server after config changes
# 3. Avoid dynamic class names:
# ❌ className={`text-${color}-500`}
# ✅ className={color === 'red' ? 'text-red-500' : 'text-blue-500'}
```

#### **TypeScript errors in development**
```bash
# Problem: Types not updating after changes
# Solution: Restart TS server in VSCode
# Cmd+Shift+P → "Restart TS Server"
# Or clear cache:
pnpm clean
pnpm install
```

#### **Build failing on Vercel**
```bash
# Problem: Works locally but fails on Vercel
# Common causes:
# 1. Missing environment variables
# 2. Case-sensitive imports (Mac vs Linux)
# 3. Dynamic imports need proper types
# Check build logs and:
pnpm build  # Test production build locally
```

---

## 🤝 Getting Help

### **Documentation Resources**
- **[docs/WEBSITE_ARCHITECTURE.md](docs/WEBSITE_ARCHITECTURE.md)** - Next.js app structure and patterns
- **[docs/COMPONENT_LIBRARY.md](docs/COMPONENT_LIBRARY.md)** - UI components and usage
- **[docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)** - Blog and content creation
- **[Next.js Docs](https://nextjs.org/docs)** - Official Next.js documentation
- **[Tailwind CSS Docs](https://tailwindcss.com/docs)** - Styling reference

### **Communication**
- **Questions**: Create GitHub discussions or issues
- **Bug Reports**: Use issue templates with screenshots
- **Feature Requests**: Include mockups and user flows
- **Design Reviews**: Share Figma links or prototypes

---

*Building the digital front door for AI-powered caregiving support.*