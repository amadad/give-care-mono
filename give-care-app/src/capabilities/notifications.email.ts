import { z } from 'zod';
import { capability } from './factory';
import { sendEmail } from '../services/email';

const InputSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const sendEmailCapability = capability({
  name: 'notifications.email.send',
  description: 'Send a caregiver-facing email (Resend).',
  costHint: 'medium',
  latencyHint: 'medium',
  io: { input: InputSchema },
  async run(input, ctx) {
    const payload = InputSchema.parse(input);
    const result = await sendEmail({ to: payload.to, subject: payload.subject, text: payload.body });
    await ctx.store.logEmailDelivery({
      userId: ctx.context.userId,
      to: payload.to,
      subject: payload.subject,
      status: 'sent',
      traceId: ctx.trace.id,
    });
    // Resend API returns { data: { id: string } } on success
    const emailId = result.data?.id ?? 'pending';
    return { id: emailId };
  },
});
