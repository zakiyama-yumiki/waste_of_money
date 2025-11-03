import { serve } from '@hono/node-server';
import app from '../src/index';

const port = Number(process.env.API_PORT ?? 8787);
console.log(`[api-node] starting on http://localhost:${port}`);

serve({
  fetch: (req) => app.fetch(req),
  port,
});

