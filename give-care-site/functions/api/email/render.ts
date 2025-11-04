import { renderEmailFromTree, ComponentTree } from '../../../lib/email/renderer';

/**
 * Cloudflare Function for email rendering
 * Called by Convex to render component tree to HTML
 * (Convex can't import React, so we do rendering here)
 */
export async function onRequestPost(context: { request: Request }): Promise<Response> {
  try {
    const tree: ComponentTree = await context.request.json();

    // Validate required fields
    if (!tree.subject || !tree.previewText || !tree.components) {
      return new Response(
        JSON.stringify({ error: 'Invalid component tree: missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Render to HTML
    const html = await renderEmailFromTree(tree);

    return new Response(
      JSON.stringify({
        success: true,
        html,
        subject: tree.subject,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Email rendering error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to render email',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
