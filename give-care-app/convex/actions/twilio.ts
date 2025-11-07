"use node";

import type { ActionCtx } from '../_generated/server'
import { components } from '../_generated/api'

export async function sendSMS(ctx: ActionCtx, {
  to,
  body,
}: { to: string; body: string }) {
  // delegate to twilio component
  return ctx.runAction(components.twilio.messages.create, {
    to,
    from: process.env.TWILIO_PHONE_NUMBER!,
    body,
    account_sid: process.env.TWILIO_ACCOUNT_SID!,
    auth_token: process.env.TWILIO_AUTH_TOKEN!,
    status_callback: '',
  })
}

