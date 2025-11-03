import { useNavigate, useSearchParams } from 'react-router-dom';

export function DonePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const status = searchParams.get('status') as 'avoided' | 'purchased' | null;

  const message =
    status === 'avoided'
      ? 'よく我慢できました！'
      : status === 'purchased'
        ? '購入を記録しました。'
        : '完了しました。';

  return (
    <section className="app__card">
      <h2>完了</h2>
      <p className="app__status app__status--success">{message}</p>

      <button
        type="button"
        className="app__primary"
        onClick={() => navigate('/')}
      >
        トップへ戻る
      </button>
    </section>
  );
}
