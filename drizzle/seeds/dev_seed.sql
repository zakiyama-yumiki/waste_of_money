-- 開発用の初期データ
INSERT INTO users (id, locale, goal_type, goal_value)
VALUES ('dev-user', 'ja-JP', 'saving', '旅行費')
ON CONFLICT(id) DO NOTHING;

INSERT INTO intents (id, user_id, amount_pretax, tax_rate, category, hunger_level, tone, idempotency_key, amount_incl_tax, status)
VALUES ('intent-seed-1', 'dev-user', 273, 0.10, 'snack', 3, 'gentle', 'seed-intent-1', 300, 'draft')
ON CONFLICT(id) DO NOTHING;

INSERT INTO alternatives (id, intent_id, text, tag, score, source)
VALUES
  ('alt-seed-1', 'intent-seed-1', 'マイボトルを使う', 'habit', 0.9, 'rule'),
  ('alt-seed-2', 'intent-seed-1', '自宅コーヒーで代用', 'home', 0.8, 'rule'),
  ('alt-seed-3', 'intent-seed-1', '来月のご褒美に積み立て', 'savings', 0.7, 'rule')
ON CONFLICT(id) DO NOTHING;
