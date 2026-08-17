import { describe, expect, it } from 'vitest';
import { monotoneCubic } from './interpolate';

describe('monotone cubic interpolation', () => {
  it('hits every control point and stays inside each monotone interval', () => {
    const points = [[0, 10], [20, 30], [50, 45], [100, 80]] as const;
    const evaluate = monotoneCubic(points);
    points.forEach(([x, y]) => expect(evaluate(x)).toBeCloseTo(y, 8));
    for (let x = 0; x <= 100; x += 0.5) expect(evaluate(x)).toBeGreaterThanOrEqual(10 - 1e-8);
    for (let x = 0; x <= 100; x += 0.5) expect(evaluate(x)).toBeLessThanOrEqual(80 + 1e-8);
  });

  it('rejects unordered composition coordinates', () => {
    expect(() => monotoneCubic([[0, 10], [0, 20]])).toThrow(/严格递增/);
  });
});
