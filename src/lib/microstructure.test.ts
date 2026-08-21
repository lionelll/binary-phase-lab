import { describe, expect, it } from 'vitest';
import { resolveDiagram } from '../data';
import { compositionsAt } from './geometry';
import { describeMicrostructure, describeMicrostructureFractions, splitMicrostructureName } from './microstructure';

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

  it('keeps fraction labels identical to the current microstructure constituents', () => {
    const cases = [
      ['cu-ni', 40, 1260],
      ['pt-ag', 20, 900],
      ['pb-sn', 40, 120],
      ['fe-c', 1.2, 850],
      ['fe-c', 3, 850],
      ['fe-c', 3, 650],
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
