// ドメイン: 税込変換（half-up）
// TDD: 先にRedテスト。実装は `packages/shared/src/lib/money.ts` を想定。

import { describe, test, expect } from 'vitest';

import { toInclTaxHalfUp } from '../src/lib/money';

describe('toInclTaxHalfUp', () => {
  test('converts pretax to incl_tax with half-up rounding at boundaries: 1,9,10,11,99,100,101,999', () => {
    const cases = [
      { pretax: 1, expected: 1 },
      { pretax: 9, expected: 10 },
      { pretax: 10, expected: 11 },
      { pretax: 11, expected: 12 },
      { pretax: 99, expected: 109 },
      { pretax: 100, expected: 110 },
      { pretax: 101, expected: 111 },
      { pretax: 999, expected: 1099 },
    ] as const;

    for (const { pretax, expected } of cases) {
      expect(toInclTaxHalfUp(pretax, 0.1)).toBe(expected);
    }
  });
});
