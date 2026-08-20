import { describe, expect, it } from 'vitest';
import { diagrams } from '../data';
import { buildRegionPolygon } from './geometry';
import { hasExplicitColor, regionBaseColor, regionColor, REGION_FILL_ALPHA } from './phaseColors';

/** 相区填充叠在绘图区底色上之后的实际观感色。 */
const PLOT_BACKGROUND = [7, 17, 29];

function toLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function oklab(color: number[]): number[] {
  const [r, g, b] = color.map(toLinear);
  const l = Math.cbrt(0.4122 * r + 0.5364 * g + 0.0514 * b);
  const m = Math.cbrt(0.2119 * r + 0.6806 * g + 0.1074 * b);
  const s = Math.cbrt(0.0883 * r + 0.2817 * g + 0.6300 * b);
  return [
    0.2105 * l + 0.7936 * m - 0.0041 * s,
    1.9780 * l - 2.4286 * m + 0.4506 * s,
    0.0259 * l + 0.7827 * m - 0.8087 * s,
  ];
}

function composited(hex: string): number[] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
    .map((channel, index) => PLOT_BACKGROUND[index] + (channel - PLOT_BACKGROUND[index]) * REGION_FILL_ALPHA);
}

function deltaE(first: string, second: string): number {
  const a = oklab(composited(first));
  const b = oklab(composited(second));
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

describe('相区配色', () => {
  it('四套相图的每个相组合都有显式配色，不走类型回退', () => {
    const unnamed = diagrams.flatMap((diagram) =>
      diagram.regions.filter((region) => !hasExplicitColor(region.phases)).map((region) => `${diagram.id}:${region.id}`));
    expect(unnamed).toEqual([]);
  });

  it('填充色带统一透明度', () => {
    for (const diagram of diagrams) {
      for (const region of diagram.regions) {
        expect(regionColor(region.phases)).toBe(
          regionBaseColor(region.phases).replace(
            /^#(..)(..)(..)$/,
            (_, r: string, g: string, b: string) =>
              `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${REGION_FILL_ALPHA})`,
          ),
        );
      }
    }
  });

  it('几何上相邻的相区，颜色在 OKLab 下至少相差 ΔE 0.05', () => {
    const failures: string[] = [];
    for (const diagram of diagrams) {
      const compositionScale = diagram.compositionAxis.max - diagram.compositionAxis.min;
      const temperatureScale = diagram.temperatureAxis.max - diagram.temperatureAxis.min;
      // 直线段在 buildRegionPolygon 里只保留端点，先按归一化步长细分，
      // 否则两个相区共用的水平线（如 1148℃ 那段）只会匹配上一个端点。
      const outlines = diagram.regions.map((region) => {
        const normalized = buildRegionPolygon(diagram, region, 120).map((point) => ({
          x: point.x / compositionScale,
          y: point.y / temperatureScale,
        }));
        const dense: typeof normalized = [];
        for (let index = 0; index < normalized.length; index += 1) {
          const from = normalized[index];
          const to = normalized[(index + 1) % normalized.length];
          const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 0.002));
          for (let step = 0; step < steps; step += 1) {
            dense.push({ x: from.x + ((to.x - from.x) * step) / steps, y: from.y + ((to.y - from.y) * step) / steps });
          }
        }
        return dense;
      });
      for (let i = 0; i < diagram.regions.length; i += 1) {
        for (let j = i + 1; j < diagram.regions.length; j += 1) {
          // 只算「共用一段边界」。两个相区若只在一点相接（如 δ+γ 透镜闭合处的 δ 与 γ），
          // 中间有相界线隔开，不构成配色上的混淆。
          const contact = outlines[i].filter((a) => outlines[j].some((b) => Math.hypot(a.x - b.x, a.y - b.y) < 0.004));
          if (contact.length < 2) continue;
          const span = Math.hypot(
            Math.max(...contact.map((point) => point.x)) - Math.min(...contact.map((point) => point.x)),
            Math.max(...contact.map((point) => point.y)) - Math.min(...contact.map((point) => point.y)),
          );
          if (span < 0.02) continue;
          const delta = deltaE(regionBaseColor(diagram.regions[i].phases), regionBaseColor(diagram.regions[j].phases));
          if (delta < 0.05) {
            failures.push(`${diagram.id} ${diagram.regions[i].label} | ${diagram.regions[j].label} ΔE=${delta.toFixed(3)}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
