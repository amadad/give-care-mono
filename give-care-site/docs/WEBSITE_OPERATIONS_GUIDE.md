# GiveCare Website Operations Guide

> **Note**: This covers marketing website operations. For SMS backend operations, see [backend-reference/OPERATIONS_GUIDE.md](backend-reference/OPERATIONS_GUIDE.md)

## 🚀 Quick Start Commands

### Local Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
# Opens http://localhost:3000

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server locally
pnpm start

# Analyze bundle size
pnpm analyze
```

### Production Commands
```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# View deployment logs
vercel logs [deployment-url]

# Rollback deployment
vercel rollback [deployment-url]

# List all deployments
vercel list
```

## 🔧 System Health Checks

### Service Status
```bash
# Check website health
curl -I https://givecare.io
# Should return 200 OK

# Check API endpoints
curl https://givecare.io/api/health
# Should return {"status":"ok"}

# Test newsletter endpoint
curl -X POST https://givecare.io/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check sitemap generation
curl https://givecare.io/sitemap.xml

# Verify robots.txt
curl https://givecare.io/robots.txt
```

### Performance Monitoring
```bash
# Run Lighthouse audit
pnpm lighthouse https://givecare.io --view

# Check Core Web Vitals via PageSpeed Insights
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://givecare.io&category=performance"

# Monitor bundle size
pnpm analyze

# Test page load time
time curl -s -o /dev/null -w "Total time: %{time_total}s\n" https://givecare.io

# Check specific route performance
ab -n 100 -c 10 https://givecare.io/
```

## 🐛 Common Issues & Solutions

### Issue: Build Failures

```bash
# 1. Clear cache and reinstall
rm -rf .next node_modules pnpm-lock.yaml
pnpm install
pnpm build

# 2. Check for TypeScript errors
pnpm type-check

# 3. Verify environment variables
pnpm vercel env pull
cat .env.local

# 4. Test production build locally
NODE_ENV=production pnpm build && pnpm start

# 5. Check for missing dependencies
pnpm install --frozen-lockfile
```

### Issue: Poor Performance Scores

```bash
# 1. Analyze bundle composition
pnpm analyze
# Look for large dependencies

# 2. Find large unoptimized images
find public -type f \( -name "*.jpg" -o -name "*.png" \) -size +100k -exec ls -lh {} \;

# 3. Check for missing optimizations in next.config.js
grep -E "swcMinify|compress|optimizeCss" next.config.js

# 4. Review network waterfall in Chrome DevTools
# Open DevTools > Network > Analyze load sequence

# 5. Generate performance report
pnpm lighthouse https://givecare.io --output html --output-path ./lighthouse-report.html
```

### Issue: Deployment Failures

```bash
# 1. Check Vercel build logs
vercel logs --prod --since 1h

# 2. Verify all required environment variables
vercel env ls
# Compare with .env.local.example

# 3. Test build with Vercel CLI
vercel build
vercel dev

# 4. Check for case-sensitive import issues
# Common on macOS (case-insensitive) deploying to Linux
find . -name "*.tsx" -o -name "*.ts" | xargs grep -l "from.*[A-Z].*[a-z]"

# 5. Validate package.json
npm pkg get scripts
pnpm install --frozen-lockfile
```

### Issue: Newsletter Signup Failures

```bash
# 1. Check Resend API status
curl -X GET https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY"

# 2. Test API endpoint locally
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 3. Check rate limiting
# Should see 429 after excessive requests
for i in {1..15}; do
  curl -X POST https://givecare.io/api/newsletter \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@example.com"}'
done

# 4. Verify Resend audience configuration
# Check Resend dashboard for audience ID
```

## 📊 Monitoring & Alerting

### Vercel Analytics
- **URL**: https://vercel.com/givecare/give-care-site/analytics
- **Metrics**: 
  - Web Vitals (LCP, FID, CLS, TTFB)
  - Traffic (Unique visitors, page views)
  - Top pages and referrers
  - Geographic distribution

### Google Analytics 4
- **URL**: https://analytics.google.com
- **Property**: GiveCare Website
- **Key Reports**:
  - Real-time users
  - User acquisition channels
  - Engagement metrics
  - Conversion funnels
  - Event tracking

### Setting Up Monitoring

```javascript
// lib/monitoring.ts
export const monitoringConfig = {
  alerts: [
    {
      name: "High Bounce Rate",
      metric: "bounce_rate",
      threshold: 0.7,
      window: "1h",
      severity: "warning"
    },
    {
      name: "Slow Page Load",
      metric: "lcp",
      threshold: 3000,
      window: "5m",
      severity: "critical"
    },
    {
      name: "API Error Rate",
      metric: "api_error_rate",
      threshold: 0.05,
      window: "5m",
      severity: "critical"
    },
    {
      name: "Low Lighthouse Score",
      metric: "lighthouse_performance",
      threshold: 80,
      window: "1d",
      severity: "warning"
    }
  ],
  
  dashboards: {
    performance: "https://vercel.com/givecare/give-care-site/analytics",
    errors: "https://sentry.io/organizations/givecare/issues/",
    uptime: "https://uptime.givecare.io"
  }
}
```

### Custom Analytics Events

```typescript
// Track key user actions
import { trackEvent } from '@/lib/analytics'

// Newsletter signup
trackEvent('newsletter_signup', {
  location: 'footer',
  page: window.location.pathname
})

// CTA clicks
trackEvent('cta_click', {
  text: 'Get Started',
  location: 'hero',
  destination: '/signup'
})

// Blog engagement
trackEvent('article_read', {
  title: article.title,
  category: article.category,
  read_time: timeSpent
})
```

## 🔒 Security Operations

### Environment Variable Management

```bash
# 1. List all environment variables
vercel env ls

# 2. Add new variable (interactive)
vercel env add
# Select: Production, Preview, Development
# Enter name: NEW_API_KEY
# Enter value: ****

# 3. Add variable for specific environments
vercel env add NEW_API_KEY production

# 4. Remove old variable
vercel env rm OLD_API_KEY

# 5. Pull latest to local
vercel env pull .env.local

# 6. Validate no secrets in code
grep -r "api_key\|secret\|password" --include="*.ts" --include="*.tsx" .
```

### Security Checklist

- [ ] All API keys in environment variables
- [ ] Security headers configured (check SecurityHeaders.com)
- [ ] Dependencies updated (`pnpm audit`)
- [ ] No exposed .env files in git
- [ ] Rate limiting active on all API routes
- [ ] CORS properly configured
- [ ] Input validation on all forms
- [ ] Content Security Policy active
- [ ] HTTPS enforced everywhere

### Security Headers Configuration

```javascript
// middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.google-analytics.com *.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: *.google-analytics.com",
    "font-src 'self' data:",
    "connect-src 'self' *.google-analytics.com vitals.vercel-insights.com",
    "frame-ancestors 'none'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  return response
}
```

## 📦 Content Operations

### Blog Post Publishing

```bash
# 1. Create new blog post
mkdir -p content/posts
touch content/posts/new-caregiving-tips.mdx

# 2. Add frontmatter and content
cat > content/posts/new-caregiving-tips.mdx << 'EOF'
---
title: "10 Essential Caregiving Tips for Beginners"
description: "Start your caregiving journey with confidence using these practical tips"
date: "2024-01-18"
author: "Sarah Johnson"
category: "caregiving-tips"
tags: ["beginner", "tips", "caregiving"]
image: "/images/blog/caregiving-tips.jpg"
featured: true
---

# Introduction

Your content here...
EOF

# 3. Optimize images before adding
pnpm sharp public/images/blog/original.jpg \
  --resize 1200 \
  --webp \
  --output public/images/blog/caregiving-tips.webp

# 4. Preview locally
pnpm dev
# Visit http://localhost:3000/news/new-caregiving-tips

# 5. Deploy
git add .
git commit -m "feat: add new caregiving tips blog post"
git push origin main
```

### Static Asset Management

```bash
# Optimize all images
find public/images -name "*.jpg" -o -name "*.png" | while read img; do
  pnpm sharp "$img" \
    --resize 1200 \
    --webp \
    --output "${img%.*}.webp"
done

# Check for large files
find public -type f -size +200k -exec ls -lh {} \;

# Generate blur placeholders for Next.js
pnpm plaiceholder public/images/hero.jpg

# Compress SVGs
pnpm svgo public/**/*.svg

# Clear CDN cache after updates
vercel --prod --force
```

## 🔄 Deployment Process

### Standard Deployment Flow

```bash
# 1. Pre-deployment checks
pnpm test
pnpm lint
pnpm type-check
pnpm build

# 2. Create feature branch
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/new-feature
# Create PR on GitHub

# 4. Preview deployment (automatic)
# Vercel creates preview for each PR
# URL format: https://give-care-site-pr-123.vercel.app

# 5. After PR approval and merge
# Vercel auto-deploys to production

# 6. Verify production deployment
curl -I https://givecare.io
# Check Vercel dashboard for status

# 7. Monitor post-deployment
# - Check Web Vitals
# - Monitor error rates
# - Verify all features work
```

### Emergency Rollback

```bash
# Option 1: Instant rollback via Vercel Dashboard
# 1. Go to https://vercel.com/givecare/give-care-site
# 2. Click "Deployments" tab
# 3. Find last working deployment
# 4. Click "..." menu → "Rollback to this deployment"

# Option 2: CLI rollback
vercel list --prod
vercel rollback [deployment-url]

# Option 3: Git revert
git revert HEAD
git push origin main

# Verify rollback
curl -I https://givecare.io
vercel logs --prod --since 10m
```

## 📡 API Management

### Newsletter API Operations

```bash
# Test newsletter endpoint
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Monitor Resend dashboard
# https://resend.com/emails
# Check for:
# - Delivery rates (target: >95%)
# - Bounce rates (target: <5%)
# - API quota usage

# Test rate limiting
for i in {1..12}; do
  curl -X POST https://givecare.io/api/newsletter \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@example.com"}'
  sleep 1
done
# Should see 429 after 10 requests
```

### Contact Form API

```bash
# Test contact form
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Partnership Inquiry",
    "message": "I would like to learn more about partnerships."
  }'

# Monitor email delivery
# Check team inbox for contact form submissions
# Verify auto-reply if configured
```

## 🔥 Emergency Procedures

### Website Outage Response

```bash
# 1. Immediate Assessment
curl -I https://givecare.io
# Check HTTP status code

# 2. Check Vercel Status
# https://www.vercel-status.com/
vercel list --prod

# 3. Quick Diagnostics
# Recent deployments
vercel list --limit 5

# Recent errors
vercel logs --prod --since 30m | grep ERROR

# 4. Rollback if needed
# Use Vercel dashboard for instant rollback
# Or find last working deployment:
vercel list --prod | grep "Ready"
vercel rollback [deployment-url]

# 5. Communication Plan
# - Update status page
# - Post in #incidents Slack
# - Tweet if extended outage
# - Email key stakeholders
```

### Performance Crisis Response

```bash
# 1. Enable Static Fallback
# Update next.config.js to force static generation
export const dynamic = 'force-static'

# 2. Quick Performance Wins
# Disable non-critical features
vercel env add FEATURE_CHAT false --production

# Reduce image quality temporarily
vercel env add NEXT_PUBLIC_IMAGE_QUALITY 75 --production

# 3. Clear all caches
rm -rf .next node_modules/.cache

# 4. Emergency optimizations
# Remove heavy dependencies
pnpm remove [heavy-package]

# Disable animations
vercel env add NEXT_PUBLIC_REDUCED_MOTION true --production

# 5. Redeploy with optimizations
vercel --prod --force
```

### Security Incident Response

1. **Contain**
   ```bash
   # Rotate compromised keys immediately
   vercel env rm COMPROMISED_KEY --yes
   vercel env add COMPROMISED_KEY [new-value] --production
   
   # Enable maintenance mode if needed
   vercel env add NEXT_PUBLIC_MAINTENANCE_MODE true --production
   ```

2. **Assess**
   - Review access logs
   - Check for unauthorized changes
   - Identify affected systems

3. **Remediate**
   - Patch vulnerabilities
   - Update dependencies
   - Review and update security policies

## 📅 Maintenance Schedule

### Daily Tasks
- [ ] Check Core Web Vitals dashboard
- [ ] Monitor error rates in logs
- [ ] Review form submissions
- [ ] Check for security alerts

### Weekly Tasks
- [ ] Review analytics reports
- [ ] Check for outdated content
- [ ] Run accessibility audit
- [ ] Update dependencies (`pnpm update --interactive`)

### Monthly Tasks
- [ ] Full Lighthouse audit
- [ ] SEO health check (Google Search Console)
- [ ] Security scan (`pnpm audit`)
- [ ] Performance budget review
- [ ] Content audit and updates

### Quarterly Tasks
- [ ] Comprehensive site review
- [ ] Update documentation
- [ ] Review and update error pages
- [ ] Analyze user feedback
- [ ] Plan feature roadmap

## 📈 Scaling Guidelines

### Traffic Scaling

```javascript
// Enable ISR for all blog posts
// app/news/[slug]/page.tsx
export const revalidate = 3600 // Revalidate every hour

// Pre-render popular pages
export async function generateStaticParams() {
  const posts = await getPopularPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}
```

### CDN Configuration

```json
// vercel.json
{
  "headers": [
    {
      "source": "/images/(.*)",
      "headers": [{
        "key": "Cache-Control",
        "value": "public, max-age=31536000, immutable"
      }]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [{
        "key": "Cache-Control",
        "value": "public, max-age=31536000, immutable"
      }]
    },
    {
      "source": "/api/(.*)",
      "headers": [{
        "key": "Cache-Control",
        "value": "no-store, max-age=0"
      }]
    }
  ]
}
```

### Database Scaling (Future)

```typescript
// When adding CMS or user features
// Consider:
// - Planetscale for MySQL
// - Supabase for Postgres
// - Upstash for Redis caching
// - MongoDB Atlas for document store
```

## 📞 Contact Information

### Team Contacts
- **Engineering Lead**: #eng-website Slack
- **Design Team**: #design Slack
- **Content Team**: #content Slack
- **Marketing**: #marketing Slack
- **DevOps**: #infrastructure Slack

### Vendor Support
- **Vercel Support**: support@vercel.com or dashboard
- **Resend Support**: support@resend.com
- **Domain Registrar**: Varies (check DNS settings)
- **CDN Support**: Vercel Edge Network included

### Escalation Path
1. On-call Engineer (PagerDuty)
2. Engineering Lead
3. VP of Engineering
4. CTO (critical issues only)

### Resources
- **Internal Wiki**: wiki.givecare.io
- **API Docs**: api.givecare.io/docs
- **Design System**: design.givecare.io
- **Brand Guidelines**: brand.givecare.io

## 🛠️ Useful Scripts

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

echo "🏥 GiveCare Website Health Check"
echo "================================"

# Check main site
echo -n "Main site: "
curl -s -o /dev/null -w "%{http_code}" https://givecare.io

echo -n "\nAPI health: "
curl -s https://givecare.io/api/health | jq -r '.status'

# Check performance
echo "\n\n📊 Performance Metrics:"
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://givecare.io&category=performance" | \
  jq -r '.lighthouseResult.categories.performance.score * 100'

echo "\n✅ Health check complete"
```

### Deployment Verification
```bash
#!/bin/bash
# verify-deployment.sh

DOMAIN="https://givecare.io"

echo "🚀 Verifying deployment..."

# Check routes
routes=("/" "/about" "/news" "/contact")
for route in "${routes[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$route")
  echo "$route: $status"
done

# Check static assets
echo "\nStatic assets:"
curl -s -I "$DOMAIN/_next/static/" | grep "cache-control"

echo "\n✅ Deployment verified"
```