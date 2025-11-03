import { useCallback, useState } from 'react';

const PRESET_AMOUNTS = [300, 500, 1000] as const;
const MAX_LENGTH = 6; // 999,999 円までにガード

const sanitize = (value: string) => value.replace(/\D/g, '').slice(0, MAX_LENGTH);

export const useAmountInput = () => {
  const [raw, setRaw] = useState('');

  const setAmount = useCallback((next: string | number) => {
    const nextRaw = typeof next === 'number' ? String(next) : sanitize(next);
    setRaw(nextRaw);
  }, []);

  const appendDigit = useCallback((digit: string) => {
    setRaw((prev) => sanitize(prev + digit));
  }, []);

  const removeLast = useCallback(() => {
    setRaw((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => setRaw(''), []);

  const value = raw === '' ? null : Number(raw);

  return {
    value,
    raw,
    setAmount,
    appendDigit,
    removeLast,
    clear,
    presets: PRESET_AMOUNTS,
    isEmpty: raw.length === 0,
  };
};
