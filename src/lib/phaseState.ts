import type { InvariantReaction, PhaseDiagramDefinition, PhaseState } from '../data/types';
import { calculatePhaseFractions } from './lever';
import { compositionsAt, distanceToBoundary, regionAt, regionWidthAt } from './geometry';
import { teachingFor } from './teaching';

const INVARIANT_TOLERANCE = 0.25;
/** 归一化判定容差，约合 2 个绘图单位。 */
const BOUNDARY_TOLERANCE = 0.0025;

export function isInvariantApplicable(reaction: InvariantReaction, composition: number): boolean {
  return Number.isFinite(composition) &&
    composition >= reaction.points.left - 1e-6 &&
    composition <= reaction.points.right + 1e-6;
}

export function activeInvariant(
  diagram: PhaseDiagramDefinition,
  composition: number,
  temperature: number,
): InvariantReaction | null {
  return diagram.invariants.find(
    (reaction) =>
      Math.abs(temperature - reaction.temperature) <= INVARIANT_TOLERANCE &&
      isInvariantApplicable(reaction, composition),
  ) ?? null;
}

export function findCrossedInvariant(
  diagram: PhaseDiagramDefinition,
  composition: number,
  previousTemperature: number,
  nextTemperature: number,
  triggeredIds: ReadonlySet<string>,
): InvariantReaction | null {
  if (!Number.isFinite(previousTemperature) || !Number.isFinite(nextTemperature)) return null;
  return diagram.invariants
    .filter((reaction) =>
      !triggeredIds.has(reaction.id) &&
      isInvariantApplicable(reaction, composition) &&
      previousTemperature > reaction.temperature &&
      nextTemperature <= reaction.temperature)
    .sort((a, b) => b.temperature - a.temperature)[0] ?? null;
}

export function evaluatePhaseState(
  diagram: PhaseDiagramDefinition,
  composition: number,
  temperature: number,
): PhaseState {
  const safeComposition = Number.isFinite(composition)
    ? Math.min(diagram.compositionAxis.max, Math.max(diagram.compositionAxis.min, composition))
    : diagram.defaultState.composition;
  const safeTemperature = Number.isFinite(temperature)
    ? Math.min(diagram.temperatureAxis.max, Math.max(diagram.temperatureAxis.min, temperature))
    : diagram.defaultState.temperature;

  const invariant = activeInvariant(diagram, safeComposition, safeTemperature);
  if (invariant) {
    return {
      kind: 'invariant', composition: safeComposition, temperature: invariant.temperature,
      regionId: invariant.id, regionLabel: '三相平衡', phases: invariant.phaseCompositions.map((item) => item.phase),
      equilibrium: invariant.phaseCompositions.map((item) => ({ ...item, fraction: 0 })), invariant, boundaryId: null,
      teaching: `${invariant.teaching} 三相共存时比例随反应进度变化，不存在唯一比例。`,
    };
  }

  const compositionScale = diagram.compositionAxis.max - diagram.compositionAxis.min;
  const temperatureScale = diagram.temperatureAxis.max - diagram.temperatureAxis.min;
  const nearestBoundary = diagram.boundaries.find(
    (item) => distanceToBoundary(item, safeComposition, safeTemperature, compositionScale, temperatureScale) < BOUNDARY_TOLERANCE,
  ) ?? null;
  let region = regionAt(diagram, safeComposition, safeTemperature);
  if (!region) {
    // 相区多边形的外沿与坐标轴上下限完全重合，点正好落在边上时 pointInPolygon 判否。
    // 仅在首次查找失败时向绘图区内微移后重试，不影响内部任何判定。
    const insetComposition = compositionScale * 1e-4;
    const insetTemperature = temperatureScale * 1e-4;
    region = regionAt(
      diagram,
      Math.min(diagram.compositionAxis.max - insetComposition, Math.max(diagram.compositionAxis.min + insetComposition, safeComposition)),
      Math.min(diagram.temperatureAxis.max - insetTemperature, Math.max(diagram.temperatureAxis.min + insetTemperature, safeTemperature)),
    );
  }
  // 相区本身比容差还窄时（如 Fe-C 的 α 细条，总宽 0.0218% C），区内每一点都会落在容差里，
  // 不能据此判为"位于相界上"，否则单相区会被讲成临界态。
  const regionNarrowerThanTolerance = Boolean(
    region && regionWidthAt(diagram, region, safeTemperature) / compositionScale < BOUNDARY_TOLERANCE * 2,
  );
  const isSemanticBoundary = Boolean(nearestBoundary && !regionNarrowerThanTolerance);

  if (region?.tieLine) {
    const leftBoundary = diagram.boundaries.find((item) => item.id === region.tieLine?.left.boundaryId);
    const rightBoundary = diagram.boundaries.find((item) => item.id === region.tieLine?.right.boundaryId);
    const leftComposition = leftBoundary ? compositionsAt(leftBoundary, safeTemperature)[0] : undefined;
    const rightCandidates = rightBoundary ? compositionsAt(rightBoundary, safeTemperature) : [];
    const rightComposition = rightCandidates[rightCandidates.length - 1];
    if (leftComposition !== undefined && rightComposition !== undefined) {
      const orderedLeft = Math.min(leftComposition, rightComposition);
      const orderedRight = Math.max(leftComposition, rightComposition);
      const fractions = calculatePhaseFractions(safeComposition, orderedLeft, orderedRight);
      const leftPhase = leftComposition <= rightComposition ? region.tieLine.left.phase : region.tieLine.right.phase;
      const rightPhase = leftComposition <= rightComposition ? region.tieLine.right.phase : region.tieLine.left.phase;
      return {
        kind: isSemanticBoundary ? 'boundary' : 'region', composition: safeComposition, temperature: safeTemperature,
        regionId: region.id, regionLabel: region.label, phases: region.phases,
        equilibrium: [
          { phase: leftPhase, composition: orderedLeft, fraction: fractions.left },
          { phase: rightPhase, composition: orderedRight, fraction: fractions.right },
        ],
        invariant: null, boundaryId: nearestBoundary?.id ?? null, teaching: teachingFor(diagram, region, isSemanticBoundary ? 'boundary' : 'region'),
      };
    }
  }

  const fallbackPhases = region?.phases ?? nearestBoundary?.phases ?? ['—'];
  return {
    kind: isSemanticBoundary ? 'boundary' : 'region', composition: safeComposition, temperature: safeTemperature,
    regionId: region?.id ?? null, regionLabel: region?.label ?? nearestBoundary?.phases.join(' / ') ?? '图外状态', phases: fallbackPhases,
    equilibrium: fallbackPhases.slice(0, 1).map((phase) => ({ phase, composition: safeComposition, fraction: 100 })),
    invariant: null, boundaryId: nearestBoundary?.id ?? null, teaching: teachingFor(diagram, region, isSemanticBoundary ? 'boundary' : 'region'),
  };
}
