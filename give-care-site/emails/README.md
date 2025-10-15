# GiveCare Email Templates

React Email templates for GiveCare assessment results and notifications.

## Assessment Results Email

**Template:** `AssessmentResults.tsx`
**Purpose:** Send BSFC (Burden Scale for Family Caregivers) assessment results to users via email.

### Usage

```typescript
import { AssessmentResults } from '@/emails';
import { render } from '@react-email/render';
import * as React from 'react';

const emailHtml = await render(
  React.createElement(AssessmentResults, {
    email: 'user@example.com',
    score: 18,
    band: 'Moderate', // 'Mild' | 'Moderate' | 'Severe'
    interpretation: 'Your burden level is moderate...',
    pressureZones: [
      {
        name: 'Physical Health Impact',
        severity: 'moderate',
        description: 'Your caregiving duties are affecting your physical wellbeing.'
      }
    ]
  }),
  { pretty: false } // Minify to prevent Gmail clipping (102KB limit)
);
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `email` | `string` | Yes | User's email address (used for unsubscribe link) |
| `score` | `number` | Yes | BSFC score (0-30) |
| `band` | `'Mild' \| 'Moderate' \| 'Severe'` | Yes | Burden level category |
| `interpretation` | `string` | Yes | Personalized interpretation text |
| `pressureZones` | `PressureZone[]` | No | Key areas of caregiver burden (optional) |

### Design Principles

1. **Trauma-Informed Language**: Uses validating, empowering language following P1-P6 principles
2. **Single Screen**: Optimized to display without clipping on mobile and desktop
3. **Accessible**: WCAG 2.1 AA compliant with proper color contrast and semantic HTML
4. **Email-Safe**: Table-based layouts compatible with all email clients

### Styling

- **Background**: Tan (#FFE8D6) - warm, calming
- **Primary Text**: Brown (#54340E, #78350f) - readable, professional
- **Body Font**: Georgia (serif) - approachable, readable
- **Heading Font**: System sans-serif - clean, modern

### Key Sections

1. **Logo** - GiveCare branding
2. **Score Display** - Large, clear score with /30 total
3. **Burden Band** - Color-coded severity level
4. **Validation Message** - Trauma-informed acknowledgment
5. **Interpretation** - Personalized assessment feedback
6. **Key Areas** - Optional pressure zones breakdown
7. **GiveCare Description** - SMS-based value proposition
8. **CTA Button** - "Explore Support" with promo code
9. **Footer** - Unsubscribe link (mailto)

### Email Size Optimization

**Gmail clips emails over 102KB.** To prevent clipping:

- ✅ Use `pretty: false` when rendering
- ✅ Minimize inline styles
- ✅ Avoid large images or base64 encoding
- ✅ Keep content concise

### Unsubscribe Handling

Currently uses `mailto:` for simplicity:
- Link: `mailto:hello@my.givecareapp.com?subject=Unsubscribe`
- Header: `List-Unsubscribe: <mailto:hello@my.givecareapp.com?subject=Unsubscribe>`

**Future:** Implement `/api/unsubscribe` endpoint for one-click unsubscribe (Gmail/Yahoo 2024 requirement).

### Development

```bash
# Preview email templates at localhost:3001
pnpm email:dev

# Send test email
curl -X POST http://localhost:3000/api/assessment/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "score": 18,
    "band": "Moderate",
    "pressureZones": []
  }'
```

### API Integration

See `app/api/assessment/email/route.ts` for full implementation.

```typescript
// Example: Send assessment results email
await resend.emails.send({
  from: 'GiveCare <hello@my.givecareapp.com>',
  to: email,
  subject: 'Your Caregiver Burden Assessment Results',
  html: emailHtml,
  headers: {
    'List-Unsubscribe': `<mailto:hello@my.givecareapp.com?subject=Unsubscribe>`,
  },
});
```

### References

- [React Email Documentation](https://react.email)
- [Resend Email API](https://resend.com/docs)
- [BSFC Scale](https://www.caregiver-scales.de/en/haeusliche-pflege-skala-langform/)
- [Trauma-Informed Design Guide](../docs/reference/trauma-guide.md)
