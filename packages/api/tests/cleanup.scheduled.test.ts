import { describe, expect, test } from 'vitest';
import type { ExecutionContext, ScheduledController } from '@cloudflare/workers-types';
import { scheduled } from '../src/scheduled/cleanup';
import { createMemoryIntentRepository } from '../src/repositories/intent-repository';

describe('scheduled cleanup', () => {
  test('expires drafts older than 24h and prunes idempotency keys older than 7d', async () => {
    const repo = createMemoryIntentRepository();
    const env = { __intentRepo: repo } as any;

    const { intentId: recentIntent } = await repo.createDraftIntent({
      amountPretax: 100,
      amountInclTax: 110,
      taxRate: 0.1,
      category: 'snack',
      tone: 'gentle',
      idempotencyKey: null,
    });
    const { intentId: oldIntent } = await repo.createDraftIntent({
      amountPretax: 200,
      amountInclTax: 220,
      taxRate: 0.1,
      category: 'drink',
      tone: 'gentle',
      idempotencyKey: null,
    });

    const now = Date.now();
    const twentyFiveHoursAgo = new Date(now - 25 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

    const intentsMap = (repo as any).__intents as Map<string, any>;
    intentsMap.get(oldIntent)!.createdAt = twentyFiveHoursAgo;
    intentsMap.get(recentIntent)!.createdAt = oneHourAgo;

    await repo.recordIdempotency('old-key', 'POST', '/api/alt', '{}', 200);
    await repo.recordIdempotency('recent-key', 'POST', '/api/alt', '{}', 200);
    const idemMap = (repo as any).__idempotency as Map<string, any>;
    idemMap.get('old-key')!.createdAt = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
    idemMap.get('recent-key')!.createdAt = new Date(now - 60 * 60 * 1000).toISOString();

    const controller = {
      scheduledTime: new Date().toISOString(),
      cron: '',
      noRetry: false,
      type: 'scheduled',
    } as unknown as ScheduledController;

    const ctx = {
      waitUntil: () => undefined,
      passThroughOnException: () => undefined,
      props: {},
    } as unknown as ExecutionContext;

    await scheduled(controller, env, ctx);

    expect(intentsMap.get(oldIntent)!.status).toBe('expired');
    expect(intentsMap.get(recentIntent)!.status).toBe('draft');
    expect(idemMap.has('old-key')).toBe(false);
    expect(idemMap.has('recent-key')).toBe(true);
  });
});
