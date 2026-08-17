export type DiagramId = 'cu-ni' | 'pt-ag' | 'pb-sn' | 'fe-c';
export type ModuleId = 'structure' | 'cooling' | 'lever' | 'invariant';

export type ControlPoint = readonly [composition: number, temperature: number];

export interface Point {
  x: number;
  y: number;
}

export type BoundaryKind = 'liquidus' | 'solidus' | 'solvus' | 'phase' | 'compound';

export interface PhaseBoundary {
  id: string;
  label?: string;
  kind: BoundaryKind;
  phases: string[];
  dashed?: boolean;
  /** [成分 wB, 温度 ℃]，按成分严格递增。 */
  points: ControlPoint[];
}

export type OutlineSegment =
  | {
      type: 'boundary';
      boundaryId: string;
      from?: number;
      to?: number;
      reverse?: boolean;
    }
  | {
      type: 'line';
      points: ControlPoint[];
    };

export interface TieLineEnd {
  phase: string;
  boundaryId: string;
}

export interface PhaseRegion {
  id: string;
  label: string;
  phases: string[];
  labelAnchor: ControlPoint;
  /** SVG viewBox units; labelAnchor remains the geometric leader origin. */
  labelOffset?: { dx: number; dy: number };
  outline: OutlineSegment[];
  tieLine?: {
    left: TieLineEnd;
    right: TieLineEnd;
  };
  teaching: string;
}

export interface DiagramAnnotation {
  id: string;
  kind: 'phase' | 'boundary' | 'note';
  text: string;
  anchor: ControlPoint;
  /** SVG viewBox units. */
  offset?: { dx: number; dy: number };
  leader?: boolean;
}

export interface InvariantReaction {
  id: string;
  type: 'peritectic' | 'eutectic' | 'eutectoid';
  temperature: number;
  equation: string;
  points: {
    left: number;
    middle: number;
    right: number;
  };
  phaseCompositions: Array<{ phase: string; composition: number }>;
  teaching: string;
}

export interface AxisDefinition {
  min: number;
  max: number;
  ticks: number[];
  label: string;
}

export interface KeyPoint {
  label: string;
  composition: number;
  temperature: number;
  dx?: number;
  dy?: number;
}

export interface PhaseDiagramDefinition {
  id: DiagramId;
  title: string;
  shortTitle: string;
  systemType: string;
  components: { left: string; right: string };
  compositionAxis: AxisDefinition;
  temperatureAxis: AxisDefinition;
  boundaries: PhaseBoundary[];
  regions: PhaseRegion[];
  invariants: InvariantReaction[];
  keyPoints: KeyPoint[];
  annotations?: DiagramAnnotation[];
  defaultState: { composition: number; temperature: number };
  teaching: { overview: string };
}

export interface BoundaryIntersection {
  boundaryId: string;
  composition: number;
}

export interface PhaseFraction {
  phase: string;
  composition: number;
  fraction: number;
}

export type PhaseStateKind = 'region' | 'boundary' | 'invariant';

export interface PhaseState {
  kind: PhaseStateKind;
  composition: number;
  temperature: number;
  regionId: string | null;
  regionLabel: string;
  phases: string[];
  equilibrium: PhaseFraction[];
  invariant: InvariantReaction | null;
  boundaryId: string | null;
  teaching: string;
}
