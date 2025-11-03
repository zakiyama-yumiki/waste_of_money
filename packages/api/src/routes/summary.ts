import { Hono } from 'hono';
import { summaryQuerySchema, summaryResponseSchema } from '../../../shared/src/schemas/summary';
import { jsonError } from '../lib/errors';
import type { AppEnv } from '../lib/context';
import { createD1IntentRepository } from '../repositories/intent-repository';
import { fallbackIntentRepository } from '../repositories/fallback';
import { computeStreak } from '../../../shared/src/lib/streak';

const router = new Hono<AppEnv>();

const toIsoString = (value: string, label: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`${label} is invalid`);
  }
  return date.toISOString();
};

router.get('/', async (c) => {
  const url = new URL(c.req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const parsed = summaryQuerySchema.safeParse(query);
  if (!parsed.success) {
    return jsonError(c, 400, 'BAD_REQUEST', 'invalid query', parsed.error.flatten());
  }

  const { month, from, to } = parsed.data;
  if (!month && !(from && to)) {
    return jsonError(c, 400, 'BAD_REQUEST', 'month か from/to を指定してください');
  }

  let rangeFrom: string;
  let rangeTo: string;
  const offsetMs = 9 * 60 * 60 * 1000;
  try {
    if (month) {
      const [yearStr, monthStr] = month.split('-');
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1;
      if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        throw new Error('invalid month');
      }
      const startUtcMillis = Date.UTC(year, monthIndex, 1) - offsetMs;
      const endUtcMillis = Date.UTC(year, monthIndex + 1, 1) - offsetMs;
      rangeFrom = new Date(startUtcMillis).toISOString();
      rangeTo = new Date(endUtcMillis).toISOString();
    } else {
      rangeFrom = toIsoString(from!, 'from');
      rangeTo = toIsoString(to!, 'to');
      if (new Date(rangeFrom).getTime() >= new Date(rangeTo).getTime()) {
        return jsonError(c, 400, 'BAD_REQUEST', '`from` は `to` より前である必要があります');
      }
    }
  } catch (err) {
    return jsonError(c, 400, 'BAD_REQUEST', (err as Error).message);
  }

  const repo =
    (c.env as AppEnv['Bindings'] | undefined)?.__intentRepo ??
    ((c.env as AppEnv['Bindings'] | undefined)?.DB
      ? createD1IntentRepository((c.env as AppEnv['Bindings']).DB)
      : fallbackIntentRepository);

  const decisions = await repo.listDecisionsInRange({ from: rangeFrom, to: rangeTo });

  const avoided = decisions.filter((d) => d.outcome === 'avoided');
  const monthSavedTotalInclTax = avoided.reduce((sum, d) => sum + d.savedAmountInclTax, 0);
  const countAvoided = avoided.length;
  const latest = avoided[avoided.length - 1];
  const streak = latest ? computeStreak(decisions, { asOf: latest.createdAt }) : 0;

  const response = {
    range: {
      from: rangeFrom,
      to: rangeTo,
      ...(month ? { month } : {}),
    },
    monthSavedTotalInclTax,
    streak,
    countAvoided,
  };
  const check = summaryResponseSchema.safeParse(response);
  if (!check.success) {
    return jsonError(c, 500, 'INTERNAL', 'response validation failed');
  }

  return c.json(check.data);
});

export default router;
