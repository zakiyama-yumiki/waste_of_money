import { test, expect } from '@playwright/test';

test.describe('D5: オフライン→再送で二重作成なし', () => {
  test('同一 intent の2回送信でも記録は1件', async ({ page, context, request }) => {
    // 1) 起動して¥300を入力 → 代替案取得
    await page.goto('/');
    await page.getByRole('button', { name: '¥300 を入力' }).click();
    await page.getByRole('button', { name: '代替案を取得する' }).click();
    await expect(page.getByRole('heading', { name: '代替案' })).toBeVisible();

    // 2) オフライン化して「我慢する」を2回（ローカルキューに2件溜める）
    await context.setOffline(true);
    await page.getByRole('button', { name: '我慢する' }).click();
    await page.getByRole('button', { name: '我慢する' }).click();

    // キュー件数=2
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem('wom-offline-queue');
          return raw ? (JSON.parse(raw) as unknown[]).length : 0;
        })
      )
      .toBe(2);

    // 3) オンライン復帰 → 自動再送を待つ
    await context.setOffline(false);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem('wom-offline-queue');
          return raw ? (JSON.parse(raw) as unknown[]).length : 0;
        })
      , { timeout: 10_000 })
      .toBe(0);

    // 4) サマリAPIで直近5分の集計を確認（回数=1, 合計=300）
    const from = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const to = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const res = await request.get(`http://localhost:8787/api/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as any;
    expect(json.countAvoided).toBe(1);
    expect(json.monthSavedTotalInclTax).toBe(300);
  });
});

