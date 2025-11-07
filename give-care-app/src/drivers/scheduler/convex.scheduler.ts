import { ConvexHttpClient } from 'convex/browser';
import { Scheduler } from './scheduler.driver';

const convexUrl = process.env.HARNESS_CONVEX_URL;
const convexToken = process.env.HARNESS_CONVEX_TOKEN;
const client = convexUrl ? new ConvexHttpClient(convexUrl) : null;

const isConfigured = () => Boolean(client && convexToken);

const mutate = async <T>(name: string, args: Record<string, unknown>): Promise<T> => {
  if (!client || !convexToken) {
    throw new Error('HARNESS_CONVEX_URL and HARNESS_CONVEX_TOKEN must be set to use ConvexScheduler');
  }
  return client.mutation(name as any, { token: convexToken, ...args });
};

export const ConvexScheduler: Scheduler = {
  async enqueue(name, payload, runAt, opts) {
    if (!isConfigured()) return 'scheduler-not-configured';
    const jobId = await mutate<string>('scheduler:enqueueOnce', {
      job: {
        name,
        payload,
        runAt: runAt.toISOString(),
        userExternalId: opts.userExternalId,
        timezone: opts.timezone,
      },
    });
    return jobId;
  },
  async scheduleTrigger(input) {
    if (!isConfigured()) return 'trigger-not-configured';
    const triggerId = await mutate<string>('scheduler:createTrigger', {
      trigger: {
        userExternalId: input.userExternalId,
        rrule: input.rrule,
        timezone: input.timezone,
        nextRun: input.nextRun.toISOString(),
        payload: input.payload,
      },
    });
    return triggerId;
  },
  async cancelTrigger(triggerId: string) {
    if (!isConfigured()) return;
    await mutate('scheduler:cancelTrigger', { triggerId });
  },
};
