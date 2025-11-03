import app from '../src/index';

describe('/api/alt acceptance', () => {
  test('returns three alternatives and respects default inputIsPretax=false (amount is already tax-included)', async () => {
    const res = await app.request('/api/alt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 300 }) // inputIsPretax 未指定 → 仕様では false
    });
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.intentId).toBeTruthy();
    expect(Array.isArray(json.alternatives)).toBe(true);
    expect(json.alternatives.length).toBe(3);
    // 仕様では税込既定。300入力→¥300 が含まれることを期待（現在は¥330のはずでRed）
    const texts: string[] = json.alternatives.map((a: any) => a.text);
    expect(texts.some(t => t.includes('¥300'))).toBe(true);
  });
});

