/**
 * File and Image Handling for MMS Support
 *
 * Provides utilities for:
 * - Storing files/images to Convex file storage
 * - Generating public URLs for LLM consumption
 * - Tracking file references in messages
 * - Cleaning up unused files
 */

import { v } from 'convex/values';
import { internalMutation, internalAction } from '../_generated/server';
import type { ActionCtx } from '../_generated/server';
import { components } from '../_generated/api';
import { storeFile, getFile } from '@convex-dev/agent';

/**
 * Store a file from MMS message
 * Returns fileId for reference in message metadata
 */
export const storeMMSFile = internalAction({
  args: {
    blob: v.any(), // Blob data from Twilio
    mimeType: v.string(),
    filename: v.optional(v.string()),
    sha256: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { file } = await storeFile(
      ctx,
      components.agent,
      args.blob,
      {
        filename: args.filename,
        sha256: args.sha256,
      }
    );

    console.log(`File stored: ${file.fileId}, size: ${args.blob.size} bytes`);

    return {
      fileId: file.fileId,
      url: file.url,
      storageId: file.storageId,
      mimeType: args.mimeType,
    };
  },
});

/**
 * Get file parts for message content
 * Returns appropriate part type (image or file) for LLM
 */
export const getMessageFileParts = internalAction({
  args: {
    fileIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const parts = [];

    for (const fileId of args.fileIds) {
      const { filePart, imagePart } = await getFile(ctx, components.agent, fileId);

      // Prefer image part if available (for vision models)
      if (imagePart) {
        parts.push(imagePart);
      } else if (filePart) {
        parts.push(filePart);
      }
    }

    return parts;
  },
});

/**
 * Check if MIME type is an image
 */
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if MIME type is supported by vision models
 */
export function isSupportedImageType(mimeType: string): boolean {
  const supported = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return supported.includes(mimeType);
}

/**
 * Vacuum unused files (cron job)
 * Removes files that are no longer referenced by any messages
 */
export const vacuumUnusedFiles = internalMutation({
  args: {
    olderThanDays: v.optional(v.number()), // Default: 30 days
  },
  handler: async (ctx, args) => {
    const daysAgo = args.olderThanDays || 30;
    const _cutoffTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000;

    console.log(`[File Vacuum] Starting cleanup for files older than ${daysAgo} days`);

    // Get all files from agent component (would need to add this query)
    // For now, this is a placeholder showing the pattern
    // Actual implementation would require querying the agent component's file table

    console.log(`[File Vacuum] Cleanup complete`);
  },
});

/**
 * Helper to build message content with files
 * Combines text and file parts into proper message format
 */
export async function buildMessageWithFiles(
  ctx: ActionCtx,
  text: string,
  fileIds?: string[]
): Promise<any> {
  if (!fileIds || fileIds.length === 0) {
    return {
      role: 'user' as const,
      content: text,
    };
  }

  const fileParts = await ctx.runAction(getMessageFileParts as any, { fileIds });

  return {
    role: 'user' as const,
    content: [
      ...fileParts,
      { type: 'text' as const, text },
    ],
  };
}

/**
 * Download file from URL (for Twilio MMS)
 * Returns blob for storage
 */
export async function downloadFileFromUrl(
  url: string,
  authHeader?: string
): Promise<{ blob: Blob; mimeType: string }> {
  const headers: Record<string, string> = {};
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const blob = await response.blob();
  const mimeType = response.headers.get('content-type') || 'application/octet-stream';

  return { blob, mimeType };
}
