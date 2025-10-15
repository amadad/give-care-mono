import { z } from 'zod';

const envSchema = z.object({
  // Stripe Configuration (required for checkout/payments)
  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required').optional(),
  STRIPE_PRICE_ID: z.string().min(1, 'Stripe price ID is required').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe webhook secret is required').optional(),
  STRIPE_MONTHLY_PRICE_ID: z.string().min(1, 'Stripe monthly price ID is required').optional(),
  STRIPE_ANNUAL_PRICE_ID: z.string().min(1, 'Stripe annual price ID is required').optional(),

  // Twilio SMS Configuration (required for SMS notifications)
  TWILIO_ACCOUNT_SID: z.string().min(1, 'Twilio Account SID is required').optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1, 'Twilio Auth Token is required').optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().min(1, 'Twilio Messaging Service SID is required').optional(),

  // Resend Configuration (required for emails)
  RESEND_API_KEY: z.string().min(1, 'Resend API key is required').optional(),
  RESEND_AUDIENCE_ID: z.string().min(1, 'Resend audience ID is required').optional(),

  // Application Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url('Site URL must be valid').default('https://givecareapp.com'),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_HOTJAR_ID: z.string().optional(),

  // Optional Configuration
  NEWSLETTER_ADMIN_EMAIL: z.string().email('Admin email must be valid').optional(),
  STRIPE_PAYMENT_LINK: z.string().url().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

// Environment validation with detailed error messages
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your environment variables.`
      );
    }
    throw error;
  }
}

// Cache for validated environment
let cachedEnv: Env | undefined;

// Function that validates environment variables lazily
function getEnv(): Env {
  // If we already validated, return cached result
  if (cachedEnv) {
    return cachedEnv;
  }

  // During build phase, return empty object (this won't be used at runtime)
  if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
    return {} as Env;
  }

  // Runtime validation - validate and cache
  cachedEnv = validateEnv();
  return cachedEnv;
}

// Export as a proxy object that calls getEnv() on property access
export const env = new Proxy({} as Env, {
  get(target, prop: keyof Env) {
    return getEnv()[prop];
  }
});

export type { Env };