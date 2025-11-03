import { useEffect, useState } from 'react';

export type ToneOption = 'gentle' | 'humor' | 'spartan';

const STORAGE_KEY = 'wom-tone';
const DEFAULT_TONE: ToneOption = 'gentle';

export const useTonePreference = () => {
  const [tone, setToneState] = useState<ToneOption>(DEFAULT_TONE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ToneOption | null;
      if (stored === 'gentle' || stored === 'humor' || stored === 'spartan') {
        setToneState(stored);
      }
    } catch (err) {
      console.warn('tone preference load error', err);
    }
  }, []);

  const setTone = (next: ToneOption) => {
    setToneState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      console.warn('tone preference persist error', err);
    }
  };

  return { tone, setTone };
};
