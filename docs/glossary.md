# 用語集（ドメイン）

- intent: 金額入力の瞬間に作成される「検討イベント」。
- decision: intentに対する最終判断。`outcome` は `avoided`（我慢）または `purchased`（購入）。
- saved_amount_incl_tax: avoided時に節約できた税込金額。原則は intent の税込額。
- tone: 文体トーン。`gentle`/`humor`/`spartan`。ユーザー設定で切替。
- category: `snack|drink|meal|hobby|other`（MVP）。
- hungerLevel: 列挙スケール。`none | low | medium | high`。
- streak: Asia/Tokyo の 0:00 区切りで、当日 avoided≥1 なら +1。
- device_id: 匿名利用時の端末識別子（UUID）。
