import { describe, expect, it } from 'vitest';
import { handle } from '../../packages/harness';
import { Inbound } from '../../packages/shared/types';

describe('harness handle', () => {
  it('returns a placeholder stream for main agent', async () => {
    const inbound: Inbound = {
      channel: 'sms',
      userId: 'user-1',
      text: 'Daily check in',
      meta: {},
    };

    const result = await handle(inbound);
    expect(result.type).toBe('stream');
    expect(Array.isArray(result.chunks)).toBe(true);
    expect(result.chunks.length).toBeGreaterThan(0);
  });
});
