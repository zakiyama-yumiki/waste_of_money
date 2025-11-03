import type { D1Database, Fetcher } from '@cloudflare/workers-types';
import type { IntentRepository } from '../repositories/intent-repository';

export type AppBindings = {
  DB: D1Database;
  // Workers の assets バインディング（静的配信に利用）
  ASSETS: Fetcher;
  __intentRepo?: IntentRepository;
};

export type AppVariables = {
  requestId: string;
};

export type AppEnv = {
  Bindings: AppBindings;
  Variables: AppVariables;
};
