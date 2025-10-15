# Claude Code Instructions for Give Care Story

## Project Context
Give Care Story is a Next.js-based presentation system for creating elegant slide decks about caregiving. The project features a reusable component library, responsive design, and modern typography optimized for presentation delivery.

## Development Philosophy
- **Component-first architecture**: Build reusable slide components over custom implementations
- **Presentation-specific organization**: Each deck lives in its own app directory with shared components
- **Typography excellence**: Gabarito headings + Alegreya body text for professional presentation aesthetics
- **Responsive by default**: Mobile-first design ensuring presentations work across all devices

## Key Architecture Components
- **Next.js App Router**: File-based routing with app directory structure
- **Component Library**: Centralized slide components in `/app/components/slides/`
- **Typography System**: Optimized font loading with semantic typography components
- **Styling**: Tailwind CSS with custom slide color palette and animations
- **Multi-deck Support**: Individual presentations in separate app folders (`/dignity/`, `/advocate/`)

## Important Files & Structure
```
app/
├── components/               # Global reusable components
│   └── slides/              # Slide component library
│       ├── SlideLayout.tsx  # Base slide wrapper with variants
│       ├── Typography.tsx   # Semantic typography components
│       ├── ContentLayout.tsx # Layout patterns (centered, two-column)
│       ├── MediaComponents.tsx # Images, logos, mockups
│       └── index.ts         # Component exports
├── dignity/                 # Individual presentation folder
│   ├── page.tsx            # Main presentation file
│   └── slides/             # Presentation-specific slides
│       ├── cover.tsx
│       ├── quote-care.tsx
│       └── [other-slides].tsx
├── advocate/               # Another presentation folder
│   ├── page.tsx
│   └── slides/
├── globals.css             # Global styles with font definitions
└── layout.tsx              # Root layout with font loading
```

## Code Standards & Patterns
- **Prefer editing existing files** over creating new ones
- **Follow component patterns** established in `/app/components/slides/`
- **Use TypeScript** for all components with proper prop typing
- **Semantic component names** (SlideTitle, SlideBody, not just Title, Body)
- **No comments** unless explicitly requested by user
- **Consistent spacing** using Tailwind's 4, 6, 8, 12 spacing scale

## Development Guidelines
- **Component imports**: Always import from `../../components/slides` in presentation slides
- **Layout variants**: Use SlideLayout variants (cream, dark, video, custom) appropriately
- **Typography hierarchy**: SlideTitle > SlideSubtitle > SlideBody for proper heading structure
- **Responsive design**: Test components at sm, md, lg, xl breakpoints
- **Animation patterns**: Use existing fade-in and slide-up animations

## Development Workflow
1. **Identify slide type** needed (cover, content, quote, media, etc.)
2. **Check existing components** in `/app/components/slides/` first
3. **Create presentation-specific slides** in appropriate `/slides/` folder
4. **Import and compose** from component library
5. **Test responsiveness** across screen sizes

## Current Technical Context
- **Font Loading**: Next.js optimized loading of Gabarito and Alegreya fonts
- **Color System**: Custom slide-cream (#FFE8D6) and slide-dark (#1a1a1a) backgrounds
- **Animation System**: Framer Motion for smooth transitions and reveals
- **Image Optimization**: Next.js Image component for all media assets
- **Build System**: Static export optimized for presentation delivery

## Key Patterns Established
- **SlideLayout component** handles all background variants and base styling
- **Typography components** maintain consistent hierarchy and spacing
- **MediaComponents** provide standardized image and logo handling
- **ContentLayout** manages responsive column layouts and centering

## Common Commands
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server  
npm run start

# Lint codebase
npm run lint
```

## Current Focus
**Component library maturation and reusability** - moving from presentation-specific components to a robust, shared component system. Priority is on consolidating patterns and ensuring new presentations can be built quickly using existing components.

## Component Development
When creating new slide components:
- Use semantic names that describe purpose, not appearance
- Accept className prop for customization while maintaining base styles
- Export from `/app/components/slides/index.ts` for easy importing
- Include responsive design considerations from the start
- Follow established animation and transition patterns