import { FC } from 'react';
import './OfflineStatus.css';

type Props = {
  isOnline: boolean;
};

export const OfflineStatus: FC<Props> = ({ isOnline }) => {
  return (
    <div className="offline-status" role="status" aria-live="polite">
      <span className={`offline-status__indicator offline-status__indicator--${isOnline ? 'online' : 'offline'}`} />
      <span>{isOnline ? 'オンライン' : 'オフラインで動作中'}</span>
    </div>
  );
};
