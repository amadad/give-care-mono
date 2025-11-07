import { handle } from '../../packages/harness';
import { Inbound } from '../../packages/shared/types';

export const post = async (body: { From: string; Body: string } & Record<string, unknown>) => {
  const inbound: Inbound = {
    channel: 'sms',
    userId: body.From,
    text: body.Body,
    meta: body,
  };
  return handle(inbound);
};
