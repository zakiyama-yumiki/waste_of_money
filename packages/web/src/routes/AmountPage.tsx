import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateId } from '../lib/api';
import './AmountPage.css';

const MAX_AMOUNT = 9_999_999;

const validateAmount = (raw: string): string | null => {
  if (!raw || raw === '0') {
    return '1〜9,999,999 の整数を入力してください。';
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return '1〜9,999,999 の整数を入力してください。';
  }
  if (n < 1) {
    return '1以上の金額を入力してください。';
  }
  if (n > MAX_AMOUNT) {
    return '9,999,999円以下で入力してください。';
  }
  return null;
};

export function AmountPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const presets = [300, 500, 1000];

  // フォーカスをinputへ
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 数字のみを抽出
    const digits = e.currentTarget.value.replace(/\D+/g, '').slice(0, 7);
    setAmount(digits);
    setError(validateAmount(digits));
  };

  const handlePreset = (preset: number) => {
    setAmount(String(preset));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (composing) return; // IME入力中は送信しない

    const nextError = validateAmount(amount);
    if (nextError) {
      setError(nextError);
      return;
    }

    const key = generateId();
    navigate(`/alternatives?amount=${Number(amount)}&key=${key}`);
  };

  return (
    <section className="app__card amount-page">
      <form onSubmit={handleSubmit} aria-labelledby="amount-title">
        <div className="amount-page__header">
          <h2 id="amount-title">金額を入力</h2>
          <p>税込金額で入力してください</p>
        </div>

        <div className="amount-page__input-group">
          <div className="amount-page__display">
            <span className="amount-page__symbol">¥</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={7}
              value={amount}
              onChange={handleInputChange}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
              placeholder="0"
              className="amount-page__input"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'amount-error' : undefined}
              required
            />
          </div>

          {error && (
            <p id="amount-error" className="amount-page__error" role="alert">
              {error}
            </p>
          )}

          <div className="amount-page__presets">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                className="amount-page__preset"
                onClick={() => handlePreset(preset)}
              >
                ¥{preset.toLocaleString('ja-JP')}
              </button>
            ))}
          </div>
        </div>

        <p className="amount-page__help">
          Enter キーまたは下の「次へ」で代替案へ進みます
        </p>

        <button
          type="submit"
          className="app__primary"
          disabled={Boolean(validateAmount(amount))}
        >
          次へ
        </button>
      </form>
    </section>
  );
}
