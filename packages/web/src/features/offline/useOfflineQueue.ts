import { useCallback, useEffect, useMemo, useState } from 'react';
import { OfflineDecision, loadQueue, saveQueue } from './offlineQueue';
import { sendDecision } from '../../lib/api';
import type { ToneOption } from '../preferences/useTonePreference';

export type QueueState = {
  items: OfflineDecision[];
  enqueueDecision: (params: {
    intentId: string;
    outcome: 'avoided' | 'purchased';
    savedAmount: number | null;
    tone: ToneOption;
  }) => void;
  processQueue: () => Promise<void>;
  isProcessing: boolean;
  error: string | null;
};

export const useOfflineQueue = (): QueueState => {
  const [items, setItems] = useState<OfflineDecision[]>(() => loadQueue());
  const [isProcessing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateQueue = useCallback((updater: (prev: OfflineDecision[]) => OfflineDecision[]) => {
    setItems((prev) => {
      const next = updater(prev);
      saveQueue(next);
      return next;
    });
  }, []);

  const enqueueDecision: QueueState['enqueueDecision'] = useCallback(
    ({ intentId, outcome, savedAmount, tone }) => {
      const item: OfflineDecision = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        endpoint: '/api/decision',
        payload: {
          intentId,
          outcome,
          savedAmount,
          tone,
          recordedAt: new Date().toISOString(),
        },
      };

      updateQueue((prev) => [...prev, item]);
    },
    [updateQueue]
  );

  const processQueue = useCallback(async () => {
    setProcessing(true);
    setError(null);

    const current = loadQueue();
    if (current.length === 0) {
      setProcessing(false);
      return;
    }

    const remaining: OfflineDecision[] = [];

    for (let index = 0; index < current.length; index += 1) {
      const item = current[index];
      if (!item) continue;
      try {
        await sendDecision({
          intentId: item.payload.intentId,
          outcome: item.payload.outcome,
          savedAmount: item.payload.savedAmount,
          tone: item.payload.tone,
        });
      } catch (err) {
        const rest = current.slice(index).filter(Boolean) as OfflineDecision[];
        remaining.push(...rest);
        setError((err as Error).message);
        break;
      }
    }

    updateQueue(() => remaining);
    setProcessing(false);
  }, [updateQueue]);

  useEffect(() => {
    const handler = () => {
      if (navigator.onLine) {
        void processQueue();
      }
    };

    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [processQueue]);

  useEffect(() => {
    if (navigator.onLine && items.length > 0 && !isProcessing) {
      void processQueue();
    }
  }, [items.length, isProcessing, processQueue]);

  return useMemo(
    () => ({ items, enqueueDecision, processQueue, isProcessing, error }),
    [items, enqueueDecision, processQueue, isProcessing, error]
  );
};
