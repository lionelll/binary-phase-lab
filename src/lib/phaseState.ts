import type { InvariantReaction, PhaseDiagramDefinition, PhaseState } from '../data/types';
import { calculatePhaseFractions } from './lever';
import { compositionsAt, distanceToBoundary, regionAt } from './geometry';
import { teachingFor } from './teaching';

const INVARIANT_TOLERANCE = 0.25;
const VISUAL_BOUNDARY_TOLERANCE = 0.0025;
const SEMANTIC_BOUNDARY_TOLERANCE = 1e-5;

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
  const visualBoundary = diagram.boundaries.find(
    (item) => distanceToBoundary(item, safeComposition, safeTemperature, compositionScale, temperatureScale) < VISUAL_BOUNDARY_TOLERANCE,
  ) ?? null;
  const semanticBoundary = diagram.boundaries.find((item) =>
    compositionsAt(item, safeTemperature).some(
      (boundaryComposition) => Math.abs(boundaryComposition - safeComposition) / compositionScale <= SEMANTIC_BOUNDARY_TOLERANCE,
    ),
  ) ?? null;
  const region = regionAt(diagram, safeComposition, safeTemperature);
  const boundaryBelongsToSinglePhaseRegion = Boolean(
    semanticBoundary &&
    region?.phases.length === 1 &&
    region.outline.some((segment) => segment.type === 'boundary' && segment.boundaryId === semanticBoundary.id),
  );
  const isSemanticBoundary = Boolean(semanticBoundary && !boundaryBelongsToSinglePhaseRegion);

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
        invariant: null, boundaryId: visualBoundary?.id ?? semanticBoundary?.id ?? null, teaching: teachingFor(diagram, region, isSemanticBoundary ? 'boundary' : 'region'),
      };
    }
  }

  const fallbackPhases = region?.phases ?? semanticBoundary?.phases ?? visualBoundary?.phases ?? ['—'];
  return {
    kind: isSemanticBoundary ? 'boundary' : 'region', composition: safeComposition, temperature: safeTemperature,
    regionId: region?.id ?? null, regionLabel: region?.label ?? semanticBoundary?.phases.join(' / ') ?? visualBoundary?.phases.join(' / ') ?? '图外状态', phases: fallbackPhases,
    equilibrium: fallbackPhases.slice(0, 1).map((phase) => ({ phase, composition: safeComposition, fraction: 100 })),
    invariant: null, boundaryId: visualBoundary?.id ?? semanticBoundary?.id ?? null, teaching: teachingFor(diagram, region, isSemanticBoundary ? 'boundary' : 'region'),
  };
}
