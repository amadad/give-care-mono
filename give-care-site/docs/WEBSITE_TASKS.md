# GiveCare Website Tasks
*Updated: 2025-01-18*

> **Note**: This tracks marketing website development. For SMS backend tasks, see [backend-reference/TASKS.md](backend-reference/TASKS.md)

## 🎯 TO DO

### P0 - Critical Issues 🔥

#### **Core Web Vitals Optimization** ⏱️ 4h
- [ ] Optimize LCP on homepage (current: 3.2s, target: <2.5s)
- [ ] Fix CLS issues on blog listing page (current: 0.15, target: <0.1)
- [ ] Reduce initial JavaScript bundle (current: 125KB, target: <100KB)
- [ ] Implement font-display: swap for web fonts
- **Blocker**: Lighthouse score at 78, affecting SEO

#### **Mobile Navigation Bug** ⏱️ 2h
- [ ] Fix z-index issue with mobile menu overlay
- [ ] Add focus trap for accessibility compliance
- [ ] Smooth animation transitions (reduce jank)
- [ ] Test on iOS Safari 15+ and Chrome Android
- **Impact**: 40% of traffic is mobile

### P1 - Features for Q1 2024

#### **Blog Search Implementation** ⏱️ 6h
- [ ] Evaluate Algolia vs MeiliSearch vs minisearch
- [ ] Create search UI component with debouncing
- [ ] Index all blog posts with categories/tags
- [ ] Add search analytics tracking
- **User Need**: "Can't find specific caregiving topics"

#### **Newsletter Double Opt-in** ⏱️ 4h
- [ ] Design confirmation email template
- [ ] Create /confirm/[token] page route
- [ ] Update Resend integration for two-step flow
- [ ] Add unsubscribe functionality
- **Requirement**: GDPR/CAN-SPAM compliance

#### **Testimonials Carousel** ⏱️ 3h
- [ ] Create testimonial data structure
- [ ] Build carousel component with Framer Motion
- [ ] Add video testimonial support
- [ ] Implement lazy loading for images
- **Goal**: Increase trust and conversion

### P2 - Technical Improvements

#### **Component Documentation** ⏱️ 4h
- [ ] Set up Storybook 7.x
- [ ] Document all UI components
- [ ] Create interactive examples
- [ ] Add accessibility notes
- **Team Need**: Onboarding new developers

#### **E2E Test Suite** ⏱️ 6h
- [ ] Set up Cypress with TypeScript
- [ ] Create critical user journey tests
- [ ] Add visual regression tests
- [ ] Integrate with CI/CD pipeline
- **Coverage Target**: Core flows at 100%

#### **Image Optimization Pipeline** ⏱️ 3h
- [ ] Implement automatic WebP conversion
- [ ] Add responsive image generation
- [ ] Create image component with blur placeholder
- [ ] Set up CDN for static assets
- **Impact**: 30% of page weight is images

### P3 - Growth Features

#### **A/B Testing Framework** ⏱️ 8h
- [ ] Evaluate tools (Optimizely, GrowthBook, custom)
- [ ] Implement feature flag system
- [ ] Create A/B test components
- [ ] Set up analytics integration
- **First Test**: Hero CTA variations

#### **Blog Content Calendar** ⏱️ 2h
- [ ] Create content scheduling system
- [ ] Add draft/published states
- [ ] Implement author profiles
- [ ] Build editorial workflow
- **Goal**: Consistent publishing schedule

## 🚧 DOING

### **Homepage Performance Optimization** (Sarah) - Started: Jan 15
- [x] Audit current performance bottlenecks
- [x] Implement next/dynamic for below-fold sections
- [ ] Optimize hero background image (in progress)
- [ ] Add resource hints for critical assets
- **Status**: 30% improvement so far, testing image formats
- **Blockers**: None

### **MDX Blog Enhancement** (Ahmad) - Started: Jan 12
- [x] Set up MDX with Next.js
- [x] Create custom components
- [ ] Add syntax highlighting (in progress)
- [ ] Create author system
- **Status**: Basic blog working, adding rich features
- **Next**: Code block copy button

## ✅ DONE

### **Next.js 15 Migration** - Completed: Jan 10
- **Duration**: 3 days (estimated 5 days)
- **Results**: 
  - 40% faster development builds with Turbopack
  - Better error messages and debugging
  - Improved TypeScript performance
- **What Worked**: 
  - Incremental migration approach
  - Extensive testing before switching
- **Challenges**: 
  - Some dependencies needed updates
  - Minor breaking changes in middleware

### **Responsive Design System** - Completed: Jan 8
- **Duration**: 4 days
- **Results**:
  - 100% mobile responsive
  - Consistent spacing system
  - Reusable breakpoint utilities
- **What Worked**:
  - Mobile-first approach
  - Container queries for components
  - Tailwind's responsive utilities
- **Key Learning**: Container queries are game-changers

### **Newsletter Integration** - Completed: Jan 5
- **Duration**: 2 days
- **Results**:
  - 15% conversion rate (target was 10%)
  - Clean email validation
  - Smooth UX with loading states
- **What Worked**:
  - Inline form vs modal (2x conversion)
  - Immediate feedback on submission
  - Welcome email automation
- **Integration**: Resend API very developer-friendly

### **SEO Foundation** - Completed: Dec 28
- **Duration**: 3 days
- **Results**:
  - All pages have proper meta tags
  - Rich snippets in search results
  - XML sitemap auto-generated
- **What Worked**:
  - Next.js Metadata API
  - Structured data for blog posts
  - Dynamic OG images
- **Impact**: 25% increase in organic traffic

### **Component Library Setup** - Completed: Dec 20
- **Duration**: 5 days
- **Results**:
  - 30+ reusable components
  - Consistent design language
  - 50% faster feature development
- **What Worked**:
  - DaisyUI for base components
  - Custom wrapper components
  - Comprehensive TypeScript types
- **Decision**: DaisyUI + Tailwind is powerful combo

## 📊 METRICS

### Current Performance
- **Lighthouse Score**: 78 (Target: 90+)
- **Bundle Size**: 245KB (Target: <300KB)
- **LCP**: 3.2s (Target: <2.5s)
- **FID**: 45ms (Target: <100ms) ✅
- **CLS**: 0.08 (Target: <0.1) ✅

### User Engagement
- **Monthly Visitors**: 8,500
- **Average Session**: 1:45
- **Bounce Rate**: 65%
- **Newsletter Signups**: 1,275 (15% conversion)
- **Blog Engagement**: 2:30 average read time

### Conversion Funnel
- Homepage → About: 35%
- Homepage → Blog: 25%
- Blog → Newsletter: 22%
- Homepage → Contact: 8%

## 💡 NOTES

### Architecture Decisions

1. **Server Components by Default**
   - Smaller client bundles
   - Better SEO
   - Faster initial page loads
   - Simplified data fetching

2. **MDX for Content**
   - Rich, interactive content
   - Component embedding
   - Type-safe frontmatter
   - Easy for non-devs to write

3. **Tailwind + DaisyUI**
   - Rapid development
   - Consistent styling
   - Small CSS bundle
   - Great DX

4. **Vercel Deployment**
   - Zero-config deploys
   - Automatic previews
   - Edge network
   - Great Next.js integration

### Lessons Learned

1. **Performance First**
   - Measure before optimizing
   - Images are usually the culprit
   - Lazy load aggressively
   - Monitor Core Web Vitals

2. **Component Design**
   - Composition > inheritance
   - Props for variants
   - Children for flexibility
   - TypeScript for safety

3. **Content Strategy**
   - Quality > quantity
   - SEO from the start
   - User intent focus
   - Regular publishing schedule

4. **Testing Approach**
   - Unit tests for logic
   - Integration for APIs
   - E2E for critical paths
   - Visual regression for UI

### Upcoming Decisions

1. **Search Provider**
   - Algolia (powerful but $$)
   - MeiliSearch (self-hosted)
   - Minisearch (client-side)
   - Custom with Postgres FTS

2. **CMS Integration**
   - Keep MDX files
   - Sanity/Contentful
   - Strapi (self-hosted)
   - Custom admin panel

3. **Analytics Enhancement**
   - Mixpanel for events
   - Hotjar for heatmaps
   - PostHog (all-in-one)
   - Custom solution

### Technical Debt

1. **Missing Tests** (30% coverage)
   - Component unit tests
   - API route tests
   - E2E test suite

2. **Performance Issues**
   - Large hero images
   - Unoptimized fonts
   - No service worker

3. **Accessibility Gaps**
   - Missing ARIA labels
   - Focus management
   - Keyboard navigation

4. **Code Organization**
   - Inconsistent imports
   - Large components
   - Prop drilling

### Success Metrics

**Q1 2024 Targets**:
- Lighthouse Score: 90+
- Monthly Visitors: 15,000
- Newsletter Subscribers: 3,000
- Average Session: 2:30
- Bounce Rate: <60%

**Technical Goals**:
- Test Coverage: 80%
- Build Time: <2 min
- Deploy Time: <3 min
- Zero downtime deploys

## 🔄 PROCESS

### Sprint Planning
- 2-week sprints
- Monday planning
- Friday demos
- Retrospective monthly

### PR Workflow
1. Create feature branch
2. Open draft PR early
3. Request review when ready
4. Address feedback
5. Squash and merge

### Definition of Done
- [ ] Code reviewed
- [ ] Tests written
- [ ] Documentation updated
- [ ] Lighthouse check passed
- [ ] Mobile tested
- [ ] Accessibility verified

### Monitoring
- Daily: Error rates, uptime
- Weekly: Performance metrics
- Monthly: User analytics
- Quarterly: Architecture review