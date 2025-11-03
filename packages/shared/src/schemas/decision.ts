import { z } from 'zod';
import { outcomeSchema, toneSchema } from './common';

export const decisionRequestSchema = z.object({
  intentId: z.string(),
  outcome: outcomeSchema,
  savedAmount: z.number().optional(), // 税込
  reasonTag: z.string().optional(),
  tone: toneSchema.optional(),
});

export const decisionResponseSchema = z.object({ ok: z.literal(true) });

