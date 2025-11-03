import type { D1Database } from '@cloudflare/workers-types';
import { generateId } from '../lib/id';

export type DraftInput = {
  amountPretax: number;
  amountInclTax: number;
  taxRate: number;
  category: string | null;
  tone: string | null;
  idempotencyKey: string | null;
};

export type StoredIntent = DraftInput & {
  id: string;
  status: 'draft' | 'expired' | 'submitted';
  createdAt: string;
};

export type StoredAlternative = {
  id: string;
  intentId: string;
  text: string;
  tag: string | null;
  score: number | null;
  source: 'rule' | 'ai';
};

export type IdempotencyRecord = {
  key: string;
  method: string;
  path: string;
  responseBody: string;
  status: number;
  createdAt: string;
};

export type UpsertDecisionInput = {
  intentId: string;
  outcome: 'avoided' | 'purchased';
  savedAmountInclTax: number;
  tone: string | null;
  reasonTag: string | null;
};

export type StoredDecision = UpsertDecisionInput & {
  id: string;
  createdAt: string;
};

export interface IntentRepository {
  createDraftIntent(input: DraftInput): Promise<{ intentId: string }>;
  getIntent(intentId: string): Promise<StoredIntent | null>;
  saveAlternatives(intentId: string, alternatives: StoredAlternative[]): Promise<void>;
  upsertDecision(input: UpsertDecisionInput): Promise<StoredDecision>;
  listDecisionsInRange(params: { from: string; to: string }): Promise<StoredDecision[]>;
  recordIdempotency(
    key: string,
    method: string,
    path: string,
    responseBody: string,
    status: number
  ): Promise<void>;
  findIdempotency(key: string): Promise<IdempotencyRecord | null>;
  updateIntentStatus(intentId: string, status: StoredIntent['status']): Promise<void>;
  markDraftsExpired(beforeIso: string): Promise<number>;
  deleteIdempotencyBefore(beforeIso: string): Promise<number>;
}

export const createMemoryIntentRepository = () => {
  const intents = new Map<string, StoredIntent>();
  const alternatives = new Map<string, StoredAlternative[]>();
  const decisions = new Map<string, StoredDecision>();
  const idempotency = new Map<string, IdempotencyRecord>();

  const repo: IntentRepository = {
    async createDraftIntent(input) {
      const intentId = generateId();
      intents.set(intentId, {
        id: intentId,
        status: 'draft',
        createdAt: new Date().toISOString(),
        ...input,
      });
      return { intentId };
    },

    async getIntent(intentId) {
      return intents.get(intentId) ?? null;
    },

    async saveAlternatives(intentId, records) {
      alternatives.set(intentId, records.map((record) => ({ ...record })));
    },

    async upsertDecision(input) {
      const now = new Date().toISOString();
      const existingEntry = Array.from(decisions.values()).find(
        (d) => d.intentId === input.intentId
      );
      const id = existingEntry?.id ?? generateId();
      const decision: StoredDecision = {
        id,
        intentId: input.intentId,
        outcome: input.outcome,
        savedAmountInclTax: input.savedAmountInclTax,
        tone: input.tone,
        reasonTag: input.reasonTag,
        createdAt: existingEntry?.createdAt ?? now,
      };
      decisions.set(id, decision);
      await repo.updateIntentStatus(input.intentId, 'submitted');
      return decision;
    },

    async recordIdempotency(key, method, path, responseBody, status) {
      idempotency.set(key, {
        key,
        method,
        path,
        responseBody,
        status,
        createdAt: new Date().toISOString(),
      });
    },

    async findIdempotency(key) {
      return idempotency.get(key) ?? null;
    },

    async updateIntentStatus(intentId, status) {
      const existing = intents.get(intentId);
      if (existing) {
        intents.set(intentId, { ...existing, status });
      }
    },

    async listDecisionsInRange({ from, to }) {
      const fromTime = new Date(from).getTime();
      const toTime = new Date(to).getTime();
      const results: StoredDecision[] = [];
      for (const decision of decisions.values()) {
        const created = new Date(decision.createdAt).getTime();
        if (created >= fromTime && created < toTime) {
          results.push({ ...decision });
        }
      }
      return results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },

    async markDraftsExpired(beforeIso) {
      let count = 0;
      for (const [id, intent] of intents.entries()) {
        if (intent.status === 'draft' && intent.createdAt < beforeIso) {
          intents.set(id, { ...intent, status: 'expired' });
          count += 1;
        }
      }
      return count;
    },

    async deleteIdempotencyBefore(beforeIso) {
      let count = 0;
      for (const [key, record] of idempotency.entries()) {
        if (record.createdAt < beforeIso) {
          idempotency.delete(key);
          count += 1;
        }
      }
      return count;
    },
  };

  return Object.assign(repo, {
    __intents: intents,
    __alternatives: alternatives,
    __decisions: decisions,
    __idempotency: idempotency,
  });
};

export const createD1IntentRepository = (db: D1Database): IntentRepository => {
  const repo: IntentRepository = {
    async createDraftIntent(input) {
      const intentId = generateId();
      const now = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO intents
          (id, user_id, amount_pretax, amount_incl_tax,
           tax_rate, category, hunger_level, tone, idempotency_key, status, created_at)
         VALUES (?, NULL, ?, ?, ?, ?, NULL, ?, ?, 'draft', ?)`
        )
        .bind(
          intentId,
          input.amountPretax,
          input.amountInclTax,
          input.taxRate,
          input.category,
          input.tone,
          input.idempotencyKey,
          now
        )
        .run();

      return { intentId };
    },

    async getIntent(intentId) {
      const row = await db
        .prepare(
          `SELECT
            id,
            amount_pretax as amountPretax,
            amount_incl_tax as amountInclTax,
            tax_rate as taxRate,
            category,
            tone,
            idempotency_key as idempotencyKey,
            status,
            created_at as createdAt
         FROM intents WHERE id = ?`
        )
        .bind(intentId)
        .first<StoredIntent>();

      return row ?? null;
    },

    async saveAlternatives(intentId, records) {
      const stmt = db.prepare(
        `INSERT INTO alternatives (id, intent_id, text, tag, score, source)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const record of records) {
        await stmt
          .bind(record.id, intentId, record.text, record.tag, record.score, record.source)
          .run();
      }
    },

    async upsertDecision(input) {
      const now = new Date().toISOString();
      const existing = await db
        .prepare(
          `SELECT id, created_at as createdAt
           FROM decisions WHERE intent_id = ?`
        )
        .bind(input.intentId)
        .first<{ id: string; createdAt: string }>();

      if (existing) {
        await db
          .prepare(
            `UPDATE decisions
             SET outcome = ?, saved_amount_incl_tax = ?, tone = ?, reason_tag = ?
             WHERE intent_id = ?`
          )
          .bind(
            input.outcome,
            input.savedAmountInclTax,
            input.tone,
            input.reasonTag,
            input.intentId
          )
          .run();

        await repo.updateIntentStatus(input.intentId, 'submitted');

        return {
          id: existing.id,
          intentId: input.intentId,
          outcome: input.outcome,
          savedAmountInclTax: input.savedAmountInclTax,
          tone: input.tone,
          reasonTag: input.reasonTag,
          createdAt: existing.createdAt,
        };
      }

      const decisionId = generateId();
      await db
        .prepare(
          `INSERT INTO decisions (id, intent_id, outcome, saved_amount_incl_tax, tone, created_at, reason_tag)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          decisionId,
          input.intentId,
          input.outcome,
          input.savedAmountInclTax,
          input.tone,
          now,
          input.reasonTag
        )
        .run();

      await repo.updateIntentStatus(input.intentId, 'submitted');

      return {
        id: decisionId,
        intentId: input.intentId,
        outcome: input.outcome,
        savedAmountInclTax: input.savedAmountInclTax,
        tone: input.tone,
        reasonTag: input.reasonTag,
        createdAt: now,
      };
    },

    async recordIdempotency(key, method, path, responseBody, status) {
      const now = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO idempotency_keys (key, method, path, response_body, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(key, method, path, responseBody, status, now)
        .run();
    },

    async findIdempotency(key) {
      const row = await db
        .prepare(
          `SELECT key, method, path, response_body as responseBody, status, created_at as createdAt
           FROM idempotency_keys WHERE key = ?`
        )
        .bind(key)
        .first<IdempotencyRecord>();

      return row ?? null;
    },

    async updateIntentStatus(intentId, status) {
      await db.prepare(`UPDATE intents SET status = ? WHERE id = ?`).bind(status, intentId).run();
    },

    async markDraftsExpired(beforeIso) {
      const result = await db
        .prepare(
          `UPDATE intents
         SET status = 'expired'
         WHERE status = 'draft' AND created_at < ?`
        )
        .bind(beforeIso)
        .run();
      return result.meta?.changes ?? 0;
    },

    async listDecisionsInRange({ from, to }) {
      const rows = await db
        .prepare(
          `SELECT
             id,
             intent_id as intentId,
             outcome,
             saved_amount_incl_tax as savedAmountInclTax,
             tone,
             reason_tag as reasonTag,
             created_at as createdAt
           FROM decisions
           WHERE created_at >= ? AND created_at < ?
           ORDER BY created_at ASC`
        )
        .bind(from, to)
        .all<StoredDecision>();
      return rows.results ?? [];
    },

    async deleteIdempotencyBefore(beforeIso) {
      const result = await db
        .prepare(`DELETE FROM idempotency_keys WHERE created_at < ?`)
        .bind(beforeIso)
        .run();
      return result.meta?.changes ?? 0;
    },
  };

  return repo;
};
