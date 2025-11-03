import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlternativesList } from '../features/alternatives/components/AlternativesList';
import { useOfflineQueue } from '../features/offline/useOfflineQueue';
import { useTonePreference } from '../features/preferences/useTonePreference';
import { requestAlternatives, sendDecision, type AltResponse } from '../lib/api';

export function AlternativesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const offlineQueue = useOfflineQueue();
  const tonePreference = useTonePreference();

  const amount = Number(searchParams.get('amount'));
  const key = searchParams.get('key');

  const [alternatives, setAlternatives] = useState<
    { status: 'idle' | 'loading' | 'success' | 'error'; data?: AltResponse; error?: string }
  >({ status: 'loading' });

  const [decisionState, setDecisionState] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message?: string | null;
  }>({ status: 'idle' });

  // 不正なクエリの場合は入力へリダイレクト
  useEffect(() => {
    if (isNaN(amount) || !key) {
      navigate('/');
    }
  }, [amount, key, navigate]);

  // ページを表示時にh2へフォーカスを移動
  useEffect(() => {
    const h2 = document.querySelector('h2');
    if (h2) {
      h2.focus();
    }
  }, []);

  // 代替案取得
  useEffect(() => {
    if (isNaN(amount)) return;

    const fetchAlternatives = async () => {
      setAlternatives({ status: 'loading' });
      try {
        const data = await requestAlternatives(amount, tonePreference.tone, key ?? undefined);
        setAlternatives({ status: 'success', data });
      } catch (err) {
        setAlternatives({ status: 'error', error: (err as Error).message });
      }
    };

    fetchAlternatives();
  }, [amount, tonePreference.tone, key]);

  const handleDecision = async (outcome: 'avoided' | 'purchased') => {
    if (alternatives.status !== 'success' || !alternatives.data) return;

    setDecisionState({ status: 'sending' });
    try {
      await sendDecision({
        intentId: alternatives.data.intentId,
        outcome,
        savedAmount: amount,
        tone: tonePreference.tone,
      });
      // メッセージを即座に表示して画面遷移（オフラインキュー処理は並行実行）
      setDecisionState({
        status: 'success',
        message: outcome === 'avoided' ? 'よく我慢できました！記録しました。' : '購入を記録しました。',
      });
      // 画面遷移を高速化（メッセージ表示と同時）
      setTimeout(() => {
        navigate(`/done?status=${outcome}`);
      }, 300);
      // バックグラウンドでオフラインキュー処理
      void offlineQueue.processQueue();
    } catch (err) {
      if (!navigator.onLine || err instanceof TypeError) {
        offlineQueue.enqueueDecision({
          intentId: alternatives.data.intentId,
          outcome,
          savedAmount: amount,
          tone: tonePreference.tone,
        });
        setDecisionState({
          status: 'success',
          message: 'オフラインのためキューに保存しました。接続復帰後に自動送信されます。',
        });
        // 画面遷移を高速化
        setTimeout(() => {
          navigate(`/done?status=${outcome}`);
        }, 300);
      } else {
        setDecisionState({ status: 'error', message: (err as Error).message });
      }
    }
  };

  if (isNaN(amount)) {
    return <section className="app__card">不正なクエリです。入力画面へ戻ります。</section>;
  }

  return (
    <>
      <section className="app__card app__card--info">
        <h2>代替案</h2>
        <p>気に入った代替案があれば「我慢する」を選んで記録しましょう。</p>

        {alternatives.status === 'loading' && (
          <div className="app__status">代替案を取得中です...</div>
        )}

        {alternatives.status === 'error' && (
          <div className="app__status app__status--error">{alternatives.error}</div>
        )}

        {alternatives.status === 'success' && alternatives.data && (
          <AlternativesList
            alternatives={alternatives.data.alternatives}
            onDecision={handleDecision}
            disabled={decisionState.status === 'sending'}
            status={decisionState.status}
            message={decisionState.message ?? null}
          />
        )}
      </section>

      {alternatives.status !== 'loading' && (
        <section className="app__card app__card--actions">
          <button
            type="button"
            className="app__secondary"
            onClick={() => navigate('/')}
            aria-label="入力画面に戻る"
          >
            ← 戻る
          </button>
        </section>
      )}
    </>
  );
}
