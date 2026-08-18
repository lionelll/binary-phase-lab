import type {
  PhaseBoundary,
  PhaseDiagramDefinition,
  PhaseRegion,
  Point,
} from '../data/types';
import { monotoneCubic } from './interpolate';

const ROOT_EPSILON = 1e-7;
const cache = new WeakMap<PhaseRegion, Point[]>();

function uniqueSorted(values: number[], epsilon = 1e-5): number[] {
  return values
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
    .filter((value, index, array) => index === 0 || Math.abs(value - array[index - 1]) > epsilon);
}

export function temperatureAt(boundary: PhaseBoundary, composition: number): number | null {
  if (boundary.points.length < 2) return null;
  const first = boundary.points[0];
  const last = boundary.points[boundary.points.length - 1];
  // A vertical compound boundary is not a discrete cooling-path crossing.
  if (first[0] === last[0]) return null;
  if (composition < first[0] - ROOT_EPSILON || composition > last[0] + ROOT_EPSILON) return null;
  return monotoneCubic(boundary.points)(composition);
}

/** 返回水平等温线与一条相界的全部交点。 */
export function compositionsAt(boundary: PhaseBoundary, temperature: number): number[] {
  if (boundary.points.length < 2 || !Number.isFinite(temperature)) return [];
  const first = boundary.points[0];
  const last = boundary.points[boundary.points.length - 1];
  if (first[0] === last[0]) {
    const low = Math.min(...boundary.points.map((point) => point[1]));
    const high = Math.max(...boundary.points.map((point) => point[1]));
    return temperature >= low - ROOT_EPSILON && temperature <= high + ROOT_EPSILON ? [first[0]] : [];
  }

  const evaluate = monotoneCubic(boundary.points);
  const roots: number[] = [];
  for (let index = 0; index < boundary.points.length - 1; index += 1) {
    const [leftX] = boundary.points[index];
    const [rightX] = boundary.points[index + 1];
    let left = leftX;
    let right = rightX;
    let leftValue = evaluate(left) - temperature;
    let rightValue = evaluate(right) - temperature;
    if (Math.abs(leftValue) < ROOT_EPSILON) roots.push(left);
    if (leftValue * rightValue > 0) continue;
    if (Math.abs(rightValue) < ROOT_EPSILON) {
      roots.push(right);
      continue;
    }
    for (let iteration = 0; iteration < 52; iteration += 1) {
      const middle = (left + right) / 2;
      const value = evaluate(middle) - temperature;
      if (Math.abs(value) < ROOT_EPSILON) {
        left = middle;
        right = middle;
        break;
      }
      if (leftValue * value <= 0) {
        right = middle;
        rightValue = value;
      } else {
        left = middle;
        leftValue = value;
      }
    }
    roots.push((left + right) / 2);
  }
  return uniqueSorted(roots);
}

export function sampleBoundary(
  boundary: PhaseBoundary,
  samples = 48,
  from?: number,
  to?: number,
): Point[] {
  const start = from ?? boundary.points[0][0];
  const end = to ?? boundary.points[boundary.points.length - 1][0];
  if (Math.abs(end - start) < ROOT_EPSILON) {
    const low = Math.min(...boundary.points.map((point) => point[1]));
    const high = Math.max(...boundary.points.map((point) => point[1]));
    return [{ x: start, y: low }, { x: end, y: high }];
  }
  const evaluate = monotoneCubic(boundary.points);
  return Array.from({ length: samples + 1 }, (_, index) => {
    const x = start + ((end - start) * index) / samples;
    return { x, y: evaluate(x) };
  });
}

export function buildRegionPolygon(
  diagram: PhaseDiagramDefinition,
  region: PhaseRegion,
  samples = 40,
): Point[] {
  if (samples === 40) {
    const cached = cache.get(region);
    if (cached) return cached;
  }
  const points: Point[] = [];
  for (const segment of region.outline) {
    if (segment.type === 'line') {
      points.push(...segment.points.map(([x, y]) => ({ x, y })));
      continue;
    }
    const boundary = diagram.boundaries.find((item) => item.id === segment.boundaryId);
    if (!boundary) throw new Error(`区域 ${region.id} 引用了不存在的相界 ${segment.boundaryId}`);
    const sampled = sampleBoundary(boundary, samples, segment.from, segment.to);
    points.push(...(segment.reverse ? sampled.reverse() : sampled));
  }
  const deduped = points.filter(
    (point, index) => index === 0 || Math.abs(point.x - points[index - 1].x) > 1e-8 || Math.abs(point.y - points[index - 1].y) > 1e-8,
  );
  if (samples === 40) cache.set(region, deduped);
  return deduped;
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
    const a = polygon[current];
    const b = polygon[previous];
    const crosses = a.y > point.y !== b.y > point.y;
    if (crosses && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function regionAt(
  diagram: PhaseDiagramDefinition,
  composition: number,
  temperature: number,
): PhaseRegion | null {
  if (!Number.isFinite(composition) || !Number.isFinite(temperature)) return null;
  return diagram.regions.find((region) => pointInPolygon({ x: composition, y: temperature }, buildRegionPolygon(diagram, region))) ?? null;
}

/** 相区在给定温度下的成分跨度。用于识别比判定容差还窄的细长相区。 */
export function regionWidthAt(
  diagram: PhaseDiagramDefinition,
  region: PhaseRegion,
  temperature: number,
): number {
  const polygon = buildRegionPolygon(diagram, region);
  const crossings: number[] = [];
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
    const a = polygon[current];
    const b = polygon[previous];
    if (a.y > temperature === b.y > temperature) continue;
    crossings.push(((b.x - a.x) * (temperature - a.y)) / (b.y - a.y) + a.x);
  }
  if (crossings.length < 2) return 0;
  return Math.max(...crossings) - Math.min(...crossings);
}

export function distanceToBoundary(
  boundary: PhaseBoundary,
  composition: number,
  temperature: number,
  compositionScale: number,
  temperatureScale: number,
): number {
  const samples = sampleBoundary(boundary, 90);
  let closest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < samples.length - 1; index += 1) {
    const a = { x: samples[index].x / compositionScale, y: samples[index].y / temperatureScale };
    const b = { x: samples[index + 1].x / compositionScale, y: samples[index + 1].y / temperatureScale };
    const p = { x: composition / compositionScale, y: temperature / temperatureScale };
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length));
    closest = Math.min(closest, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
  }
  return closest;
}

export function distanceToRegionOutline(
  diagram: PhaseDiagramDefinition,
  region: PhaseRegion,
  composition: number,
  temperature: number,
): number {
  const compositionScale = diagram.compositionAxis.max - diagram.compositionAxis.min;
  const temperatureScale = diagram.temperatureAxis.max - diagram.temperatureAxis.min;
  const polygon = buildRegionPolygon(diagram, region);
  const p = { x: composition / compositionScale, y: temperature / temperatureScale };
  let closest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const a = { x: current.x / compositionScale, y: current.y / temperatureScale };
    const b = { x: next.x / compositionScale, y: next.y / temperatureScale };
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length));
    closest = Math.min(closest, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
  }
  return closest;
}
