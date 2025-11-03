import { FC } from 'react';
import type { ToneOption } from './useTonePreference';
import './ToneSelector.css';

type Props = {
  tone: ToneOption;
  onChange: (tone: ToneOption) => void;
};

const OPTIONS: { value: ToneOption; label: string; description: string }[] = [
  { value: 'gentle', label: 'やさしい', description: '背中を押すやさしいトーン' },
  { value: 'humor', label: 'ユーモア', description: '笑いを交えながら我慢を促す' },
  { value: 'spartan', label: 'スパルタ', description: 'キリッと叱咤激励する' },
];

export const ToneSelector: FC<Props> = ({ tone, onChange }) => {
  return (
    <section className="tone-card">
      <header className="tone-card__header">
        <h2>トーンを選択</h2>
        <p>APIに送る代替案やメッセージのスタイルを設定します。</p>
      </header>
      <div className="tone-card__options" role="radiogroup" aria-label="トーンの選択">
        {OPTIONS.map((option) => (
          <label key={option.value} className="tone-card__option">
            <input
              type="radio"
              name="tone"
              value={option.value}
              checked={tone === option.value}
              onChange={() => onChange(option.value)}
            />
            <div className="tone-card__option-content">
              <span className="tone-card__option-label">{option.label}</span>
              <span className="tone-card__option-description">{option.description}</span>
            </div>
          </label>
        ))}
      </div>
    </section>
  );
};
