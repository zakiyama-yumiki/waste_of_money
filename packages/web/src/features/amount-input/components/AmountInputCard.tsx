import { FC } from 'react';
import './AmountInputCard.css';

type Props = {
  amount: number | null;
  raw: string;
  presets: readonly number[];
  onPreset: (value: number) => void;
  onDigit: (digit: string) => void;
  onClear: () => void;
  onBackspace: () => void;
};

const formatYen = (value: number | null) => {
  if (value == null) return '0';
  return value.toLocaleString('ja-JP');
};

const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export const AmountInputCard: FC<Props> = ({
  amount,
  raw,
  presets,
  onPreset,
  onDigit,
  onClear,
  onBackspace,
}) => {
  return (
    <section className="amount-card">
      <header className="amount-card__header">
        <h2>金額を入力</h2>
        <p>税込金額で入力してください（プリセットは税込）</p>
      </header>

      <div className="amount-card__display">
        <span className="amount-card__display-symbol">¥</span>
        <span className="amount-card__display-value" data-empty={amount == null}>
          {formatYen(amount)}
        </span>
      </div>

      <div className="amount-card__presets">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onPreset(preset)}
            className="amount-card__preset"
            aria-label={`¥${preset.toLocaleString('ja-JP')} を入力`}
          >
            ¥{preset.toLocaleString('ja-JP')}
          </button>
        ))}
      </div>

      <div className="amount-card__keypad" role="group" aria-label="金額入力">
        {keypad.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => onDigit(digit)}
            className="amount-card__key"
            aria-label={`${digit} を入力`}
          >
            {digit}
          </button>
        ))}
        <button type="button" onClick={onBackspace} className="amount-card__key amount-card__key--action">
          ←
        </button>
        <button type="button" onClick={onClear} className="amount-card__key amount-card__key--action">
          全消去
        </button>
      </div>

      <footer className="amount-card__footer">
        <p className="amount-card__footer-hint">
          現在の入力: <span>{raw === '' ? '0' : raw}</span>
        </p>
      </footer>
    </section>
  );
};
