import { Hono } from 'hono';
import alt from './routes/alt';
import intent from './routes/intent';
import decision from './routes/decision';
import summary from './routes/summary';
import sync from './routes/sync';
import type { AppEnv } from './lib/context';

const app = new Hono<AppEnv>();

// 簡易 Request-Id 反映
app.use('*', async (c, next) => {
  const rid = c.req.header('X-Request-Id') || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  c.header('X-Request-Id', rid);
  c.set('requestId', rid);
  await next();
});

app.route('/api/alt', alt);
app.route('/api/intent', intent);
app.route('/api/decision', decision);
app.route('/api/summary', summary);
app.route('/api/sync', sync);

// --- Static assets & SPA fallback ---
// API 以外の GET リクエストは Workers の `assets` バインディングへ委譲
app.get('*', async (c) => {
  const path = c.req.path;
  if (path.startsWith('/api')) {
    return c.text('Not Found', 404);
  }

  // まずはビルド済みアセットをそのまま配信
  const res = await c.env.ASSETS.fetch(c.req.raw);
  if (res.status !== 404) return res;

  // SPA ルーティング用に index.html へフォールバック
  const url = new URL(c.req.url);
  const indexReq = new Request(new URL('/index.html', url.origin), c.req.raw);
  return c.env.ASSETS.fetch(indexReq);
});

export default app;

export { scheduled } from './scheduled/cleanup';
