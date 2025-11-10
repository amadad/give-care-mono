'use node';

import { action } from '../_generated/server';
import { v } from 'convex/values';

const OPENAI_URL = 'https://api.openai.com/v1/embeddings';

export const embedText = action({
  args: { text: v.string() },
  handler: async (_, { text }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`embedText failed: ${response.status} ${errorBody}`);
    }

    const json = (await response.json()) as { data?: Array<{ embedding: number[] }>; usage?: any };
    const embedding = json.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error('Missing embedding in response');
    }

    return { embedding };
  },
});
