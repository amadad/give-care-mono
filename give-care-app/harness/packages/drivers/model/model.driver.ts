import { z } from 'zod';
import { CapabilityDefinition } from '../../shared/types';

export type ToolSpec = Pick<CapabilityDefinition<any, any>, 'name' | 'description'> & {
  schema?: z.ZodTypeAny;
};

export type StreamRequest = {
  system: string;
  user: string;
  context?: Record<string, unknown>;
  tools?: ToolSpec[];
  budget: { maxInput: number; maxOutput: number };
  onToolCall?: (name: string, args: unknown) => Promise<unknown>;
};

export interface ModelDriver {
  stream(opts: StreamRequest): AsyncIterable<string>;
  classify?<T = unknown>(input: string, schema: unknown): Promise<T>;
}
