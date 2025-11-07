"use node";

import type { ActionCtx } from '../_generated/server'
import { MessageHandler } from '../services/MessageHandler'

type IncomingArgs = {
  from: string
  body: string
  messageSid: string
  twilioSignature: string
  requestUrl: string
  params: Record<string, string>
}

export async function processIncomingSMS(ctx: ActionCtx, args: IncomingArgs) {
  const handler = new MessageHandler(ctx)
  return handler.handle(args)
}

