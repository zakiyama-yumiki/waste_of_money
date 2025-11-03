import app from '../src/index';

describe('Idempotency-Key', () => {
  test('same key returns same intentId (200)', async () => {
    const key = 'test-idem-123';
    const common = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify({ amount: 300 })
    } as const;

    const r1 = await app.request('/api/alt', common);
    const j1 = await r1.json() as any;
    const r2 = await app.request('/api/alt', common);
    const j2 = await r2.json() as any;

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(j1.intentId).toBe(j2.intentId); // 現状は固定intent_stubでGreenだが将来は実装で担保
  });
});

