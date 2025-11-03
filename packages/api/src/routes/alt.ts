import { Hono } from 'hono';
import { altRequestSchema, altResponseSchema } from '../../../shared/src/schemas/alt';
import { toInclTaxHalfUp } from '../../../shared/src/lib/money';
import { jsonError } from '../lib/errors';
import type { AppEnv } from '../lib/context';
import { buildAlternatives } from '../rules/buildAlternatives';
import {
  createD1IntentRepository,
  type StoredAlternative,
} from '../repositories/intent-repository';
import { fallbackIntentRepository } from '../repositories/fallback';

const router = new Hono<AppEnv>();

router.post('/', async (c) => {
  const parse = altRequestSchema.safeParse(await c.req.json());
  if (!parse.success) {
    return jsonError(c, 400, 'BAD_REQUEST', 'invalid request', parse.error.flatten());
  }

  const repo =
    (c.env as AppEnv['Bindings'] | undefined)?.__intentRepo ??
    ((c.env as AppEnv['Bindings'] | undefined)?.DB
      ? createD1IntentRepository((c.env as AppEnv['Bindings']).DB)
      : fallbackIntentRepository);
  const idempotencyKey = c.req.header('Idempotency-Key');

  if (idempotencyKey) {
    const existing = await repo.findIdempotency(idempotencyKey);
    if (existing) {
      const body = JSON.parse(existing.responseBody);
      c.header('X-Idempotent-Replay', 'true');
      return c.json(body, existing.status as never);
    }
  }

  const { amount, inputIsPretax = false, taxRate = 0.1 } = parse.data;
  const category = parse.data.category ?? null;
  const tone = parse.data.tone ?? null;
  const amountIncl = inputIsPretax ? toInclTaxHalfUp(amount, taxRate) : amount;
  const amountPretax = inputIsPretax ? amount : Math.round(amount / (1 + taxRate));

  const altCandidates = buildAlternatives(amountIncl, { category, tone });

  const { intentId } = await repo.createDraftIntent({
    amountPretax,
    amountInclTax: amountIncl,
    taxRate,
    category,
    tone,
    idempotencyKey: idempotencyKey ?? null,
  });

  const storedAlternatives: StoredAlternative[] = altCandidates.map((alt) => ({
    ...alt,
    intentId,
  }));

  await repo.saveAlternatives(intentId, storedAlternatives);

  const response = {
    intentId,
    alternatives: storedAlternatives.map(({ intentId: _intentId, tag, score, ...rest }) => ({
      ...rest,
      ...(tag != null ? { tag } : {}),
      ...(score != null ? { score } : {}),
    })),
  };

  const check = altResponseSchema.safeParse(response);
  if (!check.success) {
    console.error('[alt] response validation failed', {
      response,
      error: check.error.flatten(),
    });
    return jsonError(c, 500, 'INTERNAL', 'response validation failed', {
      details: check.error.flatten(),
    });
  }

  if (idempotencyKey) {
    await repo.recordIdempotency(
      idempotencyKey,
      c.req.method,
      c.req.path,
      JSON.stringify(check.data),
      200
    );
  }

  return c.json(check.data);
});

export default router;
