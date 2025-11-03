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

  if (picked.length < 3) {
    pushUnique(rules.generic);
  } else {
    // still ensure generic entries can appear last as fallback when duplicates removed
    pushUnique(rules.generic);
  }

  return picked.slice(0, 3).map((entry) => ({
    id: generateId(),
    text: fillTemplate(entry.template, amountInclTax),
    tag: entry.tag ?? null,
    score: null,
    source: 'rule' as const,
  }));
};
