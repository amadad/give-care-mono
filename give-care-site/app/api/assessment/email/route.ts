import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import * as React from 'react';
import { getInterpretation } from '@/lib/bsfc';
import { AssessmentResults } from '@/emails';

export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY);

interface PressureZone {
  name: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, score, band, pressureZones } = body;

    // Validate inputs
    if (!email || typeof score !== 'number' || !band) {
      return NextResponse.json(
        { error: 'Missing required fields: email, score, band' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const interpretation = getInterpretation(band as 'Mild' | 'Moderate' | 'Severe');

    // Generate email HTML using React Email (minified to avoid Gmail clipping at 102KB)
    const emailHtml = await render(
      React.createElement(AssessmentResults, {
        email,
        score,
        band: band as 'Mild' | 'Moderate' | 'Severe',
        interpretation,
        pressureZones: pressureZones || [],
      }),
      { pretty: false } // Minify HTML to prevent Gmail clipping
    );

    // Debug: Log HTML size in KB (use TextEncoder for Edge runtime compatibility)
    const htmlSizeKB = new TextEncoder().encode(emailHtml).byteLength / 1024;
    console.log(`Email HTML size: ${htmlSizeKB.toFixed(2)} KB (Gmail clips at 102KB)`);

    // Send email via Resend
    try {
      await resend.emails.send({
        from: 'GiveCare <hello@my.givecareapp.com>',
        to: email,
        subject: 'Your Caregiver Burden Assessment Results',
        html: emailHtml,
        headers: {
          'List-Unsubscribe': `<mailto:hello@my.givecareapp.com?subject=Unsubscribe>`,
        },
      });

      console.log(`✅ Assessment results email sent to: ${email} (Score: ${score}/30, Band: ${band})`);

      // Add to newsletter audience (optional)
      if (process.env.RESEND_AUDIENCE_ID) {
        try {
          await resend.contacts.create({
            email,
            audienceId: process.env.RESEND_AUDIENCE_ID,
          });
          console.log(`✅ Added ${email} to newsletter audience`);
        } catch (audienceError) {
          console.log('Newsletter audience add skipped or failed (non-critical)');
        }
      }
    } catch (emailError: any) {
      console.error('Failed to send email via Resend:', emailError);
      console.error('Error details:', emailError?.message, emailError?.statusCode, emailError?.response?.data);
      throw emailError; // Fail the request if email doesn't send
    }

    // Optional: Store email capture in database
    // await db.assessmentResults.create({
    //   email,
    //   score,
    //   band,
    //   pressureZones,
    //   emailSentAt: new Date(),
    // });

    return NextResponse.json({
      success: true,
      message: 'Results email sent successfully',
    });
  } catch (error) {
    console.error('Error sending results email:', error);
    return NextResponse.json(
      { error: 'Failed to send results email' },
      { status: 500 }
    );
  }
}
