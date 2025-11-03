import type { ToneOption } from '../features/preferences/useTonePreference';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export type Alternative = {
  id: string;
  text: string;
  source?: 'rule' | 'ai';
};

export type AltResponse = {
  intentId: string;
  alternatives: Alternative[];
};

const headers = {
  'Content-Type': 'application/json',
};

export const generateId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function requestAlternatives(amount: number, tone: ToneOption, idempotencyKey?: string): Promise<AltResponse> {
  const headersWithIdem = {
    ...headers,
    ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }),
  };

  const res = await fetch(`${API_BASE}/alt`, {
    method: 'POST',
    headers: headersWithIdem,
    body: JSON.stringify({ amount, tone, inputIsPretax: false }),
  });

  if (!res.ok) {
    const error = await safeParseError(res);
    throw new Error(error ?? '代替案の取得に失敗しました');
  }

  const data = (await res.json()) as AltResponse;
  return data;
}

export async function sendDecision(params: {
  intentId: string;
  outcome: 'avoided' | 'purchased';
  savedAmount: number | null;
  tone: ToneOption;
}): Promise<void> {
  const headersWithIdem = {
    ...headers,
    'Idempotency-Key': generateId(),
  };

  const body: Record<string, unknown> = {
    intentId: params.intentId,
    outcome: params.outcome,
    tone: params.tone,
  };

  if (params.savedAmount != null) {
    body.savedAmount = params.savedAmount;
  }

  const res = await fetch(`${API_BASE}/decision`, {
    method: 'POST',
    headers: headersWithIdem,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await safeParseError(res);
    throw new Error(error ?? '意思決定の送信に失敗しました');
  }
}

async function safeParseError(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as unknown;
    if (typeof data === 'object' && data !== null) {
      const errorField = (data as Record<string, unknown>).error;
      if (typeof errorField === 'object' && errorField !== null) {
        const message = (errorField as Record<string, unknown>).message;
        if (typeof message === 'string') {
          return message;
        }
      }
      return JSON.stringify(data);
    }
    return null;
  } catch (err) {
    return res.statusText || null;
  }
}
