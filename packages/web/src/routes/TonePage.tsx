import { useNavigate } from 'react-router-dom';
import { ToneSelector } from '../features/preferences/ToneSelector';
import { useTonePreference } from '../features/preferences/useTonePreference';
import { useEffect } from 'react';

export function TonePage() {
  const navigate = useNavigate();
  const tonePreference = useTonePreference();

  // ページを表示時にh1へフォーカスを移動
  useEffect(() => {
    const h1 = document.querySelector('h1');
    if (h1) {
      h1.focus();
    }
  }, []);

  const handleToneChange = (newTone: typeof tonePreference.tone) => {
    tonePreference.setTone(newTone);
    // トーン変更後、前のページに戻る
    navigate(-1);
  };

  return (
    <>
      <ToneSelector
        tone={tonePreference.tone}
        onChange={handleToneChange}
      />
    </>
  );
}
