import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { env } from '@/lib/env';
import { NewsletterSubscriptionSchema, ValidationUtils } from '@/lib/validation';
import { handleApiError, validateMethod, successResponse, checkRateLimit, ApiError } from '@/lib/api-utils';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const resend = new Resend(env.RESEND_API_KEY);
const ADMIN_EMAIL = env.NEWSLETTER_ADMIN_EMAIL || 'admin@givecare.app';

export async function POST(req: NextRequest) {
  try {
    // Validate request method
    validateMethod(req, ['POST']);

    // Rate limiting - allow 5 requests per minute per IP
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    checkRateLimit(`newsletter:${clientIP}`, 5, 60000);

    // Parse and validate request body
    const body = await req.json();
    const { email: rawEmail } = NewsletterSubscriptionSchema.parse(body);

    // Sanitize email
    const email = ValidationUtils.sanitizeEmail(rawEmail);

    // Add the contact to the Resend Audience (if configured)
    const audienceId = env.RESEND_AUDIENCE_ID;
    if (audienceId) {
      const contactResult = await resend.contacts.create({
        email,
        unsubscribed: false,
        audienceId,
      });

      if (contactResult.error) {
        console.error('Resend contact add error:', contactResult.error);
        // Don't fail the request if audience add fails - continue with email
      }
    }

    // Send emails in parallel for better performance
    const [adminEmailResult, confirmationEmailResult] = await Promise.allSettled([
      // Send notification to admin
      resend.emails.send({
        from: 'GiveCare <no-reply@givecare.app>',
        to: ADMIN_EMAIL,
        subject: 'New Newsletter Subscription',
        text: `New subscriber: ${email}`,
      }),
      
      // Send confirmation to user
      resend.emails.send({
        from: 'GiveCare <no-reply@givecare.app>',
        to: email,
        subject: 'Thank you for subscribing to GiveCare!',
        text: 'You have been added to our newsletter. We respect your privacy. Unsubscribe at any time.',
      })
    ]);

    // Log email sending failures but don't fail the request
    if (adminEmailResult.status === 'rejected') {
      console.error('Failed to send admin notification:', adminEmailResult.reason);
    }
    if (confirmationEmailResult.status === 'rejected') {
      console.error('Failed to send confirmation email:', confirmationEmailResult.reason);
    }

    return successResponse({ 
      message: 'Successfully subscribed to newsletter',
      email 
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
} 