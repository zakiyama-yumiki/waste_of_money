const ASIA_TOKYO_OFFSET_MINUTES = 9 * 60; // UTC+9, no DST

const toTokyoDayKey = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Invalid date: ${iso}`);
  }
  const utcMillis = date.getTime();
  const tokyoMillis = utcMillis + ASIA_TOKYO_OFFSET_MINUTES * 60 * 1000;
  const tokyoDate = new Date(tokyoMillis);
  const year = tokyoDate.getUTCFullYear();
  const month = String(tokyoDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(tokyoDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export type StreakInput = {
  createdAt: string;
  outcome: 'avoided' | 'purchased';
};

export type ComputeStreakOptions = {
  asOf?: string;
};

export const computeStreak = (
  entries: StreakInput[],
  options: ComputeStreakOptions = {}
): number => {
  const avoidedDays = new Set<string>();
  for (const entry of entries) {
    if (entry.outcome !== 'avoided') continue;
    avoidedDays.add(toTokyoDayKey(entry.createdAt));
  }
  if (avoidedDays.size === 0) return 0;

  const sortedDays = Array.from(avoidedDays).sort((a, b) => (a < b ? 1 : -1));
  const asOfDay = options.asOf ? toTokyoDayKey(options.asOf) : sortedDays[0]!;
  let current = asOfDay;
  let streak = 0;

  while (avoidedDays.has(current)) {
    streak += 1;
    const currentDate = new Date(`${current}T00:00:00Z`);
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
    current = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}-${String(currentDate.getUTCDate()).padStart(2, '0')}`;
  }

  return streak;
};
