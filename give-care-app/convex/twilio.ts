"use node";

/**
 * Twilio component integration - incoming message callback with agent system
 *
 * Uses "use node" directive to enable Node.js runtime with full API support
 * Required for OpenAI Agents SDK (imported via src/agents.ts)
 *
 * NOTE: Business logic has been extracted to services/MessageHandler.ts
 * This file is now a thin wrapper around the MessageHandler service.
 */

import { internalAction } from './_generated/server';
import { v } from 'convex/values';
import { MessageHandler } from './services/MessageHandler';

/**
 * Incoming SMS message handler
 * Called by @convex-dev/twilio component when user sends a message
 *
 * Delegates all business logic to MessageHandler service for:
 * - Better testability (each method can be unit tested)
 * - Clear separation of concerns
 * - Reduced cognitive complexity
 * - Easier maintenance
 */
export const onIncomingMessage = internalAction({
  args: {
    from: v.string(),
    body: v.string(),
    messageSid: v.string(),
    twilioSignature: v.string(),
    requestUrl: v.string(),
    params: v.any(),
  },
  handler: async (ctx, args) => {
    const handler = new MessageHandler(ctx);

    console.log(`[SMS] Incoming message from ${args.from}: "${args.body}"`);

    return handler.handle(args);
  },
});

/**
 * Register this callback with the Twilio component
 *
 * In your Convex dashboard, configure the component:
 * 1. Navigate to Settings → Components
 * 2. Find the @convex-dev/twilio component
 * 3. Set "Incoming Message Handler" to: twilio.onIncomingMessage
 */
