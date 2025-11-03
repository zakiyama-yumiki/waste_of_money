import { z } from 'zod';
import { isoDateTimeSchema } from './common';

export const syncEventSchema = z.object({
  type: z.enum(['intent', 'decision']),
  idempotencyKey: z.string(),
  client_ts: isoDateTimeSchema,
  payload: z.record(z.any()),
});

export const syncRequestSchema = z.object({
  clientId: z.string(),
  batchId: z.string(),
  events: z.array(syncEventSchema).max(50),
});

export const syncResponseSchema = z.object({ stored: z.number().int(), duplicates: z.number().int() });

