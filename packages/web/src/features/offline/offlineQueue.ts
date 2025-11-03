const STORAGE_KEY = 'wom-offline-queue';

export type OfflineDecision = {
  id: string;
  endpoint: '/api/decision';
  payload: {
    intentId: string;
    outcome: 'avoided' | 'purchased';
    savedAmount: number | null;
    tone: 'gentle' | 'humor' | 'spartan';
    recordedAt: string;
  };
};

export type QueueItem = OfflineDecision;

export const loadQueue = (): QueueItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(isQueueItem);
    }
  } catch (err) {
    console.warn('offline queue load error', err);
  }
  return [];
};

export const saveQueue = (queue: QueueItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('offline queue save error', err);
  }
};

const isQueueItem = (value: unknown): value is QueueItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (item.endpoint !== '/api/decision') return false;
  const payload = item.payload as Record<string, unknown>;
  if (!payload) return false;
  return typeof payload.intentId === 'string' && typeof payload.outcome === 'string';
};
