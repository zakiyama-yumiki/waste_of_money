# PWA ガイド

## マニフェスト（例）
```json
{
  "name": "無駄遣い防止",
  "short_name": "節約",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## オフライン戦略
- 事前キャッシュ: ルート、CSS、フォント、ルール辞書
- ランタイムキャッシュ: 画像/アイコンのみ
- Fallback: `/offline` へ誘導

## パフォーマンス
- 起動TTI P95 2s 目標（3G相当）
- 依存の最小化（Zustand）、画像ゼロ、Critical CSS

