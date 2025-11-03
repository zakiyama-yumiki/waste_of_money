import rules from './alternatives.json';
import { generateId } from '../lib/id';
import type { StoredAlternative } from '../repositories/intent-repository';

type Category = keyof typeof rules.categories;
type Tone = 'gentle' | 'humor' | 'spartan';

type RuleEntry = {
  id: string;
  tag?: string;
  template: string;
};

const fillTemplate = (template: string, amount: number) =>
  template.replaceAll('{amount}', amount.toLocaleString('ja-JP'));

export type AlternativeCandidate = Omit<StoredAlternative, 'intentId'>;

export const buildAlternatives = (
  amountInclTax: number,
  opts: { category?: string | null; tone?: string | null }
): AlternativeCandidate[] => {
  const requestedCategory = (opts.category ?? undefined) as Category | undefined;
  const tone = (opts.tone ?? 'gentle') as Tone;

  const picked: RuleEntry[] = [];
  const pushUnique = (entries: RuleEntry[] = []) => {
    for (const entry of entries) {
      if (!picked.find((p) => p.id === entry.id)) {
        picked.push(entry);
      }
      if (picked.length >= 3) return;
    }
  };

  const pushCategory = (category?: Category) => {
    if (!category) return;
    const config = rules.categories[category] as Record<string, RuleEntry[]> | undefined;
    if (!config) return;
    pushUnique((config[tone] as RuleEntry[] | undefined) ?? []);
    if (picked.length < 3) {
      pushUnique(config.default ?? []);
    }
  };

  pushCategory(requestedCategory);

  if (picked.length < 3) {
    const otherCategories = Object.keys(rules.categories) as Category[];
    for (const category of otherCategories) {
      if (category !== requestedCategory) {
        pushCategory(category);
      }
      if (picked.length >= 3) break;
    }
  }

  // 常にgenericを候補に追加
  pushUnique(rules.generic);

  // 3つ未満の場合は全カテゴリのdefaultを試す（generic既出を除く）
  if (picked.length < 3) {
    const otherCategories = Object.keys(rules.categories) as Category[];
    for (const category of otherCategories) {
      const config = rules.categories[category] as Record<string, RuleEntry[]> | undefined;
      if (config?.default) {
        pushUnique(config.default);
      }
      if (picked.length >= 3) break;
    }
  }

  // 最終的に3つ未満の場合はエラーをログ（本来あり得ないが防御的）
  if (picked.length < 3) {
    console.error(
      '[buildAlternatives] failed to generate 3 alternatives',
      { category: requestedCategory, tone, pickedCount: picked.length }
    );
  }

  return picked.slice(0, 3).map((entry) => ({
    id: generateId(),
    text: fillTemplate(entry.template, amountInclTax),
    tag: entry.tag ?? null,
    score: null,
    source: 'rule' as const,
  }));
};
