import { describe, expect, test } from 'vitest';
import { computeStreak } from '../src/lib/streak';

describe('computeStreak', () => {
  test('counts consecutive avoided days in Asia/Tokyo', () => {
    const entries = [
      { createdAt: '2025-10-01T12:00:00+09:00', outcome: 'avoided' as const },
      { createdAt: '2025-10-02T00:30:00+09:00', outcome: 'avoided' as const },
      { createdAt: '2025-10-02T23:59:59+09:00', outcome: 'purchased' as const },
      { createdAt: '2025-10-03T05:00:00+09:00', outcome: 'avoided' as const },
    ];
    expect(computeStreak(entries)).toBe(3);
  });

  test('streak stops when a day is missing', () => {
    const entries = [
      { createdAt: '2025-10-01T12:00:00+09:00', outcome: 'avoided' as const },
      { createdAt: '2025-10-03T12:00:00+09:00', outcome: 'avoided' as const },
    ];
    expect(computeStreak(entries)).toBe(1);
  });
});
