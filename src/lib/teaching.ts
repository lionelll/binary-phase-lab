import type { PhaseDiagramDefinition, PhaseRegion, PhaseStateKind } from '../data/types';

export function teachingFor(
  diagram: PhaseDiagramDefinition,
  region: PhaseRegion | null,
  kind: PhaseStateKind,
): string {
  if (!region) return `${diagram.teaching.overview} 当前点位于相图边界附近，请观察高亮相界。`;
  if (kind === 'boundary') return `当前点位于相界上，是相数发生变化的临界状态。${region.teaching}`;
  return region.teaching;
}
