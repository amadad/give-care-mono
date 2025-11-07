import { GoogleGenAI } from '@google/genai';

export type ResourceSearchInput = {
  query: string;
  latitude: number;
  longitude: number;
};

export type ResourcePlace = {
  title: string;
  uri?: string;
};

export type ResourceSearchResult = {
  summary: string;
  places: ResourcePlace[];
};

const getApiKey = () => process.env.HARNESS_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
const getModel = () => process.env.HARNESS_GEMINI_MODEL ?? 'gemini-2.5-flash-lite';

export const searchLocalResources = async ({ query, latitude, longitude }: ResourceSearchInput) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: getModel(),
    contents: query,
    config: {
      tools: [{ googleMaps: { enableWidget: false } }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude, longitude },
        },
      },
    },
  });

  const summary = response.text ?? 'Here are a few options nearby that could help.';
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const places: ResourcePlace[] = chunks
    .filter((chunk) => Boolean(chunk.maps))
    .slice(0, 3)
    .map((chunk) => ({
      title: chunk.maps?.title ?? 'Resource',
      uri: chunk.maps?.uri ?? undefined,
    }));

  return { summary, places } satisfies ResourceSearchResult;
};
