import { Twilio } from '@convex-dev/twilio';
import { components, internal } from './_generated/api';

const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
if (!twilioFrom) {
  console.warn('[convex] TWILIO_PHONE_NUMBER not configured. SMS sending will fail.');
}

export const twilio = new Twilio(components.twilio, twilioFrom ? { defaultFrom: twilioFrom } : {});

// TODO: Implement incoming message handler
// twilio.incomingMessageCallback = internal.sms.handleIncomingMessage;
