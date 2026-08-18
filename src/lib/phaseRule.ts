import type { PhaseState } from '../data/types';

/** 二元系组元数。Fe–Fe₃C 按赝二元处理，同样为 2。 */
const COMPONENTS = 2;

export interface FreedomResult {
  /** 相数 P */
  phaseCount: number;
  /** 自由度 f */
  freedom: number;
  /** 供界面显示的完整表述 */
  text: string;
}

/**
 * 恒压条件下的相律（凝聚系相律）：f = C − P + 1。
 * 二元相图的压力恒定，故不使用 f = C − P + 2。
 */
export function degreesOfFreedom(state: PhaseState): FreedomResult | null {
  let phaseCount = state.phases.filter((phase) => phase && phase !== '—').length;
  // 恰好落在相界上时两相共存，相数不低于 2。
  if (state.kind === 'boundary') phaseCount = Math.max(2, phaseCount);
  if (phaseCount < 1) return null;
  const freedom = COMPONENTS - phaseCount + 1;
  const note = phaseCount === 1 ? '单相区，双变量'
    : phaseCount === 2 ? '两相共存，单变量'
    : '三相平衡，无变量';
  return { phaseCount, freedom, text: `${freedom}（${note}）` };
}
