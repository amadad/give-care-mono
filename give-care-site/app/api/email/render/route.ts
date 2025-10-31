import { NextResponse } from 'next/server';
import { renderEmailFromTree, ComponentTree } from '@/lib/email/renderer';

/**
 * Email rendering endpoint
 * Called by Convex to render component tree to HTML
 * (Convex can't import React, so we do rendering here)
 */
export async function POST(request: Request) {
  try {
    const tree: ComponentTree = await request.json();

    // Validate required fields
    if (!tree.subject || !tree.previewText || !tree.components) {
      return NextResponse.json(
        { error: 'Invalid component tree: missing required fields' },
        { status: 400 }
      );
    }

    // Render to HTML
    const html = await renderEmailFromTree(tree);

    return NextResponse.json({
      success: true,
      html,
      subject: tree.subject,
    });
  } catch (error) {
    console.error('Email rendering error:', error);
    return NextResponse.json(
      {
        error: 'Failed to render email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
