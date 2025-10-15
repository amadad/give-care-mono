# Give Care Story - Presentation System

A Next.js-based presentation system for Give Care with reusable components and elegant typography.

## Project Structure

```
app/
├── components/           # Global reusable components
│   └── slides/          # Slide component library
│       ├── SlideLayout.tsx
│       ├── Typography.tsx
│       ├── ContentLayout.tsx
│       ├── MediaComponents.tsx
│       └── index.ts
├── dignity/             # Individual presentation folder
│   ├── page.tsx        # Main presentation file
│   └── slides/         # Presentation-specific slides
│       ├── cover.tsx
│       ├── quote-care.tsx
│       └── ...
└── globals.css         # Global styles with font definitions
```

## Typography System

- **Headings**: Gabarito (modern sans-serif)
- **Body Text**: Alegreya (elegant serif)
- **Font Loading**: Optimized with Next.js font loading

## Component Library

### Layout Components
- `SlideLayout` - Base wrapper with variants (cream, dark, video, custom)
- `CenteredContent` - Centered content with responsive sizing
- `VideoOverlay` - Dark overlay for video backgrounds
- `TwoColumnLayout` - Responsive two-column layouts

### Typography Components
- `SlideTitle` - Main slide headings
- `SlideSubtitle` - Secondary headings
- `SlideBody` - Body text with elegant spacing
- `SlideQuote` - Blockquotes with author attribution
- `VideoSlideTitle` - Titles for video backgrounds
- `VideoSlideSubtitle` - Subtitles for video backgrounds

### Media Components
- `GiveCareLogo` - Branded logo with variants
- `FullscreenImage` - Background images
- `ImageCard` - Content images with captions
- `PhoneMockup` - Mobile app demonstrations

## Creating New Presentations

1. Create a new folder: `/app/[presentation-name]/`
2. Add `page.tsx` with slide imports
3. Create slides in `/app/[presentation-name]/slides/`
4. Import components from `../../components/slides`

Example slide structure:
```tsx
import { SlideLayout, CenteredContent, SlideTitle } from "../../components/slides";

export default function MySlide() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent>
        <SlideTitle>My Slide Title</SlideTitle>
      </CenteredContent>
    </SlideLayout>
  );
}
```

## Styling Guidelines

### Color Palette
- **Cream Background**: `#FFE8D6` (slide-cream)
- **Dark Background**: `#1a1a1a` (slide-dark)
- **Text Colors**: Gray scale for hierarchy

### Animations
- `fade-in` - Gentle opacity fade
- `slide-up` - Upward slide with fade

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`
- Consistent spacing and typography scaling

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Migration Plan

As the component library matures:
1. Presentation-specific components move to global `/components`
2. Common patterns become reusable components
3. Styling system consolidates in `/components/slides`
4. Individual presentations maintain minimal custom code

## Best Practices

- Use semantic component names
- Maintain consistent spacing (4, 6, 8, 12 spacing scale)
- Leverage typography hierarchy
- Optimize images with Next.js Image component
- Keep slides focused and readable
- Test across different screen sizes