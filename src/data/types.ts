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
}

/** 组织组成物标注（金相形貌视角）。与相标注互斥显示。 */
export interface ConstituentLabel {
  id: string;
  text: string;
  anchor: ControlPoint;
  /** SVG viewBox units；用于窄区外置，配合引线。 */
  offset?: { dx: number; dy: number };
}

/** 组织视角下的成分分界线，例如 wC = 0.77 / 2.11 / 4.30 处。 */
export interface ConstituentDivider {
  composition: number;
  from: number;
  to: number;
}

/** 典型合金预设：一键把状态点送到有教学意义的成分与温度。 */
export interface AlloyPreset {
  id: string;
  label: string;
  composition: number;
  temperature: number;
}

export interface AxisDefinition {
  min: number;
  max: number;
  ticks: number[];
  label: string;
  /** 可选分段比例尺；position 为绘图区内 0–1 的归一化位置。 */
  scaleStops?: Array<{ value: number; position: number }>;
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
  /** 组织组成物标注；缺省表示该相图不提供金相形貌视角。 */
  constituents?: ConstituentLabel[];
  constituentDividers?: ConstituentDivider[];
  presets?: AlloyPreset[];
  defaultState: { composition: number; temperature: number };
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
}
