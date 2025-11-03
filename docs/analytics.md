# 分析・計測

## 主要イベント
- `alt_generated` { amount_incl_tax, source:'rule'|'ai', gen_ms, tone, fallback_used }
- `decision_made` { outcome, saved_amount_incl_tax, intent_age_ms, tone }
- `summary_viewed` { range_days, saved_total_incl_tax }

## KPI 算出
- 我慢率 = avoided_count / (avoided_count + purchased_count)
- 月次節約累計 = sum(saved_amount_incl_tax)
- 連続日数(streak) = Asia/Tokyo 0:00 区切りで、当日 avoided≥1 なら +1

