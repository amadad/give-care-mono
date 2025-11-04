/**
 * Design tokens for email components
 * Consistent with give-care-site design system (amber palette, trauma-informed)
 */

export const emailColors = {
  background: {
    primary: '#FFE8D6', // Warm cream
    secondary: '#ffffff',
    card: '#ffffff',
    muted: '#FEF3E2',
  },
  text: {
    primary: '#54340E', // Dark amber
    secondary: '#78350f', // Medium amber
    muted: '#92400e', // Light amber
    accent: '#c4915a', // Highlight amber
  },
  border: {
    light: '#f5e6d3',
    medium: '#f0d9bf',
    accent: '#f59e0b',
  },
  accent: {
    amber: '#f59e0b',
    success: '#10b981',
    warning: '#ef4444',
    info: '#3b82f6',
  },
  severity: {
    low: '#10b981',
    moderate: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  },
}

export const emailTypography = {
  heading: {
    hero: {
      fontSize: '32px',
      fontWeight: '600' as const,
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
      fontFamily: 'Georgia, "Times New Roman", serif',
    },
    section: {
      fontSize: '24px',
      fontWeight: '600' as const,
      lineHeight: '1.3',
      letterSpacing: '-0.01em',
      fontFamily: 'Georgia, "Times New Roman", serif',
    },
    card: {
      fontSize: '18px',
      fontWeight: '600' as const,
      lineHeight: '1.4',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    small: {
      fontSize: '14px',
      fontWeight: '600' as const,
      lineHeight: '1.4',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
  },
  body: {
    large: {
      fontSize: '18px',
      fontWeight: '400' as const,
      lineHeight: '1.6',
      fontFamily: 'Georgia, "Times New Roman", serif',
    },
    medium: {
      fontSize: '16px',
      fontWeight: '400' as const,
      lineHeight: '1.6',
      fontFamily: 'Georgia, "Times New Roman", serif',
    },
    small: {
      fontSize: '14px',
      fontWeight: '400' as const,
      lineHeight: '1.5',
      fontFamily: 'Georgia, "Times New Roman", serif',
    },
  },
  label: {
    fontSize: '13px',
    fontWeight: '500' as const,
    lineHeight: '1.4',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
}

export const emailSpacing = {
  section: '32px', // Between major sections
  block: '24px', // Between content blocks
  card: '20px', // Within cards
  inline: '12px', // Between inline elements
  tight: '8px', // Minimal spacing
}

export const emailLayout = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '0 24px',
  },
  card: {
    padding: '24px',
    borderRadius: '12px',
    border: `1px solid ${emailColors.border.light}`,
  },
  section: {
    paddingTop: emailSpacing.section,
    paddingBottom: emailSpacing.section,
  },
}

export const emailButton = {
  primary: {
    backgroundColor: emailColors.text.primary,
    color: '#ffffff',
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: '600' as const,
    borderRadius: '8px',
    textDecoration: 'none',
    display: 'inline-block',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: emailColors.text.primary,
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: '600' as const,
    borderRadius: '8px',
    textDecoration: 'none',
    display: 'inline-block',
    border: `2px solid ${emailColors.border.medium}`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  link: {
    color: emailColors.text.secondary,
    textDecoration: 'underline',
    fontWeight: '500' as const,
  },
}

/**
 * Trauma-informed tone presets (P1-P6 compliant)
 */
export const emailTone = {
  validation: {
    // P1: Acknowledge > Answer > Advance
    prefix: [
      'What you\'re feeling is real.',
      'Your experience matters.',
      'This burden is measurable—and manageable.',
      'You\'re not imagining this.',
    ],
  },
  encouragement: {
    // Soft, non-pushy language
    phrases: [
      'When you\'re ready',
      'If this feels right',
      'No pressure',
      'At your own pace',
    ],
  },
  boundary: {
    // P3: Respect boundaries, P5: Always offer skip
    options: [
      'Unsubscribe anytime',
      'Skip to other topics',
      'Take a break when needed',
      'Only what feels helpful',
    ],
  },
}

/**
 * Accessibility helpers
 */
export const emailA11y = {
  link: {
    // Minimum contrast ratio for WCAG AA
    minContrast: '4.5:1',
    // Clear focus indicators
    focusOutline: `2px solid ${emailColors.accent.info}`,
    focusOutlineOffset: '2px',
  },
  // Semantic HTML helpers
  role: {
    article: 'article',
    navigation: 'navigation',
    banner: 'banner',
    contentinfo: 'contentinfo',
  },
}

/**
 * Email client compatibility
 */
export const emailCompat = {
  // Gmail clips emails > 102KB
  maxSize: '102KB',
  // Use table-based layouts for Outlook
  useTableLayout: true,
  // Inline all styles (no external CSS)
  inlineStyles: true,
  // Fallback fonts for email clients
  fontStack: {
    serif: 'Georgia, "Times New Roman", serif',
    sansSerif: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
}
