/**
 * Twilio Component Client
 *
 * Handles SMS sending/receiving via @convex-dev/twilio component
 */

import { Twilio } from '@convex-dev/twilio';
import { components, internal } from '../_generated/api';

export const twilio = new Twilio(components.twilio, {
  defaultFrom: process.env.TWILIO_PHONE_NUMBER!,
});

// Handle incoming messages via callback (defined in internal.ts)
twilio.incomingMessageCallback = internal.internal.handleIncomingMessage;

