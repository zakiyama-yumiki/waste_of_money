import { FC } from 'react';
import type { Alternative } from '../../../lib/api';
import './AlternativesList.css';

type Props = {
  alternatives: Alternative[];
  onDecision: (outcome: 'avoided' | 'purchased') => void;
  disabled?: boolean;
  status: 'idle' | 'sending' | 'success' | 'error';
  message?: string | null;
};

const sourceLabel: Record<string, string> = {
  rule: 'ルール',
  ai: 'AI',
};

export const AlternativesList: FC<Props> = ({ alternatives, onDecision, disabled, status, message }) => {
  return (
    <div className="alts">
      <ol className="alts__list">
        {alternatives.map((alt, index) => (
          <li key={alt.id} className="alts__item">
            <span className="alts__badge">{index + 1}</span>
            <div className="alts__text">{alt.text}</div>
            {alt.source && <span className="alts__source">{sourceLabel[alt.source] ?? alt.source}</span>}
          </li>
        ))}
      </ol>

      <div className="alts__actions">
        <button
          type="button"
          className="alts__action alts__action--avoid"
          onClick={() => onDecision('avoided')}
          disabled={disabled}
        >
          我慢する
        </button>
        <button
          type="button"
          className="alts__action alts__action--buy"
          onClick={() => onDecision('purchased')}
          disabled={disabled}
        >
          買う
        </button>
      </div>

      {status === 'sending' && <p className="alts__status">記録中です...</p>}
      {status === 'success' && message && <p className="alts__status alts__status--success">{message}</p>}
      {status === 'error' && message && <p className="alts__status alts__status--error">{message}</p>}
    </div>
  );
};
