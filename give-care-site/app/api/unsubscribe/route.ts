import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

async function unsubscribeEmail(email: string) {
  // TODO: Store unsubscribe in database
  // await db.unsubscribes.create({ email, unsubscribedAt: new Date() });

  // Remove from Resend audience if exists
  if (process.env.RESEND_AUDIENCE_ID) {
    try {
      await resend.contacts.remove({
        email,
        audienceId: process.env.RESEND_AUDIENCE_ID,
      });
      console.log(`✅ Removed ${email} from Resend audience`);
    } catch (error) {
      console.log('Failed to remove from Resend audience (may not exist):', error);
    }
  }
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
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

  await unsubscribeEmail(email);

  // Escape email to prevent XSS
  const safeEmail = escapeHtml(email);

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Unsubscribed - GiveCare</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 500px;
            margin: 80px auto;
            padding: 0 24px;
            text-align: center;
            background: #FFE8D6;
            color: #54340E;
          }
          h1 { font-size: 24px; font-weight: 500; margin-bottom: 16px; }
          p { line-height: 1.6; color: #78350f; }
          a { color: #92400e; text-decoration: none; }
        </style>
      </head>
      <body>
        <h1>You've been unsubscribed</h1>
        <p>We've removed <strong>${safeEmail}</strong> from our assessment results mailing list.</p>
        <p>You won't receive any more emails from us.</p>
        <p><a href="https://www.givecareapp.com">Return to GiveCare</a></p>
      </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  // Handle one-click unsubscribe (Gmail/Yahoo requirement)
  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return new NextResponse('', { status: 400 });
  }

  await unsubscribeEmail(email);

  // Return blank page with 202 Accepted as per Resend requirements
  return new NextResponse('', { status: 202 });
}
