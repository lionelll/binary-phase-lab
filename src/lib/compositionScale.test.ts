import { describe, expect, it } from 'vitest';
import { feC, pbSn } from '../data';
import { compositionToNormalized, normalizedToComposition } from './compositionScale';

describe('composition display scale', () => {
  it('keeps the current diagram axes linear', () => {
    expect(compositionToNormalized(pbSn.compositionAxis, 25)).toBeCloseTo(0.25, 10);
    expect(normalizedToComposition(pbSn.compositionAxis, 0.75)).toBeCloseTo(75, 10);
    expect(compositionToNormalized(feC.compositionAxis, 0.1)).toBeCloseTo(0.1 / 6.69, 10);
    expect(compositionToNormalized(feC.compositionAxis, 0.77)).toBeCloseTo(0.77 / 6.69, 10);
    expect(feC.compositionAxis.scaleStops).toBeUndefined();
  });

  it('round-trips Fe-C compositions without moving phase boundaries', () => {
    for (const composition of [0, 0.008, 0.0218, 0.09, 0.1, 0.17, 0.53, 0.77, 2.11, 4.3, 6.69]) {
      const normalized = compositionToNormalized(feC.compositionAxis, composition);
      expect(normalizedToComposition(feC.compositionAxis, normalized)).toBeCloseTo(composition, 10);
    }
  });

  it('preserves the high-temperature ferrite key-point order', () => {
    const points = [0, 0.04, 0.05, 0.08, 0.09, 0.17, 0.25, 0.53]
      .map((composition) => compositionToNormalized(feC.compositionAxis, composition));
    for (let index = 1; index < points.length; index += 1) expect(points[index]).toBeGreaterThan(points[index - 1]);
  });
});
