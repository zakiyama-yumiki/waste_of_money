import { z } from 'zod';

export const toneSchema = z.enum(['gentle', 'humor', 'spartan']);
export const sourceSchema = z.enum(['rule', 'ai']);
export const outcomeSchema = z.enum(['avoided', 'purchased']);
export const categorySchema = z.enum(['snack', 'drink', 'meal', 'hobby', 'other']);

export const yenAmountSchema = z.number().int().min(1).max(50_000);
export const taxRateSchema = z.number().min(0).max(1).default(0.10);
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const isoDateTimeSchema = z.string().datetime();
export const yearMonthSchema = z.string().regex(/^\d{4}-\d{2}$/);

export type Tone = z.infer<typeof toneSchema>;
