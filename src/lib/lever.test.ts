import { describe, expect, it } from 'vitest';
import { calculatePhaseFractions } from './lever';

describe('lever rule', () => {
  it('returns complementary fractions across a tie line', () => {
    for (let composition = 10; composition <= 70; composition += 1) {
      const result = calculatePhaseFractions(composition, 10, 70);
      expect(result.left).toBeGreaterThanOrEqual(0);
      expect(result.right).toBeGreaterThanOrEqual(0);
      expect(result.left + result.right).toBeCloseTo(100, 8);
    }
  });

  it('clamps compositions beyond the tie line without NaN', () => {
    expect(calculatePhaseFractions(-5, 10, 20)).toEqual({ left: 100, right: 0 });
    expect(calculatePhaseFractions(30, 10, 20)).toEqual({ left: 0, right: 100 });
  });
});
