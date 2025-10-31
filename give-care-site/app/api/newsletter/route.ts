import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { ConvexHttpClient } from 'convex/browser';
import { api } from 'give-care-app/convex/_generated/api';

const resend = new Resend(process.env.RESEND_API_KEY);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Simple in-memory rate limiter per IP (sliding window)
// Limits: 5 requests per 10 minutes per IP
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
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
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    const { email } = parsed.data;

    // Upsert to unified contact system
    const result = await convex.mutation(api.functions.emailContacts.upsert, {
      email,
      tags: ['newsletter'],
      preferences: {
        newsletter: true,
        assessmentFollowup: false,
        productUpdates: true,
      },
    });

    // Optionally sync to Resend audience (if configured)
    if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
      try {
        await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID as string,
        });
      } catch (err) {
        // Ignore if already exists in Resend
        console.log('Resend sync skipped (may already exist):', email);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      isNew: result.isNew,
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);

    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    );
  }
}
