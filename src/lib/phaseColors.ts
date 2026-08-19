/**
 * 相区配色：按「相区类型」着色，而不是按单个相的身份。
 * 读图时一眼可分辨单相 / 液固两相 / 固态两相，这是教学相图的主要诉求。
 *
 * 同类相区若彼此相邻，则用同色系的第二变体区分；变体分配见 REGION_VARIANT。
 */

export type RegionCategory = 'liquid' | 'solution' | 'compound' | 'liquid-solid' | 'solid-solid';

/** 每类的主色与备用变体（Tailwind 同族色）。 */
const CATEGORY_COLORS: Record<RegionCategory, [string, string]> = {
  liquid: ['#38bdf8', '#38bdf8'],            // 天蓝
  solution: ['#22c55e', '#10b981'],          // 翠绿 / 翡翠绿
  compound: ['#f59e0b', '#f59e0b'],          // 琥珀金黄
  'liquid-solid': ['#a855f7', '#7c3aed'],    // 紫罗兰紫 / 深紫（补充变体）
  'solid-solid': ['#ec4899', '#ef4444'],     // 玫瑰粉 / 赤红
};

/** 化合物或端际第二相，与固溶体区分开。 */
const COMPOUND_PHASES = new Set(['β', 'Fe₃C']);

export function regionCategory(phases: string[]): RegionCategory {
  if (phases.length >= 2) return phases.includes('L') ? 'liquid-solid' : 'solid-solid';
  const phase = phases[0] ?? '';
  if (phase === 'L') return 'liquid';
  return COMPOUND_PHASES.has(phase) ? 'compound' : 'solution';
}

/** 仅列出「同类且相邻」需要改用变体的相区，其余一律用主色。 */
const REGION_VARIANT: Record<string, 1> = {
  'pt-ag:liquid-beta': 1,
  'fe-c:gamma': 1,
  'fe-c:liquid-gamma': 1,
  'fe-c:alpha-gamma': 1,
  'fe-c:gamma-cementite': 1,
};

export function regionColor(phases: string[], key?: string): string {
  const pair = CATEGORY_COLORS[regionCategory(phases)];
  return pair[key !== undefined && REGION_VARIANT[key] === 1 ? 1 : 0];
}

const CATEGORY_LABEL: Record<RegionCategory, string> = {
  liquid: '液相',
  solution: '固溶体单相',
  compound: '化合物 / 第二相',
  'liquid-solid': '液固两相',
  'solid-solid': '固态两相',
};

const CATEGORY_ORDER: RegionCategory[] = ['liquid', 'solution', 'compound', 'liquid-solid', 'solid-solid'];

/** 颜色编码的是相区类型，图例因此按类型给出，只列出该相图实际出现的类别。 */
export function legendEntries(regionPhases: string[][]): Array<{ category: RegionCategory; label: string; color: string }> {
  const present = new Set(regionPhases.map((phases) => regionCategory(phases)));
  return CATEGORY_ORDER.filter((category) => present.has(category))
    .map((category) => ({ category, label: CATEGORY_LABEL[category], color: CATEGORY_COLORS[category][0] }));
}

/** 半透明填充下底色始终偏暗，相区标签统一用浅色字。 */
export function readableInk(): string { return '#eef5ff'; }
