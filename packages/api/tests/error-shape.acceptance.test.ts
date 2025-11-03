import app from '../src/index';

describe('error shape', () => {
  test('400 returns { error:{code,message,details?}, requestId }', async () => {
    const res = await app.request('/api/alt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // 不正: amount が無い
    });
    expect(res.status).toBe(400);
    const json = await res.json() as any;
    expect(json).toHaveProperty('error');
    expect(json.error).toHaveProperty('code');
    expect(json.error).toHaveProperty('message');
    // requestIdも本文に含まれる想定（現在は未実装でRed）
    expect(json).toHaveProperty('requestId');
  });
});

