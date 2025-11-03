import app from '../src/index';
import { createMemoryIntentRepository } from '../src/repositories/intent-repository';

const setDecisionCreatedAt = (repo: any, intentId: string, createdAt: string) => {
  for (const decision of repo.__decisions.values()) {
    if (decision.intentId === intentId) {
      decision.createdAt = new Date(createdAt).toISOString();
    }
  }
};

describe('/api/summary', () => {
  test('400 when month and from/to are mixed, with error shape', async () => {
    const url =
      '/api/summary?month=2025-10&from=2025-10-01T00:00:00%2B09:00&to=2025-10-31T23:59:59%2B09:00';
    const res = await app.request(url);
    expect(res.status).toBe(400);
    const json = (await res.json()) as any;
    expect(json).toHaveProperty('error');
    expect(json).toHaveProperty('requestId');
  });

  test('month summary aggregates avoided decisions and streak', async () => {
    const repo = createMemoryIntentRepository();
    const env = { __intentRepo: repo } as any;

    const { intentId: id1 } = await repo.createDraftIntent({
      amountPretax: 500,
      amountInclTax: 550,
      taxRate: 0.1,
      category: 'meal',
      tone: 'gentle',
      idempotencyKey: null,
    });
    await repo.upsertDecision({
      intentId: id1,
      outcome: 'avoided',
      savedAmountInclTax: 550,
      tone: null,
      reasonTag: null,
    });
    setDecisionCreatedAt(repo, id1, '2025-10-01T08:00:00+09:00');

    const { intentId: id2 } = await repo.createDraftIntent({
      amountPretax: 1000,
      amountInclTax: 1100,
      taxRate: 0.1,
      category: 'drink',
      tone: 'gentle',
      idempotencyKey: null,
    });
    await repo.upsertDecision({
      intentId: id2,
      outcome: 'avoided',
      savedAmountInclTax: 1100,
      tone: null,
      reasonTag: null,
    });
    setDecisionCreatedAt(repo, id2, '2025-10-02T22:00:00+09:00');

    const { intentId: id3 } = await repo.createDraftIntent({
      amountPretax: 400,
      amountInclTax: 440,
      taxRate: 0.1,
      category: 'snack',
      tone: 'gentle',
      idempotencyKey: null,
    });
    await repo.upsertDecision({
      intentId: id3,
      outcome: 'purchased',
      savedAmountInclTax: 440,
      tone: null,
      reasonTag: null,
    });
    setDecisionCreatedAt(repo, id3, '2025-10-03T10:00:00+09:00');

    const res = await app.request('/api/summary?month=2025-10', undefined, env);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.range.month).toBe('2025-10');
    expect(json.range.from).toBe('2025-09-30T15:00:00.000Z');
    expect(json.range.to).toBe('2025-10-31T15:00:00.000Z');
    expect(json.monthSavedTotalInclTax).toBe(1650);
    expect(json.countAvoided).toBe(2);
    expect(json.streak).toBe(2);
  });

  test('range summary respects from/to and returns streak based on latest avoided', async () => {
    const repo = createMemoryIntentRepository();
    const env = { __intentRepo: repo } as any;

    const { intentId: id1 } = await repo.createDraftIntent({
      amountPretax: 300,
      amountInclTax: 330,
      taxRate: 0.1,
      category: 'snack',
      tone: 'gentle',
      idempotencyKey: null,
    });
    await repo.upsertDecision({
      intentId: id1,
      outcome: 'avoided',
      savedAmountInclTax: 330,
      tone: null,
      reasonTag: null,
    });
    setDecisionCreatedAt(repo, id1, '2025-09-29T22:00:00+09:00');

    const { intentId: id2 } = await repo.createDraftIntent({
      amountPretax: 600,
      amountInclTax: 660,
      taxRate: 0.1,
      category: 'drink',
      tone: 'gentle',
      idempotencyKey: null,
    });
    await repo.upsertDecision({
      intentId: id2,
      outcome: 'avoided',
      savedAmountInclTax: 660,
      tone: null,
      reasonTag: null,
    });
    setDecisionCreatedAt(repo, id2, '2025-09-30T01:00:00+09:00');

    const fromParam = encodeURIComponent('2025-09-28T15:00:00.000Z');
    const toParam = encodeURIComponent('2025-09-30T15:00:00.000Z');
    const res = await app.request(`/api/summary?from=${fromParam}&to=${toParam}`, undefined, env);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.range.from).toBe('2025-09-28T15:00:00.000Z');
    expect(json.range.to).toBe('2025-09-30T15:00:00.000Z');
    expect(json.monthSavedTotalInclTax).toBe(990);
    expect(json.countAvoided).toBe(2);
    expect(json.streak).toBe(2);
  });
});
