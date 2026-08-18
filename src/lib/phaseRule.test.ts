import { describe, expect, it } from 'vitest';
import { diagrams, feC, pbSn, ptAg } from '../data';
import { compositionsAt } from './geometry';
import { evaluatePhaseState } from './phaseState';
import { degreesOfFreedom } from './phaseRule';

describe('phase rule', () => {
  it('applies f = C − P + 1 with C = 2', () => {
    const cases = [
      [diagrams[0], 40, 1500, 1, 2],   // L 单相
      [diagrams[0], 40, 1260, 2, 1],   // L + α 两相
      [feC, 1.2, 1050, 1, 2],          // A 单相
      [feC, 3.0, 900, 2, 1],           // γ + Fe₃C 两相
      [pbSn, 40, 100, 2, 1],           // α + β 两相
      [ptAg, 52, 1300, 2, 1],          // L + α 两相
    ] as const;
    for (const [diagram, composition, temperature, phaseCount, freedom] of cases) {
      const result = degreesOfFreedom(evaluatePhaseState(diagram, composition, temperature))!;
      expect(result.phaseCount, `${diagram.id} ${composition}/${temperature} 相数`).toBe(phaseCount);
      expect(result.freedom, `${diagram.id} ${composition}/${temperature} 自由度`).toBe(freedom);
    }
  });

  it('gives zero degrees of freedom on every invariant reaction', () => {
    const invariants = [
      [ptAg, 42.4, 1186], [pbSn, 61.9, 183],
      [feC, 0.17, 1495], [feC, 4.3, 1148], [feC, 0.77, 727],
    ] as const;
    for (const [diagram, composition, temperature] of invariants) {
      const state = evaluatePhaseState(diagram, composition, temperature);
      expect(state.kind).toBe('invariant');
      const result = degreesOfFreedom(state)!;
      expect(result.phaseCount, `${diagram.id} ${composition}/${temperature}`).toBe(3);
      expect(result.freedom).toBe(0);
    }
  });

  it('treats an exact boundary as two-phase coexistence', () => {
    const solidus = diagrams[0].boundaries.find((item) => item.id === 'solidus')!;
    const state = evaluatePhaseState(diagrams[0], compositionsAt(solidus, 1300)[0], 1300);
    expect(state.kind).toBe('boundary');
    expect(degreesOfFreedom(state)!.freedom).toBe(1);
  });
});
