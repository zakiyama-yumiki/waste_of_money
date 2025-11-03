import { Hono } from 'hono';
import { syncRequestSchema, syncResponseSchema } from '../../../shared/src/schemas/sync';
import { jsonError } from '../lib/errors';
import type { AppEnv } from '../lib/context';

const router = new Hono<AppEnv>();

router.post('/', async (c) => {
  const parsed = syncRequestSchema.safeParse(await c.req.json());
  if (!parsed.success) return jsonError(c, 400, 'BAD_REQUEST', 'invalid request', parsed.error.flatten());
  const res = { stored: 0, duplicates: 0 };
  const check = syncResponseSchema.safeParse(res);
  if (!check.success) return jsonError(c, 500, 'INTERNAL', 'response validation failed');
  return c.json(check.data);
});

export default router;
