import { describe, expect, it } from 'vitest';
import { resolveDiagram } from '../data';
import { temperatureAt } from './geometry';
import { phaseStateDisplayLabel } from './phaseLabel';
import { evaluatePhaseState } from './phaseState';

describe('phase-state display labels', () => {
  it('labels Pt-Ag solvus boundaries explicitly instead of borrowing a neighboring region label', () => {
    const diagram = resolveDiagram('pt-ag');
    const cases = [
      { boundaryId: 'alpha-solvus', composition: 5, label: 'α / α+β 固溶度线' },
      { boundaryId: 'beta-solvus', composition: 70, label: 'β / α+β 固溶度线' },
    ] as const;

    for (const { boundaryId, composition, label } of cases) {
      const boundary = diagram.boundaries.find((item) => item.id === boundaryId)!;
      const temperature = temperatureAt(boundary, composition)!;
      const state = evaluatePhaseState(diagram, composition, temperature);
      expect(state.kind).toBe('boundary');
      expect(state.boundaryId).toBe(boundaryId);
      expect(phaseStateDisplayLabel(diagram, state)).toBe(label);
    }
  });

  it('selects the actually nearest Pt-Ag boundary where solidus and solvus tolerances overlap', () => {
    const diagram = resolveDiagram('pt-ag');
    const solvus = diagram.boundaries.find((item) => item.id === 'alpha-solvus')!;
    const state = evaluatePhaseState(diagram, 10.35, temperatureAt(solvus, 10.35)!);
    expect(state.kind).toBe('boundary');
    expect(state.boundaryId).toBe('alpha-solvus');
    expect(phaseStateDisplayLabel(diagram, state)).toBe('α / α+β 固溶度线');
  });

  it('keeps ordinary region labels unchanged', () => {
    const diagram = resolveDiagram('pt-ag');
    const state = evaluatePhaseState(diagram, 52, 900);
    expect(phaseStateDisplayLabel(diagram, state)).toBe(state.regionLabel);
  });

  it('shows the only non-zero phase on the Fe-C cementite endpoint boundary', () => {
    const diagram = resolveDiagram('fe-c');
    for (const temperature of [1200, 1224, 1226]) {
      const state = evaluatePhaseState(diagram, 6.69, temperature);
      expect(state.kind).toBe('boundary');
      expect(state.equilibrium.find((item) => item.phase === 'L')?.fraction ?? 0).toBeLessThan(0.05);
      expect(state.equilibrium.find((item) => item.phase === 'Fe₃C')?.fraction).toBeCloseTo(100, 8);
      expect(phaseStateDisplayLabel(diagram, state)).toBe('Fe₃C');
    }
  });
});
