import app from '../src/index';
import {
  createMemoryIntentRepository,
  type StoredIntent,
  type StoredAlternative,
} from '../src/repositories/intent-repository';

describe('/api/alt draft persistence', () => {
  test('creates draft intent with three alternatives and stores idempotency response', async () => {
    const repo = createMemoryIntentRepository();

    const res = await app.request(
      '/api/alt',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'idem-001',
        },
        body: JSON.stringify({
          amount: 450,
          category: 'drink',
          tone: 'gentle',
        }),
      },
      { __intentRepo: repo } as any
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.intentId).toBeTruthy();
    expect(json.alternatives).toHaveLength(3);

    const intents = Array.from((repo as any).__intents.values()) as StoredIntent[];
    expect(intents).toHaveLength(1);
    const intent = intents[0]!;
    expect(intent.status).toBe('draft');
    expect(intent.amountInclTax).toBe(450);

    const alternatives = (repo as any).__alternatives.get(json.intentId) as StoredAlternative[];
    expect(alternatives).toHaveLength(3);

    const idemRecord = (repo as any).__idempotency.get('idem-001');
    expect(idemRecord).toBeTruthy();
    expect(JSON.parse(idemRecord.responseBody).intentId).toBe(json.intentId);
  });
});
