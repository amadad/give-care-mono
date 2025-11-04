import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { render } from '@react-email/render';
import { ConvexHttpClient } from 'convex/browser';
import { api } from 'give-care-app/convex/_generated/api';
import AssessmentResults from '@/emails/AssessmentResults';
import { calculateScore, getBurdenBand, getInterpretation } from '@/lib/bsfc';

const resend = new Resend(process.env.RESEND_API_KEY);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Simple in-memory rate limiter per IP
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 3; // 3 emails per 10 minutes per IP
const requestLog = new Map<string, number[]>();

function getClientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const xr = req.headers.get('x-real-ip');
  if (xr) return xr.trim();
  return 'unknown';
}

function isRateLimited(ip: string, now = Date.now()): boolean {
  const times = requestLog.get(ip) ?? [];
  const recent = times.filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    requestLog.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

const bodySchema = z.object({
  email: z.string().email(),
  responses: z.array(z.number().min(0).max(3)).length(10),
  pressureZones: z.array(z.object({
    name: z.string(),
    severity: z.enum(['low', 'moderate', 'high', 'critical']),
    description: z.string(),
    questionIndices: z.array(z.number()).optional(),
  })).optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, responses, pressureZones = [] } = parsed.data;

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('Resend API key not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Calculate score and band using BSFC utilities
    const score = calculateScore(responses);
    const band = getBurdenBand(score);
    const interpretation = getInterpretation(band);

    // Render email template
    const emailHtml = await render(
      AssessmentResults({
        email,
        score,
        band,
        interpretation,
        pressureZones: pressureZones.slice(0, 3), // Top 3 zones
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'GiveCare <hello@my.givecareapp.com>',
      to: [email],
      subject: `Your BSFC Assessment Results: ${band} Burden (${score}/30)`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log(`✅ Assessment results email sent to: ${email} (${band} - ${score}/30)`);

    // Upsert to unified contact system (non-blocking)
    try {
      const pressureZoneNames = pressureZones.map((z) => z.name);
      await convex.mutation(api.functions.emailContacts.upsert, {
        email,
        tags: ['assessment'],
        preferences: {
          newsletter: false,
          assessmentFollowup: true,
          productUpdates: true,
        },
        assessmentData: {
          score,
          band,
          pressureZones: pressureZoneNames,
        },
      });

      // Track email sent
      await convex.mutation(api.functions.emailContacts.trackEmailSent, {
        email,
      });
    } catch (convexError) {
      console.warn('Convex tracking failed (non-blocking):', convexError);
    }

    // Optionally sync to Resend audience
    if (process.env.RESEND_AUDIENCE_ID) {
      try {
        await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        });
      } catch (err) {
        console.log('Resend sync skipped (may already exist):', email);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment results sent to your email',
      score,
      band,
    });
  } catch (error) {
    console.error('Assessment email error:', error);
    return NextResponse.json(
      { error: 'Failed to send assessment results' },
      { status: 500 }
    );
  }
}
