import type { ControlPoint } from '../data/types';

const EPSILON = 1e-12;

/** Fritsch–Carlson 单调三次 Hermite 插值。控制点必须按 x 严格递增。 */
export function monotoneCubic(points: readonly ControlPoint[]): (x: number) => number {
  if (points.length < 2) throw new Error('相界至少需要两个控制点');

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const widths: number[] = [];
  const slopes: number[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const width = xs[index + 1] - xs[index];
    if (!(width > 0)) throw new Error('相界控制点必须按成分严格递增');
    widths.push(width);
    slopes.push((ys[index + 1] - ys[index]) / width);
  }

  const tangents = new Array(points.length).fill(0) as number[];
  tangents[0] = slopes[0];
  tangents[tangents.length - 1] = slopes[slopes.length - 1];

  for (let index = 1; index < points.length - 1; index += 1) {
    if (slopes[index - 1] * slopes[index] <= 0) {
      tangents[index] = 0;
      continue;
    }
    const leftWeight = 2 * widths[index] + widths[index - 1];
    const rightWeight = widths[index] + 2 * widths[index - 1];
    tangents[index] =
      (leftWeight + rightWeight) /
      (leftWeight / slopes[index - 1] + rightWeight / slopes[index]);
  }

  for (let index = 0; index < slopes.length; index += 1) {
    if (Math.abs(slopes[index]) < EPSILON) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }
    const alpha = tangents[index] / slopes[index];
    const beta = tangents[index + 1] / slopes[index];
    const magnitude = alpha * alpha + beta * beta;
    if (magnitude > 9) {
      const scale = 3 / Math.sqrt(magnitude);
      tangents[index] = scale * alpha * slopes[index];
      tangents[index + 1] = scale * beta * slopes[index];
    }
  }

  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1];

    let low = 0;
    let high = xs.length - 1;
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2);
      if (xs[middle] <= x) low = middle;
      else high = middle;
    }

    const width = widths[low];
    const t = (x - xs[low]) / width;
    const t2 = t * t;
    const t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    return (
      h00 * ys[low] +
      h10 * width * tangents[low] +
      h01 * ys[low + 1] +
      h11 * width * tangents[low + 1]
    );
  };
}
