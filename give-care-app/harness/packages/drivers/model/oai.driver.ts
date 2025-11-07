import { Agent, run, setOpenAIAPI, tool as agentTool } from '@openai/agents';
import { z } from 'zod';
import { ModelDriver, StreamRequest } from './model.driver';

const MODEL_NAME = process.env.HARNESS_OPENAI_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-5.5-mini';

if (!process.env.OPENAI_API_KEY && process.env.HARNESS_OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.HARNESS_OPENAI_API_KEY;
}

setOpenAIAPI('responses');

const hasApiKey = () => Boolean(process.env.OPENAI_API_KEY);

const buildTools = (specs: StreamRequest['tools'], onToolCall?: StreamRequest['onToolCall']) => {
  if (!specs || specs.length === 0) return undefined;
  return specs.map((spec) =>
    agentTool({
      name: spec.name,
      description: spec.description,
      parameters: spec.schema ?? z.object({}),
      execute: async (args) => {
        if (!onToolCall) {
          return `Tool ${spec.name} is unavailable.`;
        }
        try {
          const result = await onToolCall(spec.name, args);
          return result ?? 'ok';
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return `Tool ${spec.name} failed: ${message}`;
        }
      },
    })
  );
};

const buildAgent = (instructions: string, budget: StreamRequest['budget'], tools?: ReturnType<typeof buildTools>) =>
  new Agent({
    name: 'GiveCareHarness',
    instructions,
    model: MODEL_NAME,
    modelSettings: {
      reasoning: { effort: 'minimal' },
      text: { verbosity: 'low' },
      maxOutputTokens: budget?.maxOutput ?? 800,
      store: true,
      service_tier: process.env.HARNESS_OPENAI_SERVICE_TIER ?? 'auto',
    },
    tools,
  });

const extractConversationId = (context?: Record<string, unknown>) => {
  if (!context) return undefined;
  const ctx = context as Record<string, unknown>;
  if (typeof ctx.conversationId === 'string') return ctx.conversationId;
  if (typeof ctx.sessionId === 'string') return ctx.sessionId;
  if (typeof ctx.userId === 'string') return ctx.userId;
  return undefined;
};

const finalOutputAsText = (result: Awaited<ReturnType<typeof run>>) => {
  if (!result) return '';
  if (typeof result.finalOutput === 'string') return result.finalOutput;
  if (typeof result.finalOutput === 'object' && result.finalOutput !== null) {
    try {
      return JSON.stringify(result.finalOutput);
    } catch {
      return String(result.finalOutput);
    }
  }
  return '';
};

const fallbackMessage = (reason: string) =>
  `Harness fallback response: ${reason}. Set HARNESS_OPENAI_API_KEY or OPENAI_API_KEY to enable live replies.`;

export const OAIModelDriver: ModelDriver = {
  async *stream(opts: StreamRequest) {
    if (!hasApiKey()) {
      yield fallbackMessage('missing OpenAI API key');
      return;
    }

    try {
      const agent = buildAgent(opts.system, opts.budget, buildTools(opts.tools, opts.onToolCall));
      const result = await run(agent, opts.user, {
        context: opts.context ?? {},
        conversationId: extractConversationId(opts.context),
      });

      const output = finalOutputAsText(result);
      if (output) {
        yield output;
      } else {
        yield fallbackMessage('no output from model');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unexpected error communicating with OpenAI';
      yield fallbackMessage(message);
    }
  },

  async classify<T>(input: string, _schema?: unknown): Promise<T> {
    if (!hasApiKey()) {
      throw new Error('OpenAI API key missing. Set HARNESS_OPENAI_API_KEY or OPENAI_API_KEY.');
    }

    const classifier = buildAgent('You are a JSON classifier. Respond with valid JSON only.', {
      maxInput: 512,
      maxOutput: 256,
    });

    const result = await run(classifier, input, { conversationId: 'classifier' });
    const text = finalOutputAsText(result);
    try {
      return JSON.parse(text) as T;
    } catch {
      return { output: text } as unknown as T;
    }
  },
};
