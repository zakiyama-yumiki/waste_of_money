import { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { OfflineStatus } from './features/offline/OfflineStatus';
import { useTonePreference } from './features/preferences/useTonePreference';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'おはようございます';
  if (hour < 18) return 'こんにちは';
  return 'こんばんは';
};

const getToneLabel = (tone: string) => {
  const labels: Record<string, string> = {
    gentle: 'やさしい',
    humor: 'ユーモア',
    spartan: 'スパルタ',
  };
  return labels[tone] ?? tone;
};

export function Layout() {
  const [greeting, setGreeting] = useState(getGreeting());
  const tonePref = useTonePreference();

  useEffect(() => {
    const timer = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const rootClass = navigator.onLine ? 'app' : 'app app--offline';

  return (
    <main className={rootClass}>
      <header className="app__header">
        <div className="app__header-flex">
          <div>
            <h1>Waste of Money</h1>
            <p>{greeting}、今日の衝動買いを我慢してみませんか？</p>
          </div>
          <div className="app__header-actions">
            <OfflineStatus isOnline={navigator.onLine} />
            <Link to="/settings/tone" className="app__settings-link" aria-label="設定（トーン）">
              設定: <strong>{getToneLabel(tonePref.tone)}</strong>
            </Link>
          </div>
        </div>
        {!navigator.onLine && <div className="app__banner">オフラインモードです。記録は復帰後に再送されます。</div>}
      </header>

      <Outlet />
    </main>
  );
}
