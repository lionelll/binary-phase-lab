import { describe, expect, it } from 'vitest';
import { diagrams, feC, pbSn, ptAg } from '.';
import { buildRegionPolygon, compositionsAt, distanceToRegionOutline, intersectionsAtTemperature, pointInPolygon, regionAt } from '../lib/geometry';
import { evaluatePhaseState } from '../lib/phaseState';

describe('phase diagram catalog', () => {
  it('contains four complete data-driven diagrams', () => {
    expect(diagrams.map((item) => item.id)).toEqual(['cu-ni', 'pt-ag', 'pb-sn', 'fe-c']);
    for (const diagram of diagrams) {
      const boundaryIds = new Set(diagram.boundaries.map((boundary) => boundary.id));
      expect(boundaryIds.size).toBe(diagram.boundaries.length);
      for (const boundary of diagram.boundaries) {
        if (boundary.points[0][0] !== boundary.points.at(-1)?.[0]) {
          for (let index = 1; index < boundary.points.length; index += 1) expect(boundary.points[index][0]).toBeGreaterThan(boundary.points[index - 1][0]);
        }
      }
      for (const region of diagram.regions) {
        expect(buildRegionPolygon(diagram, region).length).toBeGreaterThanOrEqual(3);
        region.outline.filter((segment) => segment.type === 'boundary').forEach((segment) => expect(boundaryIds.has(segment.boundaryId)).toBe(true));
        if (region.phases.length === 2) expect(region.tieLine).toBeDefined();
      }
    }
  });

  it('preserves every required invariant and reaction direction', () => {
    expect(ptAg.invariants[0]).toMatchObject({ temperature: 1186, equation: 'L + α → β', points: { left: 10.5, middle: 42.4, right: 66.3 } });
    expect(pbSn.invariants[0]).toMatchObject({ temperature: 183, equation: 'L → α + β', points: { left: 19, middle: 61.9, right: 97.5 } });
    expect(feC.invariants.map((item) => [item.temperature, item.equation])).toEqual([[1495, 'L + δ → γ'], [1148, 'L → γ + Fe₃C'], [727, 'γ → α + Fe₃C']]);
    expect(feC.compositionAxis.max).toBe(6.69);
  });

  it('returns ordered finite isotherm intersections for representative temperatures', () => {
    for (const diagram of diagrams) {
      const temperature = diagram.defaultState.temperature;
      const intersections = intersectionsAtTemperature(diagram, temperature);
      expect(intersections.every((item) => Number.isFinite(item.composition))).toBe(true);
      expect(intersections.map((item) => item.composition)).toEqual([...intersections].map((item) => item.composition).sort((a, b) => a - b));
    }
    expect(compositionsAt(pbSn.boundaries.find((item) => item.id === 'liquidus-left')!, 183)[0]).toBeCloseTo(61.9, 4);
  });

  it('keeps every region label anchor inside its own polygon', () => {
    for (const diagram of diagrams) {
      for (const region of diagram.regions) {
        expect(
          pointInPolygon({ x: region.labelAnchor[0], y: region.labelAnchor[1] }, buildRegionPolygon(diagram, region)),
          `${diagram.id}/${region.id} label anchor`,
        ).toBe(true);
      }
    }
  });

  it('keeps the narrow Fe-C labels inside the plot and clear of H/J annotations', () => {
    type Box = { left:number; right:number; top:number; bottom:number };
    const plot = { left:92, right:872, top:58, bottom:612 };
    const x = (composition:number) => plot.left + composition / 6.69 * 780;
    const y = (temperature:number) => plot.top + (1600 - temperature) / 1000 * 554;
    const regionBox = (id:string):Box => {
      const region = feC.regions.find((item) => item.id === id)!;
      const centerX = x(region.labelAnchor[0]) + (region.labelOffset?.dx ?? 0);
      const baseline = y(region.labelAnchor[1]) + (region.labelOffset?.dy ?? 0);
      const width = region.label.length * 8;
      return { left:centerX-width/2, right:centerX+width/2, top:baseline-14, bottom:baseline+2 };
    };
    const keyBox = (label:string):Box => {
      const point = feC.keyPoints.find((item) => item.label.startsWith(label))!;
      const left = x(point.composition) + (point.dx ?? 5);
      const baseline = y(point.temperature) + (point.dy ?? -8);
      return { left, right:left+point.label.length*6.2, top:baseline-11, bottom:baseline+2 };
    };
    const intersects = (a:Box,b:Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const delta = regionBox('delta');
    expect(delta.left).toBeGreaterThanOrEqual(plot.left);
    expect(delta.right).toBeLessThanOrEqual(plot.right);
    expect(delta.top).toBeGreaterThanOrEqual(plot.top);
    expect(intersects(regionBox('liquid-delta'), keyBox('H '))).toBe(false);
    expect(intersects(regionBox('delta-gamma'), keyBox('J '))).toBe(false);
  });

  it('classifies invariant states before regions and does not invent fractions', () => {
    const states = [
      evaluatePhaseState(ptAg, 42.4, 1186),
      evaluatePhaseState(pbSn, 61.9, 183),
      evaluatePhaseState(feC, 0.17, 1495),
      evaluatePhaseState(feC, 4.3, 1148),
      evaluatePhaseState(feC, 0.77, 727),
    ];
    for (const state of states) {
      expect(state.kind).toBe('invariant');
      expect(state.equilibrium).toHaveLength(3);
      expect(state.equilibrium.every((item) => item.fraction === 0)).toBe(true);
      expect(state.teaching).toContain('不存在唯一比例');
    }
  });

  it('assigns every dense interior sample to exactly one region away from shared outlines', () => {
    for (const diagram of diagrams) {
      const compositionSpan = diagram.compositionAxis.max - diagram.compositionAxis.min;
      const temperatureSpan = diagram.temperatureAxis.max - diagram.temperatureAxis.min;
      for (let xIndex = 0; xIndex < 150; xIndex += 1) {
        for (let yIndex = 0; yIndex < 150; yIndex += 1) {
          const composition = diagram.compositionAxis.min + compositionSpan * (xIndex + .5) / 150;
          const temperature = diagram.temperatureAxis.min + temperatureSpan * (yIndex + .5) / 150;
          const nearOutline = diagram.regions.some((region) => distanceToRegionOutline(diagram, region, composition, temperature) < .0008);
          if (nearOutline) continue;
          const owners = diagram.regions.filter((region) => pointInPolygon({ x: composition, y: temperature }, buildRegionPolygon(diagram, region)));
          expect(owners.length, `${diagram.id} ${composition}, ${temperature}: ${owners.map((item) => item.id).join(',')}`).toBe(1);
        }
      }
    }
  });

  it('classifies Fe-C peritectic and GP narrow-region probes', () => {
    const probes = [
      [0.045,1480,'δ'],[0.045,1500,'δ'],[0.05,1450,'δ'],
      [0.134,1493,'δ + γ'],[0.12,1470,'δ + γ'],[0.14,1490,'δ + γ'],[0.03,1420,'δ + γ'],[0.30,1490,'L + γ'],
      [0.004,800,'α'],[0.004,700,'α'],[0.015,700,'α'],
      [0.015,800,'α + γ'],[0.01,880,'α + γ'],[0.03,800,'α + γ'],[0.30,800,'α + γ'],[0.005,900,'α + γ'],
    ] as const;
    for (const [composition, temperature, label] of probes) {
      expect(regionAt(feC, composition, temperature)?.label, `${composition}, ${temperature}`).toBe(label);
    }
  });

  it('keeps Fe-C alpha interiors as regions while preserving exact boundary semantics', () => {
    const interiors = [[.004,800],[.008,700],[.012,650],[.002,880],[.015,700]] as const;
    for (const [composition, temperature] of interiors) {
      const state = evaluatePhaseState(feC, composition, temperature);
      expect(state.kind, `${composition}, ${temperature}`).toBe('region');
      expect(state.regionLabel).toBe('α');
      expect(state.teaching).not.toContain('位于相界上');
      expect(state.boundaryId).not.toBeNull();
    }
    const gp = feC.boundaries.find((boundary) => boundary.id === 'gp')!;
    const exactComposition = compositionsAt(gp, 800)[0];
    const boundaryState = evaluatePhaseState(feC, exactComposition + feC.compositionAxis.max * 5e-6, 800);
    expect(boundaryState.kind).toBe('boundary');
    expect(boundaryState.boundaryId).toBe('gp');
    expect(boundaryState.teaching).toContain('位于相界上');
  });

  it('still reports normal-width single-phase boundaries as boundary states', () => {
    // 细窄相区的豁免不得波及正常宽度的单相区：站在液相线/固相线/溶解度线上仍应是临界态。
    const cases = [
      [diagrams[0], 'solidus', 1300],
      [diagrams[0], 'liquidus', 1300],
      [pbSn, 'alpha-solvus', 120],
      [ptAg, 'alpha-solvus', 1000],
      [feC, 'a3', 820],
    ] as const;
    for (const [diagram, boundaryId, temperature] of cases) {
      const boundary = diagram.boundaries.find((item) => item.id === boundaryId)!;
      const composition = compositionsAt(boundary, temperature)[0];
      const state = evaluatePhaseState(diagram, composition, temperature);
      expect(state.kind, `${diagram.id}/${boundaryId}@${temperature}`).toBe('boundary');
      expect(state.boundaryId).toBe(boundaryId);
      expect(state.teaching).toContain('位于相界上');
    }
  });

  it('keeps evaluated values finite for boundaries and invalid input', () => {
    for (const diagram of diagrams) {
      for (const [composition, temperature] of [[diagram.compositionAxis.min, diagram.temperatureAxis.min], [diagram.compositionAxis.max, diagram.temperatureAxis.max], [Number.NaN, Number.NaN]]) {
        const state = evaluatePhaseState(diagram, composition, temperature);
        expect(Number.isFinite(state.composition)).toBe(true);
        expect(Number.isFinite(state.temperature)).toBe(true);
        expect(state.equilibrium.every((item) => Number.isFinite(item.fraction))).toBe(true);
      }
    }
  });

  it('returns complementary fractions in representative two-phase regions', () => {
    const cases = [
      [diagrams[0], 40, 1260],
      [ptAg, 35, 1300],
      [pbSn, 40, 220],
      [feC, 1.8, 1250],
    ] as const;
    for (const [diagram, composition, temperature] of cases) {
      const state = evaluatePhaseState(diagram, composition, temperature);
      expect(state.phases.length, `${diagram.id} resolved ${state.regionLabel}`).toBe(2);
      expect(state.equilibrium).toHaveLength(2);
      expect(state.equilibrium.reduce((sum, item) => sum + item.fraction, 0)).toBeCloseTo(100, 5);
    }
  });
});
