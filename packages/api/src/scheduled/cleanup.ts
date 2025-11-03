import type { ExecutionContext, ScheduledController } from '@cloudflare/workers-types';
import { createD1IntentRepository } from '../repositories/intent-repository';
import { fallbackIntentRepository } from '../repositories/fallback';
import type { AppBindings } from '../lib/context';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const IDEMPOTENCY_TTL_MS = 7 * ONE_DAY_MS;

export const scheduled = async (
  controller: ScheduledController,
  env: AppBindings,
  _ctx: ExecutionContext
) => {
  const repo = env.__intentRepo ?? (env.DB ? createD1IntentRepository(env.DB) : fallbackIntentRepository);

  const now = Date.now();
  const draftCutoff = new Date(now - ONE_DAY_MS).toISOString();
  const idemCutoff = new Date(now - IDEMPOTENCY_TTL_MS).toISOString();

  const expiredCount = await repo.markDraftsExpired(draftCutoff);
  const deletedIdem = await repo.deleteIdempotencyBefore(idemCutoff);

  if (expiredCount > 0 || deletedIdem > 0) {
    console.log('[cleanup] expired drafts:', expiredCount, 'deleted idempotency:', deletedIdem);
  }
};

export default { scheduled };
