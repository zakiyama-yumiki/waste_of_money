import { z } from 'zod';
import { toneSchema, categorySchema, yenAmountSchema, taxRateSchema } from './common';

export const altRequestSchema = z.object({
  amount: yenAmountSchema,
  inputIsPretax: z.boolean().default(false),
  taxRate: taxRateSchema.default(0.10),
  goal: z.string().optional(),
  hobbies: z.array(z.string()).max(5).optional(),
  tone: toneSchema.optional(),
  locale: z.literal('ja-JP').default('ja-JP').optional(),
  category: categorySchema.optional(),
});

export const alternativeSchema = z.object({
  id: z.string(),
  text: z.string(),
  tag: z.string().optional(),
  source: z.enum(['rule', 'ai']),
  score: z.number().min(0).max(1).optional(),
});

export const altResponseSchema = z.object({
  intentId: z.string(),
  alternatives: z.array(alternativeSchema).length(3),
});

export type AltRequest = z.infer<typeof altRequestSchema>;
export type AltResponse = z.infer<typeof altResponseSchema>;
