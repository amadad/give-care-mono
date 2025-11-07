import { capability } from './factory';
import { sendEmail } from '../services/email';

export const processAlertsCapability = capability({
  name: 'alerts.process',
  description: 'Process pending caregiver alerts (email workflows).',
  costHint: 'medium',
  latencyHint: 'medium',
  io: {},
  async run(_input, ctx) {
    const alerts = await ctx.store.fetchPendingAlerts(5);
    if (!alerts.length) {
      return { processed: 0 };
    }

    for (const alert of alerts) {
      if (alert.channel === 'email' && alert.payload?.to) {
        const subject = alert.payload.subject ?? `GiveCare check-in (${alert.severity})`;
        const body = `${alert.message}\n\nNeed immediate support? Reply or text 988.`;
        try {
          await sendEmail({ to: alert.payload.to as string, subject, text: body });
          await ctx.store.logEmailDelivery({
            userId: alert.payload.userId as string | undefined,
            to: alert.payload.to as string,
            subject,
            status: 'sent',
            traceId: ctx.trace.id,
          });
          await ctx.store.markAlertProcessed(alert.id, { deliveredVia: 'email' });
        } catch (error) {
          ctx.trace.push('alert.email.error', { id: alert.id, message: (error as Error).message });
        }
      } else {
        await ctx.store.markAlertProcessed(alert.id, { deliveredVia: 'sms', metadata: { skipped: true } });
      }
    }

    return { processed: alerts.length };
  },
});
