import { describe, expect, it } from 'vitest';
import { resolveDiagram } from '../data';
import { describeMicrostructureFractions } from './microstructure';

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
    expect(hypo.items.map((item) => item.name)).toEqual(['初生α相', '（α+β）共晶组织']);
    expect(hypo.items[0].fraction).toBeCloseTo((61.9 - 40) / (61.9 - 19) * 100, 6);
    expectComplete(hypo.items);

    const hyper = describeMicrostructureFractions(diagram, 80, 120);
    expect(hyper.items.map((item) => item.name)).toEqual(['初生β相', '（α+β）共晶组织']);
    expect(hyper.items[0].fraction).toBeCloseTo((80 - 61.9) / (97.5 - 61.9) * 100, 6);
    expectComplete(hyper.items);

    const eutectic = describeMicrostructureFractions(diagram, 61.9, 120);
    expect(eutectic.items).toEqual([{ name: '（α+β）共晶组织', fraction: 100 }]);
  });

  it('calculates steel microstructure constituents below the eutectoid temperature', () => {
    const diagram = resolveDiagram('fe-c');
    const hypo = describeMicrostructureFractions(diagram, 0.45, 650);
    expect(hypo.items.map((item) => item.name)).toEqual(['先共析铁素体', '珠光体']);
    expect(hypo.items[0].fraction).toBeCloseTo((0.77 - 0.45) / (0.77 - 0.0218) * 100, 6);
    expectComplete(hypo.items);

    const hyper = describeMicrostructureFractions(diagram, 1.2, 650);
    expect(hyper.items.map((item) => item.name)).toEqual(['珠光体', '二次渗碳体（Fe₃CⅡ）']);
    expect(hyper.items[0].fraction).toBeCloseTo((6.69 - 1.2) / (6.69 - 0.77) * 100, 6);
    expectComplete(hyper.items);
  });

  it('calculates cast-iron primary constituents and ledeburite', () => {
    const diagram = resolveDiagram('fe-c');
    const hypo = describeMicrostructureFractions(diagram, 3, 650);
    expect(hypo.items.map((item) => item.name)).toEqual(['初生奥氏体转变组织', '低温莱氏体（Ld′）']);
    expect(hypo.items[0].fraction).toBeCloseTo((4.3 - 3) / (4.3 - 2.11) * 100, 6);
    expectComplete(hypo.items);

    const hyper = describeMicrostructureFractions(diagram, 5, 650);
    expect(hyper.items.map((item) => item.name)).toEqual(['一次渗碳体（Fe₃CⅠ）', '低温莱氏体（Ld′）']);
    expect(hyper.items[0].fraction).toBeCloseTo((5 - 4.3) / (6.69 - 4.3) * 100, 6);
    expectComplete(hyper.items);
  });

  it('does not invent a unique constituent ratio during a three-phase reaction', () => {
    const result = describeMicrostructureFractions(resolveDiagram('pb-sn'), 61.9, 183);
    expect(result.items).toEqual([]);
    expect(result.note).toContain('不存在唯一值');
  });

  it('uses the current tie-line fractions before an invariant reaction', () => {
    const result = describeMicrostructureFractions(resolveDiagram('cu-ni'), 40, 1260);
    expect(result.items.map((item) => item.name)).toEqual(['液相', 'α固溶体']);
    expectComplete(result.items);
  });
});
