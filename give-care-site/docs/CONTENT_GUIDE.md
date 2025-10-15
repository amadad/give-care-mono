# GiveCare Content Creation Guide

## Overview

This guide provides instructions for creating and managing content on the GiveCare marketing website. It covers blog posts, landing pages, and general content guidelines.

## Content Philosophy

### Core Principles
1. **Empathy First**: Always lead with understanding and compassion
2. **Practical Value**: Provide actionable advice and real solutions
3. **Inclusive Language**: Respect all caregiving situations and relationships
4. **Evidence-Based**: Support claims with research and expert opinions
5. **Hope & Support**: Balance challenges with encouragement

### Target Audience
- **Primary**: Family caregivers (adult children, spouses, siblings)
- **Secondary**: Professional caregivers seeking resources
- **Tertiary**: Healthcare providers and care facilities

## Blog Post Creation

### MDX File Structure

Create new blog posts in `content/posts/`:

```mdx
---
title: "10 Self-Care Tips for Family Caregivers"
description: "Practical strategies to maintain your well-being while caring for a loved one"
date: "2024-03-15"
author: "Sarah Johnson"
category: "wellness"
tags: ["self-care", "mental-health", "caregiving-tips"]
image: "/images/blog/self-care-tips.jpg"
featured: true
---

import { Callout } from '@/components/mdx/Callout'
import { VideoEmbed } from '@/components/mdx/VideoEmbed'

# {frontMatter.title}

Lead paragraph that hooks the reader and summarizes the value they'll get from this article...

## Introduction

Set up the problem and why this matters...

<Callout type="tip">
  Remember: Taking care of yourself isn't selfish—it's essential for sustainable caregiving.
</Callout>

## Main Content

### 1. Establish Daily Routines

Content with practical examples...

<VideoEmbed 
  url="https://youtube.com/..."
  title="Morning Routine for Caregivers"
/>

### 2. Set Boundaries

More content...

## Conclusion

Wrap up with encouragement and next steps...

## Additional Resources

- [Link to related article](/news/related-article)
- [External resource](https://example.com)
```

### Front Matter Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| title | Yes | Article headline | "Understanding Dementia Behaviors" |
| description | Yes | Meta description (150-160 chars) | "Learn how to respond to common dementia behaviors with patience and understanding" |
| date | Yes | Publication date | "2024-03-15" |
| author | Yes | Author name | "Dr. Maria Chen" |
| category | Yes | Content category | "dementia-care" |
| tags | Yes | Array of tags | ["dementia", "behaviors", "communication"] |
| image | Yes | Hero image path | "/images/blog/dementia-behaviors.jpg" |
| featured | No | Feature on homepage | true |
| draft | No | Hide from production | true |

### Content Categories

Use these standardized categories:

- `company-news` - Updates and announcements
- `caregiving-tips` - Practical advice
- `dementia-care` - Dementia-specific content
- `wellness` - Self-care and mental health
- `resources` - Guides and tools
- `personal-stories` - User experiences
- `research` - Studies and findings
- `advocacy` - Policy and rights

### Writing Style Guide

#### Tone & Voice
- **Compassionate**: "We understand this is challenging"
- **Authoritative**: "Research shows that..."
- **Conversational**: "You might be wondering..."
- **Encouraging**: "You're doing important work"

#### Language Guidelines

✅ **DO Use:**
- Person-first language: "person with dementia"
- Active voice: "You can help by..."
- Concrete examples: "Try setting a timer for 15 minutes"
- Inclusive pronouns: "they/them" when gender unknown

❌ **DON'T Use:**
- Medical jargon without explanation
- Patronizing language: "suffering from"
- Absolute statements: "always/never"
- Stigmatizing terms: "demented", "burden"

### SEO Optimization

#### Title Optimization
```mdx
---
title: "How to Talk to Someone with Dementia: 10 Communication Tips"
# Good: Includes keywords, number, clear benefit
---
```

#### Meta Description
```mdx
---
description: "Learn effective communication strategies for dementia care. Expert tips for meaningful conversations with your loved one."
# 150-160 characters, includes keywords, clear value proposition
---
```

#### Content Structure
1. **H1**: Use frontMatter.title
2. **H2**: Major sections (3-5 per article)
3. **H3**: Subsections as needed
4. **Lists**: Break up text with bullet points
5. **Bold**: Emphasize key points
6. **Links**: 2-3 internal, 1-2 external (authoritative)

### Image Guidelines

#### Hero Images
- **Size**: 1200x630px (Open Graph standard)
- **Format**: WebP with JPEG fallback
- **Compression**: Under 200KB
- **Alt Text**: Descriptive for accessibility

#### In-Content Images
- **Size**: 800px max width
- **Format**: WebP preferred
- **Placement**: After introductions, before new sections
- **Captions**: Always include descriptive captions

### MDX Components

#### Available Components

```mdx
import { Callout } from '@/components/mdx/Callout'
import { VideoEmbed } from '@/components/mdx/VideoEmbed'
import { ResourceCard } from '@/components/mdx/ResourceCard'
import { QuickTip } from '@/components/mdx/QuickTip'
import { FAQ } from '@/components/mdx/FAQ'

<Callout type="info|tip|warning|success">
  Important information highlighted
</Callout>

<VideoEmbed 
  url="https://youtube.com/watch?v=..."
  title="Descriptive title"
  caption="Optional caption"
/>

<ResourceCard
  title="Downloadable Guide"
  description="Brief description"
  link="/resources/guide.pdf"
  type="pdf|video|article"
/>

<QuickTip>
  Brief, actionable advice in a styled box
</QuickTip>

<FAQ>
  <FAQ.Question>Common question?</FAQ.Question>
  <FAQ.Answer>Detailed answer...</FAQ.Answer>
</FAQ>
```

## Landing Page Content

### Page Structure

```typescript
// app/about/page.tsx
export default function AboutPage() {
  return (
    <>
      <Hero 
        title="About GiveCare"
        subtitle="Our mission to support family caregivers"
      />
      <Section>
        <Container>
          {/* Content sections */}
        </Container>
      </Section>
    </>
  )
}
```

### Content Sections

#### Hero Sections
- **Headline**: 6-10 words, benefit-focused
- **Subheadline**: 15-25 words, expand on value
- **CTA**: Action-oriented button text
- **Image/Video**: Relevant, emotional connection

#### Feature Sections
- **Icon**: Representative visual
- **Title**: Feature name (3-5 words)
- **Description**: Benefit-focused (20-30 words)
- **Link**: Learn more (optional)

#### Testimonials
- **Quote**: Authentic, specific benefits
- **Attribution**: Name, relationship, location
- **Image**: Real photo if available
- **Context**: Caregiving situation

## Content Calendar

### Publishing Schedule
- **Blog Posts**: 2-3 per week
- **News Updates**: As needed
- **Resource Guides**: Monthly
- **Personal Stories**: Bi-weekly

### Content Planning

```markdown
## March 2024 Content Calendar

### Week 1 (Mar 1-7)
- [ ] Blog: "Spring Activities for Dementia Patients"
- [ ] Story: "How GiveCare Helped Me Navigate Dad's Diagnosis"
- [ ] News: "New Feature Announcement"

### Week 2 (Mar 8-14)
- [ ] Blog: "Understanding Sundowning Behaviors"
- [ ] Resource: "Medication Management Checklist"
- [ ] Blog: "Caregiver Burnout: Warning Signs"
```

## Analytics & Optimization

### Key Metrics
- **Page Views**: Track popular topics
- **Time on Page**: Aim for 2+ minutes
- **Bounce Rate**: Under 60%
- **Social Shares**: Engagement indicator
- **Newsletter Signups**: Content-to-conversion

### A/B Testing Ideas
- Headlines: Emotional vs. Practical
- Images: People vs. Illustrations
- CTAs: Button text variations
- Content Length: Short vs. Comprehensive

### Content Iteration
1. **Publish**: Initial version
2. **Measure**: 2-week performance
3. **Analyze**: What worked/didn't
4. **Update**: Improve based on data
5. **Republish**: With updates noted

## Legal & Compliance

### Medical Disclaimer
Include on health-related content:
```
This content is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
```

### Privacy Considerations
- Don't share identifying patient information
- Get written consent for personal stories
- Use pseudonyms when requested
- Respect family privacy

### Copyright & Attribution
- Credit all sources and research
- Use royalty-free or licensed images
- Attribute Creative Commons content
- Link to original sources

## Content Workflow

### 1. Ideation
- Review user questions and feedback
- Monitor caregiving forums and communities
- Track trending topics in healthcare
- Collaborate with clinical advisors

### 2. Creation
- Research thoroughly
- Write first draft
- Add images and components
- Internal review

### 3. Review Process
- Medical accuracy check
- Legal/compliance review
- SEO optimization
- Copy editing

### 4. Publishing
- Create MDX file
- Add images to public folder
- Test all links and components
- Deploy to production

### 5. Promotion
- Share on social media
- Include in newsletter
- Update related content
- Monitor engagement

## Tools & Resources

### Writing Tools
- **Grammarly**: Grammar and clarity
- **Hemingway**: Readability scores
- **CoSchedule Headline Analyzer**: Title optimization
- **Answer The Public**: Topic research

### Image Resources
- **Unsplash**: Free stock photos
- **Pexels**: Diverse imagery
- **Canva**: Design templates
- **TinyPNG**: Image compression

### SEO Tools
- **Google Search Console**: Performance tracking
- **Ahrefs/SEMrush**: Keyword research
- **Schema.org**: Structured data
- **GTmetrix**: Page speed

## Examples of Great Content

### Effective Headlines
- "10 Ways to Make Mealtimes Easier for Dementia Patients"
- "What No One Tells You About Being a Caregiver"
- "The Caregiver's Guide to Self-Compassion"
- "How to Talk to Siblings About Mom's Care"

### Strong Openings
> "When my mother was diagnosed with Alzheimer's, I felt like I was drowning in information yet starving for practical advice. If you're feeling the same way, you're not alone."

### Compelling CTAs
- "Get Your Free Caregiving Checklist"
- "Start Your 7-Day Free Trial"
- "Join 10,000+ Caregivers Getting Support"
- "Download the Complete Guide"

## Continuous Improvement

### Monthly Content Audit
- Review top performing content
- Update outdated information
- Fix broken links
- Refresh images
- Add new related content links

### Quarterly Strategy Review
- Analyze content performance
- Survey user needs
- Adjust content calendar
- Update style guide
- Plan new content types