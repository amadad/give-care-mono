import { z } from 'zod';
import { capability } from './factory';

const InputSchema = z.object({
  query: z.string().min(1),
  latitude: z.number({ invalid_type_error: 'latitude required' }),
  longitude: z.number({ invalid_type_error: 'longitude required' }),
});

export const searchResources = capability({
  name: 'resources.search',
  description: 'Find nearby in-person places (parks, cafes, respite spots) using Gemini-grounded search.',
  costHint: 'medium',
  latencyHint: 'medium',
  io: {
    input: InputSchema,
  },
  async run(args, ctx) {
    const { query, latitude, longitude } = InputSchema.parse(args);

    try {
      const result = await ctx.services.resources.searchLocalResources({ query, latitude, longitude });
      const placesText =
        result.places.length > 0
          ? result.places
              .map((place, idx) => `${idx + 1}. ${place.title}${place.uri ? ` — ${place.uri}` : ''}`)
              .join('\n')
          : 'No mapped places returned, but you can still try nearby spots mentioned above.';

      return {
        summary: `${result.summary}\n\nTake a moment for yourself—you deserve the break. 💙`,
        places: result.places,
        formatted: `${result.summary}\n\n📍 Ideas nearby:\n${placesText}\n\nTake the time you need. 💙`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error searching for resources';
      ctx.trace.push('tool.error', { name: 'resources.search', message });
      if (message.includes('API key')) {
        return "Local search isn't available right now. I can still help with check-ins or support strategies.";
      }
      return "I'm having trouble searching right now. Want to try a wellness check-in or explore support strategies instead?";
    }
  },
});
