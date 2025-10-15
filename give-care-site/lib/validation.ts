import { z } from 'zod';

/**
 * Plan type definition
 * Note: Currently using same Stripe price ID for both plans
 */
export const PlanTypeSchema = z.enum(['monthly', 'annual']);
export type PlanType = z.infer<typeof PlanTypeSchema>;

/**
 * Checkout request validation schema
 */
export const CheckoutRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email must be less than 254 characters'),
  
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),
  
  plan_type: PlanTypeSchema,
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

/**
 * Newsletter subscription validation schema
 */
export const NewsletterSubscriptionSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email must be less than 254 characters'),
});

export type NewsletterSubscription = z.infer<typeof NewsletterSubscriptionSchema>;

/**
 * Common validation utilities
 */
export const ValidationUtils = {
  /**
   * Sanitize string input
   */
  sanitizeString: (input: string): string => {
    return input.trim().replace(/\s+/g, ' ');
  },

  /**
   * Normalize phone number to E.164 format
   */
  normalizePhoneNumber: (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Add country code if missing (assumes US)
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // Return as-is if already has country code
    return `+${digits}`;
  },

  /**
   * Validate and sanitize email
   */
  sanitizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },
};

/**
 * API response validation schemas
 */
export const ApiResponseSchema = z.object({
  data: z.unknown().optional(),
  error: z.string().optional(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

/**
 * Stripe session response schema
 */
export const StripeSessionResponseSchema = z.object({
  client_secret: z.string().min(1, 'Client secret is required'),
});

export type StripeSessionResponse = z.infer<typeof StripeSessionResponseSchema>;