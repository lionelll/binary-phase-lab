import type { PhaseDiagramDefinition, PhaseState } from '../data/types';
import { isVisibleFraction } from './fractionDisplay';

/** 生成右栏“当前相区”文案；临界态不冒充含量已为 0 的两相区。 */
export function phaseStateDisplayLabel(
  diagram: PhaseDiagramDefinition,
  state: PhaseState,
): string {
  if (state.kind !== 'boundary') return state.regionLabel;

  if (diagram.id === 'pt-ag' &&
    (state.boundaryId === 'alpha-solvus' || state.boundaryId === 'beta-solvus')) {
    const boundary = diagram.boundaries.find((item) => item.id === state.boundaryId);
    if (!boundary) return state.regionLabel;
    const singlePhase = boundary.phases.find((phase) => !phase.includes('+'));
    const twoPhase = boundary.phases.find((phase) => phase.includes('+'));
    if (!singlePhase || !twoPhase) return state.regionLabel;
    return `${singlePhase} / ${twoPhase} 固溶度线`;
  }

  const visiblePhases = state.equilibrium.filter((item) => isVisibleFraction(item.fraction));
  return state.equilibrium.length > 1 && visiblePhases.length === 1
    ? visiblePhases[0].phase
    : state.regionLabel;
}
