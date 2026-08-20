/**
 * 相区配色：清新柔和的功能色方案。
 *
 * 两条原则：
 * 1. 颜色按「相区类型」分族——液相蓝青系、单相固溶体绿系、第二相黄橙系、
 *    液固两相紫橙系、固态两相粉青系，读图时先分类型再看具体相区。
 * 2. 同一相图中相邻的相区必须可分辨。全部相邻相区对在 OKLab 下的色差已逐一核过，
 *    最小 ΔE ≈ 0.059（γ | α+γ，薄荷绿与湖蓝，色相本身就分得开），其余均在 0.077 以上。
 *    phaseColors.test.ts 会按几何相邻关系逐对复核，低于 ΔE 0.05 直接失败。
 *
 * 填充统一用半透明，压低饱和度与明度对比，避免相区色盖过相界线和标注。
 */

export type RegionCategory = 'liquid' | 'solution' | 'compound' | 'liquid-solid' | 'solid-solid';

/** 相区填充透明度。数值越低越淡，同时相邻相区的色差也越小。 */
export const REGION_FILL_ALPHA = 0.42;

/** 相名排序，保证 ['α','L'] 与 ['L','α'] 得到同一个键。 */
const PHASE_ORDER = ['L', 'δ', 'α', 'γ', 'β', 'Fe₃C'];

function phaseKey(phases: string[]): string {
  return [...phases]
    .sort((a, b) => (PHASE_ORDER.indexOf(a) + 1 || 99) - (PHASE_ORDER.indexOf(b) + 1 || 99))
    .join('+');
}

/** 相组合 → 基色。注释里的名称即配色方案中的叫法。 */
const PHASE_COLORS: Record<string, string> = {
  'L': '#38bdf8',        // 清新天青蓝——单相液相区
  'α': '#34d399',        // 薄荷翠绿——基体固溶体
  'γ': '#34d399',        // 薄荷翠绿——基体固溶体
  'δ': '#67e8f9',        // 浅水青——高温固溶体。δ+γ 透镜最宽处也只有几个像素，
                         // δ 与 γ 实际上贴在一起，用比 #2dd4bf 更偏青的色才分得开。
  'β': '#fde047',        // 浅柠檬黄——第二相固溶体。比 #fbbf24 更黄，
                         // 与相邻的 L+β 蜜桃橙由 ΔE 0.059 拉开到 0.094。
  'L+α': '#a78bfa',      // 薰衣草淡紫——液固两相
  'L+δ': '#a78bfa',      // 薰衣草淡紫——液固两相
  'L+γ': '#f0abfc',      // 淡丁香紫——高碳液固区（比 #c084fc 浅，与相邻的 L+δ 薰衣草拉开色差）
  'L+β': '#fb923c',      // 浅蜜桃橙——第二相结晶区
  'L+Fe₃C': '#f87171',   // 浅珊瑚红——一次渗碳体区
  'α+β': '#f472b6',      // 淡樱花粉——固态双相区
  'δ+γ': '#f472b6',      // 淡樱花粉——固态双相区
  'α+γ': '#22d3ee',      // 浅湖蓝——铁素体双相区
  'α+Fe₃C': '#a78bfa',   // 薰衣草淡紫——共析产物两相区
  'γ+Fe₃C': '#fcd34d',   // 浅暖金——奥氏体 + 渗碳体。铁碳相图里最大的一块，
                         // 更淡的杏橙叠到深底色上彩度只剩 0.02，会退化成灰色。
};

/** 相组合未列入时按类型回退，保证新增相图也有合理配色。 */
const CATEGORY_FALLBACK: Record<RegionCategory, string> = {
  liquid: '#38bdf8',
  solution: '#34d399',
  compound: '#fbbf24',
  'liquid-solid': '#a78bfa',
  'solid-solid': '#f472b6',
};

/** 化合物或端际第二相，与基体固溶体区分开。 */
const COMPOUND_PHASES = new Set(['β', 'Fe₃C']);

export function regionCategory(phases: string[]): RegionCategory {
  if (phases.length >= 2) return phases.includes('L') ? 'liquid-solid' : 'solid-solid';
  const phase = phases[0] ?? '';
  if (phase === 'L') return 'liquid';
  return COMPOUND_PHASES.has(phase) ? 'compound' : 'solution';
}

/** 该相组合是否在 PHASE_COLORS 中显式指定了颜色（false 表示走了类型回退）。 */
export function hasExplicitColor(phases: string[]): boolean {
  return phaseKey(phases) in PHASE_COLORS;
}

/** 相区基色（不含透明度），用于配色校验等需要纯色的场合。 */
export function regionBaseColor(phases: string[]): string {
  return PHASE_COLORS[phaseKey(phases)] ?? CATEGORY_FALLBACK[regionCategory(phases)];
}

function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/** 相区填充色，半透明。 */
export function regionColor(phases: string[]): string {
  return withAlpha(regionBaseColor(phases), REGION_FILL_ALPHA);
}

/** 半透明填充下底色始终偏暗，相区标签统一用浅色字。 */
export function readableInk(): string { return '#eef5ff'; }
