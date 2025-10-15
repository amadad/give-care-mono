import { query } from "./_generated/server";

export const ping = query({
  args: {},
  handler: async () => {
    return {
      status: "ok",
      timestamp: Date.now(),
      message: "GiveCare TypeScript backend is running!"
    };
  },
});
