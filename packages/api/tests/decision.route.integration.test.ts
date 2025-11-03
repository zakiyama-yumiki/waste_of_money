import app from '../src/index';
import {
  createMemoryIntentRepository,
  type StoredDecision,
} from '../src/repositories/intent-repository';

describe('/api/decision', () => {
  test('defaults savedAmount to intent.amount_incl_tax when outcome=avoided and savedAmount is omitted', async () => {
    const repo = createMemoryIntentRepository();
    const env = { __intentRepo: repo } as any;

    const altRes = await app.request(
      '/api/alt',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 780, category: 'meal', tone: 'gentle' }),
      },
      env
    );

    expect(altRes.status).toBe(200);
    const altJson = (await altRes.json()) as any;
    const intentId = altJson.intentId;
    expect(intentId).toBeTruthy();

    const decisionRes = await app.request(
      '/api/decision',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId,
          outcome: 'avoided',
        }),
      },
      env
    );

    expect(decisionRes.status).toBe(200);
    const decisionJson = (await decisionRes.json()) as any;
    expect(decisionJson).toEqual({ ok: true });

    const decisions = Array.from((repo as any).__decisions.values()) as StoredDecision[];
    expect(decisions).toHaveLength(1);
    const decision = decisions[0]!;
    expect(decision.intentId).toBe(intentId);
    expect(decision.savedAmountInclTax).toBe(780);
    expect(decision.outcome).toBe('avoided');
  });
});
