import { Hono } from 'hono';
import {
  decisionRequestSchema,
  decisionResponseSchema,
} from '../../../shared/src/schemas/decision';
import { jsonError } from '../lib/errors';
import type { AppEnv } from '../lib/context';
import { createD1IntentRepository } from '../repositories/intent-repository';
import { fallbackIntentRepository } from '../repositories/fallback';

const router = new Hono<AppEnv>();

router.post('/', async (c) => {
  const parsed = decisionRequestSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return jsonError(c, 400, 'BAD_REQUEST', 'invalid request', parsed.error.flatten());
  }

  const repo =
    (c.env as AppEnv['Bindings'] | undefined)?.__intentRepo ??
    ((c.env as AppEnv['Bindings'] | undefined)?.DB
      ? createD1IntentRepository((c.env as AppEnv['Bindings']).DB)
      : fallbackIntentRepository);

  const intent = await repo.getIntent(parsed.data.intentId);
  if (!intent) {
    return jsonError(c, 404, 'INTENT_NOT_FOUND', 'intent not found');
  }

  const savedAmount =
    parsed.data.savedAmount ??
    (parsed.data.outcome === 'avoided' ? intent.amountInclTax : undefined);

  if (savedAmount == null) {
    return jsonError(c, 400, 'BAD_REQUEST', 'savedAmount is required for this outcome');
  }

  await repo.upsertDecision({
    intentId: parsed.data.intentId,
    outcome: parsed.data.outcome,
    savedAmountInclTax: savedAmount,
    tone: parsed.data.tone ?? null,
    reasonTag: parsed.data.reasonTag ?? null,
  });

  const response = { ok: true as const };
  const check = decisionResponseSchema.safeParse(response);
  if (!check.success) {
    return jsonError(c, 500, 'INTERNAL', 'response validation failed');
  }
  return c.json(check.data);
});

export default router;
