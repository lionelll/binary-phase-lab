import { describe, expect, it } from 'vitest';
import { resolveDiagram } from '../data';
import { compositionsAt, temperatureAt } from './geometry';
import {
  describeMicrostructureSnapshot,
  splitMicrostructureName,
} from './microstructure';
import { evaluatePhaseState } from './phaseState';

const describeMicrostructure = (diagram: Parameters<typeof describeMicrostructureSnapshot>[0], composition: number, temperature: number) =>
  describeMicrostructureSnapshot(diagram, composition, temperature).microstructure;
const describeMicrostructureFractions = (diagram: Parameters<typeof describeMicrostructureSnapshot>[0], composition: number, temperature: number) =>
  describeMicrostructureSnapshot(diagram, composition, temperature).fractions;

function expectComplete(items: Array<{ fraction: number }>) {
  expect(items.length).toBeGreaterThan(0);
  for (const item of items) {
    expect(Number.isFinite(item.fraction)).toBe(true);
    expect(item.fraction).toBeGreaterThanOrEqual(0);
    expect(item.fraction).toBeLessThanOrEqual(100);
  }
  expect(items.reduce((sum, item) => sum + item.fraction, 0)).toBeCloseTo(100, 8);
}

describe('microstructure constituent fractions', () => {
  it('calculates primary and eutectic constituents for Pb-Sn alloys', () => {
    const diagram = resolveDiagram('pb-sn');
    const hypo = describeMicrostructureFractions(diagram, 40, 120);
    const primary = (61.9 - 40) / (61.9 - 19) * 100;
    const alphaAtT = compositionsAt(diagram.boundaries.find((item) => item.id === 'alpha-solvus')!, 120)[0];
    const betaAtT = compositionsAt(diagram.boundaries.find((item) => item.id === 'beta-solvus')!, 120)[0];
    const primaryAlpha = primary * (betaAtT - 19) / (betaAtT - alphaAtT);
    expect(hypo.items.map((item) => item.name)).toEqual(['初生α相', '（α+β）共晶组织', 'βⅡ']);
    expect(hypo.items.map((item) => item.fraction)).toEqual([
      expect.closeTo(primaryAlpha, 6),
      expect.closeTo(100 - primary, 6),
      expect.closeTo(primary - primaryAlpha, 6),
    ]);
    expectComplete(hypo.items);

    const hyper = describeMicrostructureFractions(diagram, 80, 120);
    expect(hyper.items.map((item) => item.name)).toEqual(['初生β相', '（α+β）共晶组织', 'αⅡ']);
    expectComplete(hyper.items);

    const eutectic = describeMicrostructureFractions(diagram, 61.9, 120);
    expect(eutectic.items).toEqual([{ name: '（α+β）共晶组织', fraction: 100 }]);
  });

  it('tracks Pt-Ag solid-state precipitation without mixing single-phase and two-phase labels', () => {
    const diagram = resolveDiagram('pt-ag');
    const alphaSide = describeMicrostructure(diagram, 5, 900)!;
    const alphaFractions = describeMicrostructureFractions(diagram, 5, 900);
    expect(alphaSide.stage).toBe('固态脱溶（二次相析出）');
    expect(alphaSide.name).toBe('α固溶体基体 + 二次固溶体（βⅡ）');
    expect(alphaSide.formation).toContain('过饱和脱溶');
    expect(alphaFractions.items.map((item) => item.name)).toEqual(['α固溶体基体', '二次固溶体（βⅡ）']);
    expectComplete(alphaFractions.items);

    const betaSide = describeMicrostructure(diagram, 52, 900)!;
    const betaFractions = describeMicrostructureFractions(diagram, 52, 900);
    expect(betaSide.stage).toBe('固态脱溶（二次相析出）');
    expect(betaSide.name).toBe('β基体组织 + 二次固溶体（αⅡ）');
    expect(betaSide.formation).toContain('初生 α 全部消耗');
    expect(betaFractions.items.map((item) => item.name)).toEqual(['β基体组织', '二次固溶体（αⅡ）']);
    expectComplete(betaFractions.items);
  });

  it('keeps the Pt-Ag peritectic path in the equilibrium model', () => {
    const diagram = resolveDiagram('pt-ag');
    const postReaction = describeMicrostructure(diagram, 20, 900)!;
    const fractions = describeMicrostructureFractions(diagram, 20, 900);
    expect(postReaction.stage).toBe('包晶及固态转变完成');
    expect(postReaction.name).toBe('残余初生α相（含脱溶物） + 包晶β相（含脱溶物）');
    expect(postReaction.formation).toContain('各自发生固态脱溶');
    expect(postReaction.formation).not.toMatch(/壳层|壳心|不平衡/u);
    expect(fractions.items.map((item) => item.name)).toEqual(['残余初生α相（含脱溶物）', '包晶β相（含脱溶物）']);
    expectComplete(fractions.items);

    const reaction = describeMicrostructure(diagram, 30, 1186)!;
    expect(reaction.name).toBe('L + α + β（三相共存）');
    expect(reaction.formation).not.toMatch(/壳层|壳心|不平衡/u);
  });

  it('maps all five Pt-Ag composition paths to the current alpha-beta lever fractions', () => {
    const diagram = resolveDiagram('pt-ag');
    const cases = [
      { c: 5, T: 900, names: ['α固溶体基体', '二次固溶体（βⅡ）'], phaseOrder: ['α', 'β'] },
      { c: 25.4, T: 900, names: ['残余初生α相（含脱溶物）', '包晶β相（含脱溶物）'], phaseOrder: ['α', 'β'] },
      { c: 42.4, T: 900, names: ['β基体组织', '二次固溶体（αⅡ）'], phaseOrder: ['β', 'α'] },
      { c: 56.3, T: 900, names: ['β基体组织', '二次固溶体（αⅡ）'], phaseOrder: ['β', 'α'] },
      { c: 70.8, T: 700, names: ['β固溶体基体', '二次固溶体（αⅡ）'], phaseOrder: ['β', 'α'] },
    ] as const;

    for (const { c, T, names, phaseOrder } of cases) {
      const state = evaluatePhaseState(diagram, c, T);
      const result = describeMicrostructureFractions(diagram, c, T);
      expect(state.regionId, `${c}% Ag @ ${T}℃`).toBe('alpha-beta');
      expect(result.items.map((item) => item.name)).toEqual(names);
      expect(result.items.map((item) => item.fraction)).toEqual(phaseOrder.map((phase) =>
        expect.closeTo(state.equilibrium.find((item) => item.phase === phase)!.fraction, 8)));
      expectComplete(result.items);
    }
  });

  it('assigns the Pt-Ag C point to the direct beta cooling path', () => {
    const diagram = resolveDiagram('pt-ag');
    const belowInvariant = describeMicrostructure(diagram, 66.3, 1185.7)!;
    expect(belowInvariant.name).toBe('L + 初生β相');
    expect(belowInvariant.formation).not.toMatch(/初生 α|初生α|α 全部消耗|包晶反应中/u);

    const solidState = describeMicrostructure(diagram, 66.3, 800)!;
    const fractions = describeMicrostructureFractions(diagram, 66.3, 800);
    expect(solidState.name).toBe('β固溶体基体 + 二次固溶体（αⅡ）');
    expect(solidState.formation).toContain('液相直接凝固');
    expect(solidState.formation).not.toMatch(/初生 α|初生α|α 全部消耗|包晶反应中/u);
    expect(fractions.items.map((item) => item.name)).toEqual(['β固溶体基体', '二次固溶体（αⅡ）']);
    expectComplete(fractions.items);
  });

  it('uses the PhaseState invariant tolerance instead of a wide Pt-Ag reaction band', () => {
    const diagram = resolveDiagram('pt-ag');
    const exact = describeMicrostructure(diagram, 30, 1186)!;
    const justAbove = describeMicrostructure(diagram, 30, 1186.26)!;
    const justBelow = describeMicrostructure(diagram, 30, 1185.74)!;
    expect(exact.stage).toBe('包晶反应阶段');
    expect(describeMicrostructureFractions(diagram, 30, 1186).items).toEqual([]);
    expect(justAbove.stage).not.toBe('包晶反应阶段');
    expect(justBelow.stage).not.toBe('包晶反应阶段');
    expect(describeMicrostructureFractions(diagram, 30, 1186.26).items.length).toBeGreaterThan(0);
    expect(describeMicrostructureFractions(diagram, 30, 1185.74).items.length).toBeGreaterThan(0);
  });

  it('filters zero-percent Pt-Ag constituents at the solvus endpoints', () => {
    const diagram = resolveDiagram('pt-ag');
    const endpoints = [
      { c: 1, T: 400, name: 'α固溶体基体（βⅡ尚未析出）' },
      { c: 90, T: 400, name: 'β固溶体基体（αⅡ尚未析出）' },
    ] as const;
    for (const { c, T, name } of endpoints) {
      const microstructure = describeMicrostructure(diagram, c, T)!;
      const fractions = describeMicrostructureFractions(diagram, c, T);
      expect(microstructure.stage).toBe('固溶度线临界状态');
      expect(microstructure.name).toBe(name);
      expect(fractions.items).toEqual([{ name, fraction: 100 }]);
      expect(microstructure.name).not.toContain('单相');
    }
  });

  it('describes Fe-C delta and delta-gamma regions with the same constituents as the lever result', () => {
    const diagram = resolveDiagram('fe-c');
    const cases = [
      { c: 0.05, T: 1450, regionId: 'delta', names: ['δ铁素体（单相）'] },
      { c: 0.08, T: 1470, regionId: 'delta-gamma', names: ['δ铁素体', '奥氏体'] },
      { c: 0.10, T: 1480, regionId: 'delta-gamma', names: ['δ铁素体', '奥氏体'] },
    ] as const;
    for (const { c, T, regionId, names } of cases) {
      const state = evaluatePhaseState(diagram, c, T);
      const microstructure = describeMicrostructure(diagram, c, T)!;
      const fractions = describeMicrostructureFractions(diagram, c, T);
      expect(state.regionId).toBe(regionId);
      expect(splitMicrostructureName(microstructure.name)).toEqual(names);
      expect(fractions.items.map((item) => item.name)).toEqual(names);
      expectComplete(fractions.items);
      expect(microstructure.name).not.toBe('奥氏体（A）');
    }
  });

  it('calculates steel microstructure constituents below the eutectoid temperature', () => {
    const diagram = resolveDiagram('fe-c');
    const hypo = describeMicrostructureFractions(diagram, 0.45, 650);
    expect(hypo.items.map((item) => item.name)).toEqual(['铁素体', '珠光体']);
    expect(hypo.items[0].fraction).toBeCloseTo((0.77 - 0.45) / (0.77 - 0.0218) * 100, 6);
    expectComplete(hypo.items);

    const hyper = describeMicrostructureFractions(diagram, 1.2, 650);
    expect(hyper.items.map((item) => item.name)).toEqual(['珠光体', '二次渗碳体']);
    expect(hyper.items[0].fraction).toBeCloseTo((6.69 - 1.2) / (6.69 - 0.77) * 100, 6);
    expectComplete(hyper.items);
  });

  it('calculates cast-iron primary constituents and ledeburite', () => {
    const diagram = resolveDiagram('fe-c');
    const hypo = describeMicrostructureFractions(diagram, 3, 650);
    const primaryAtEutectic = (4.3 - 3) / (4.3 - 2.11) * 100;
    const secondaryCementite = primaryAtEutectic * (2.11 - 0.77) / (6.69 - 0.77);
    expect(hypo.items.map((item) => item.name)).toEqual(['珠光体', '二次渗碳体', '低温莱氏体（Ld′）']);
    expect(hypo.items.map((item) => item.fraction)).toEqual([
      expect.closeTo(primaryAtEutectic - secondaryCementite, 6),
      expect.closeTo(secondaryCementite, 6),
      expect.closeTo(100 - primaryAtEutectic, 6),
    ]);
    expectComplete(hypo.items);

    const hyper = describeMicrostructureFractions(diagram, 5, 650);
    expect(hyper.items.map((item) => item.name)).toEqual(['一次渗碳体（Fe₃CⅠ）', '低温莱氏体（Ld′）']);
    expect(hyper.items[0].fraction).toBeCloseTo((5 - 4.3) / (6.69 - 4.3) * 100, 6);
    expectComplete(hyper.items);
  });

  it('calculates all three hypoeutectic cast-iron constituents above the eutectoid temperature', () => {
    const diagram = resolveDiagram('fe-c');
    const result = describeMicrostructureFractions(diagram, 3, 850);
    const primaryAtEutectic = (4.3 - 3) / (4.3 - 2.11) * 100;
    const gammaAtT = compositionsAt(diagram.boundaries.find((item) => item.id === 'acm')!, 850)[0];
    const secondaryCementite = primaryAtEutectic * (2.11 - gammaAtT) / (6.69 - gammaAtT);
    expect(result.items.map((item) => item.name)).toEqual(['初生奥氏体', '二次渗碳体（Fe₃CⅡ）', '莱氏体（Ld）']);
    expect(result.items.map((item) => item.fraction)).toEqual([
      expect.closeTo(primaryAtEutectic - secondaryCementite, 6),
      expect.closeTo(secondaryCementite, 6),
      expect.closeTo(100 - primaryAtEutectic, 6),
    ]);
    expectComplete(result.items);
  });

  it('keeps pure iron and cementite endpoints free of zero-percent phantom constituents', () => {
    const diagram = resolveDiagram('fe-c');
    const endpoints = [
      { c: 0, T: 800, name: '铁素体（F，单相）' },
      { c: 0, T: 650, name: '铁素体（F）' },
      { c: 6.69, T: 1300, name: '液相 L' },
      { c: 6.69, T: 1000, name: '渗碳体（Fe₃C，单相）' },
      { c: 6.69, T: 650, name: '渗碳体（Fe₃C，单相）' },
    ] as const;

    for (const { c, T, name } of endpoints) {
      const state = evaluatePhaseState(diagram, c, T);
      const microstructure = describeMicrostructure(diagram, c, T)!;
      const fractions = describeMicrostructureFractions(diagram, c, T);
      expect(state.kind, `${c}% C @ ${T}℃`).not.toBe('invariant');
      expect(microstructure.name).toBe(name);
      expect(fractions.items).toEqual([{ name, fraction: 100 }]);
      expect(microstructure.name).not.toMatch(/奥氏体|莱氏体/u);
    }
  });

  it('uses the PhaseState invariant tolerance for Pb-Sn and Fe-C reaction stages', () => {
    const cases = [
      { id: 'pb-sn', c: 40, temperature: 183, stage: '共晶反应阶段' },
      { id: 'fe-c', c: 0.17, temperature: 1495, stage: '包晶反应阶段' },
      { id: 'fe-c', c: 3, temperature: 1148, stage: '共晶反应阶段' },
      { id: 'fe-c', c: 0.4, temperature: 727, stage: '共析反应阶段' },
    ] as const;

    for (const { id, c, temperature, stage } of cases) {
      const diagram = resolveDiagram(id);
      const exact = describeMicrostructure(diagram, c, temperature)!;
      expect(evaluatePhaseState(diagram, c, temperature).kind).toBe('invariant');
      expect(exact.stage).toBe(stage);
      expect(describeMicrostructureFractions(diagram, c, temperature).items).toEqual([]);

      for (const offset of [-0.26, 0.26]) {
        const sampleTemperature = temperature + offset;
        const state = evaluatePhaseState(diagram, c, sampleTemperature);
        const microstructure = describeMicrostructure(diagram, c, sampleTemperature)!;
        const fractions = describeMicrostructureFractions(diagram, c, sampleTemperature);
        expect(state.kind, `${id} ${c}% @ ${sampleTemperature}℃`).not.toBe('invariant');
        expect(microstructure.stage, `${id} ${c}% @ ${sampleTemperature}℃`).not.toBe(stage);
        expect(fractions.items.length, `${id} ${c}% @ ${sampleTemperature}℃`).toBeGreaterThan(0);
        expectComplete(fractions.items);
      }
    }
  });

  it('marks non-eutectic Pb-Sn constituents as forming during the invariant reaction', () => {
    const diagram = resolveDiagram('pb-sn');
    for (const c of [40, 80]) {
      const snapshot = describeMicrostructureSnapshot(diagram, c, 183);
      expect(evaluatePhaseState(diagram, c, 183).kind).toBe('invariant');
      expect(snapshot.microstructure.stage).toBe('共晶反应阶段');
      expect(snapshot.microstructure.name).toMatch(/^初生[αβ]相 \+ （α\+β）共晶组织形成中$/u);
      expect(snapshot.microstructure.name).not.toContain('+（');
      expect(snapshot.fractions.items).toEqual([]);
    }
  });

  it('keeps fraction labels identical to the current microstructure constituents', () => {
    const cases = [
      ['cu-ni', 40, 1260],
      ['pt-ag', 20, 900],
      ['pb-sn', 40, 120],
      ['fe-c', 1.2, 850],
      ['fe-c', 3, 850],
      ['fe-c', 3, 650],
      ['fe-c', 0, 800],
      ['fe-c', 6.69, 650],
    ] as const;
    for (const [id, composition, temperature] of cases) {
      const diagram = resolveDiagram(id);
      const microstructure = describeMicrostructure(diagram, composition, temperature)!;
      const fractions = describeMicrostructureFractions(diagram, composition, temperature);
      expect(fractions.items.map((item) => item.name), `${id} ${composition}% @ ${temperature}℃`).toEqual(
        splitMicrostructureName(microstructure.name),
      );
      expectComplete(fractions.items);
    }
  });

  it('keeps names and visible fraction rows identical around every phase boundary', () => {
    for (const id of ['cu-ni', 'pt-ag', 'pb-sn', 'fe-c'] as const) {
      const diagram = resolveDiagram(id);
      const temperatureStep = (diagram.temperatureAxis.max - diagram.temperatureAxis.min) * 0.003;
      for (const boundary of diagram.boundaries) {
        const start = boundary.points[0][0];
        const end = boundary.points[boundary.points.length - 1][0];
        for (let index = 0; index <= 12; index += 1) {
          const c = start + (end - start) * index / 12;
          const boundaryTemperature = start === end
            ? (boundary.points[0][1] + boundary.points[1][1]) / 2
            : temperatureAt(boundary, c);
          if (boundaryTemperature === null) continue;
          for (const offset of [-temperatureStep, 0, temperatureStep]) {
            const T = Math.min(diagram.temperatureAxis.max, Math.max(diagram.temperatureAxis.min, boundaryTemperature + offset));
            const state = evaluatePhaseState(diagram, c, T);
            if (state.kind === 'invariant') continue;
            const microstructure = describeMicrostructure(diagram, c, T)!;
            const fractions = describeMicrostructureFractions(diagram, c, T);
            if (fractions.items.length === 0) continue;
            expect(
              splitMicrostructureName(microstructure.name),
              `${id} ${boundary.id} ${c}% @ ${T}℃`,
            ).toEqual(fractions.items.map((item) => item.name));
            expect(fractions.items.every((item) => item.fraction.toFixed(1) !== '0.0')).toBe(true);
          }
        }
      }
    }
  });

  it('does not invent a unique constituent ratio during a three-phase reaction', () => {
    const result = describeMicrostructureFractions(resolveDiagram('pb-sn'), 61.9, 183);
    expect(result.items).toEqual([]);
    expect(result.note).toContain('不存在唯一值');
  });

  it('uses the current tie-line fractions before an invariant reaction', () => {
    const result = describeMicrostructureFractions(resolveDiagram('cu-ni'), 40, 1260);
    expect(result.items.map((item) => item.name)).toEqual(['L', '初生α相']);
    expectComplete(result.items);
  });
});
