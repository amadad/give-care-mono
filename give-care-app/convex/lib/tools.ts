import { z } from 'zod';

export const memoryArgs = z.object({
  category: z.enum(['care_routine', 'preference', 'intervention_result', 'crisis_trigger']),
  content: z.string().min(5).max(300),
  importance: z.number().min(1).max(10).default(5),
});

export const checkInArgs = z.object({
  sendReminder: z.boolean().optional(),
});

export const checkInResponseArgs = z.object({
  questionIndex: z.number().int().nonnegative(),
  value: z.number().int().min(1).max(5),
});

export const assessmentArgs = z.object({
  definition: z.enum(['ema', 'bsfc', 'reach2', 'sdoh']),
});

export const assessmentResponseArgs = z.object({
  value: z.number().int().min(1).max(5),
});

export const resourceArgs = z.object({
  category: z.string().default('respite'),
  zip: z.string().length(5).optional(),
});

export const crisisToolArgs = z.object({
  message: z.string(),
});
