import { FC } from 'react';
import type { ToneOption } from './useTonePreference';
import './ToneSelectorModal.css';

type Props = {
  isOpen: boolean;
  tone: ToneOption;
  onChange: (tone: ToneOption) => void;
  onClose: () => void;
};

const OPTIONS: { value: ToneOption; label: string; description: string }[] = [
  { value: 'gentle', label: 'やさしい', description: '背中を押すやさしいトーン' },
  { value: 'humor', label: 'ユーモア', description: '笑いを交えながら我慢を促す' },
  { value: 'spartan', label: 'スパルタ', description: 'キリッと叱咤激励する' },
];

export const ToneSelectorModal: FC<Props> = ({ isOpen, tone, onChange, onClose }) => {
  if (!isOpen) return null;

  const handleOptionChange = (newTone: ToneOption) => {
    onChange(newTone);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>トーンを選択</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </header>
        <p className="modal-description">APIに送る代替案やメッセージのスタイルを設定します。</p>
        <div className="modal-options" role="radiogroup" aria-label="トーンの選択">
          {OPTIONS.map((option) => (
            <label key={option.value} className="modal-option">
              <input
                type="radio"
                name="tone"
                value={option.value}
                checked={tone === option.value}
                onChange={() => handleOptionChange(option.value)}
              />
              <div className="modal-option-content">
                <span className="modal-option-label">{option.label}</span>
                <span className="modal-option-description">{option.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
