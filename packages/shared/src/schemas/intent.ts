import { z } from 'zod';
import { yenAmountSchema, taxRateSchema, categorySchema } from './common';

export const intentRequestSchema = z.object({
  amount: yenAmountSchema,
  inputIsPretax: z.boolean().default(false).optional(),
  taxRate: taxRateSchema.default(0.10).optional(),
  category: categorySchema.optional(),
  hungerLevel: z.number().int().min(1).max(5).optional(),
});

export const intentResponseSchema = z.object({ intentId: z.string() });
