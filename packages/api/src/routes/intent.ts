import { Hono } from 'hono';
import { intentRequestSchema, intentResponseSchema } from '../../../shared/src/schemas/intent';
import { jsonError } from '../lib/errors';
import type { AppEnv } from '../lib/context';

const router = new Hono<AppEnv>();

router.post('/', async (c) => {
  const parsed = intentRequestSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return jsonError(c, 400, 'BAD_REQUEST', 'invalid request', parsed.error.flatten());
  }
  const res = { intentId: 'intent_stub' };
  const check = intentResponseSchema.safeParse(res);
  if (!check.success) return jsonError(c, 500, 'INTERNAL', 'response validation failed');
  return c.json(check.data);
});

export default router;
