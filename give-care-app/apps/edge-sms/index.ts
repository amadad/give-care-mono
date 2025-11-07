import { handle } from '../../src/harness';
import { Inbound } from '../../src/shared/types';

export const post = async (body: { From: string; Body: string } & Record<string, unknown>) => {
  const inbound: Inbound = {
    channel: 'sms',
    userId: body.From,
    text: body.Body,
    meta: body,
  };
  return handle(inbound);
};
