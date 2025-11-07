import { CapabilityDefinition } from '../shared/types';

export const capability = <TInput, TOutput>(def: CapabilityDefinition<TInput, TOutput>) => def;
