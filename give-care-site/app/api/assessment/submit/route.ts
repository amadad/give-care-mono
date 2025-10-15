import { NextRequest, NextResponse } from 'next/server';
import { calculateScore, getBurdenBand, identifyPressureZones } from '@/lib/bsfc';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { responses, email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate responses
    if (!Array.isArray(responses) || responses.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid responses: must be an array of 10 values' },
        { status: 400 }
      );
    }

    // Validate each response is 0-3
    for (const response of responses) {
      if (typeof response !== 'number' || response < 0 || response > 3) {
        return NextResponse.json(
          { error: 'Invalid response value: each must be 0-3' },
          { status: 400 }
        );
      }
    }

    // Calculate score and burden band
    const score = calculateScore(responses);
    const band = getBurdenBand(score);
    const pressureZones = identifyPressureZones(responses);

    // Send results email
    try {
      const emailResponse = await fetch(`${request.nextUrl.origin}/api/assessment/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, score, band, pressureZones }),
      });

      if (!emailResponse.ok) {
        console.error('Failed to send results email');
      }
    } catch (emailError) {
      console.error('Error sending results email:', emailError);
      // Don't fail the whole request if email fails
    }

    // Optional: Store in database here
    // await storeAssessmentResult({ email, responses, score, band, pressureZones });

    return NextResponse.json({
      success: true,
      message: 'Assessment submitted and results sent',
    });
  } catch (error) {
    console.error('Error processing assessment:', error);
    return NextResponse.json(
      { error: 'Failed to process assessment' },
      { status: 500 }
    );
  }
}
