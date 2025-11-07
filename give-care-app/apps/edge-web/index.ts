import { handle } from '../../src/harness';
import { Inbound } from '../../src/shared/types';

export const websocketHandler = async (event: { userId: string; text: string; meta?: Record<string, unknown> }) => {
  const inbound: Inbound = {
    channel: 'web',
    userId: event.userId,
    text: event.text,
    meta: event.meta ?? {},
  };
  return handle(inbound);
};
