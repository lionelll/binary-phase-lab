/**
 * 相区配色。
 *
 * 设计约束（用 dataviz 校验器实测得出）：
 * 1. 单相色相锚定语义：L 蓝、α 绿、β/Fe₃C 紫、γ 琥珀、δ 红。
 *    β 只出现在 Pt–Ag / Pb–Sn，Fe₃C 只出现在 Fe–C，二者从不共图，故共用同一色相。
 * 2. 两相区不能用母相色的向量平均——互补色相会相互抵消彩度而混出灰色，
 *    这正是旧配色「灰暗」的根因。改为在 OKLCh 极坐标下混合，保留彩度。
 * 3. 两相区靠「亮度档」与母相拉开距离；相邻两相区分配不同档位。
 */

const PHASE_COLORS: Record<string, string> = {
  L: '#0087ed',
  'α': '#49a980',
  'β': '#9341a7',
  'γ': '#b77800',
  'δ': '#b31d29',
  'Fe₃C': '#9341a7',
};

/** 两相区的三个亮度档：[OKLab L, 彩度 C]。 */
const TONES: Array<[number, number]> = [[0.70, 0.115], [0.82, 0.095], [0.92, 0.06]];

/** 每个两相区使用的亮度档，按相邻关系分配，使相邻两相区不同档。 */
const REGION_TONE: Record<string, number> = {
  'cu-ni:liquid-alpha': 2,
  'pt-ag:liquid-alpha': 2, 'pt-ag:liquid-beta': 1, 'pt-ag:alpha-beta': 0,
  'pb-sn:liquid-alpha': 2, 'pb-sn:liquid-beta': 0, 'pb-sn:alpha-beta': 1,
  'fe-c:liquid-delta': 0, 'fe-c:delta-gamma': 1, 'fe-c:liquid-gamma': 0,
  'fe-c:liquid-cementite': 2, 'fe-c:alpha-gamma': 1, 'fe-c:gamma-cementite': 1,
  'fe-c:alpha-cementite': 0,
};

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}
function linear(value: number) { return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }
function gamma(value: number) { return value <= .0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - .055; }

function toOklab(hex: string) {
  const [r0, g0, b0] = hexToRgb(hex); const r = linear(r0), g = linear(g0), b = linear(b0);
  const l = Math.cbrt(.4122214708*r + .5363325363*g + .0514459929*b);
  const m = Math.cbrt(.2119034982*r + .6806995451*g + .1073969566*b);
  const s = Math.cbrt(.0883024619*r + .2817188376*g + .6299787005*b);
  return [.2104542553*l + .793617785*m - .0040720468*s, 1.9779984951*l - 2.428592205*m + .4505937099*s, .0259040371*l + .7827717662*m - .808675766*s];
}

function fromOklab([L, A, B]: number[]) {
  const l = (L + .3963377774*A + .2158037573*B) ** 3;
  const m = (L - .1055613458*A - .0638541728*B) ** 3;
  const s = (L - .0894841775*A - 1.291485548*B) ** 3;
  const values = [
    4.0767416621*l - 3.3077115913*m + .2309699292*s,
    -1.2684380046*l + 2.6097574011*m - .3413193965*s,
    -.0041960863*l - .7034186147*m + 1.707614701*s,
  ].map((value) => Math.round(Math.min(1, Math.max(0, gamma(value))) * 255));
  return `#${values.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function hueOf(hex: string) { const [, A, B] = toOklab(hex); return (Math.atan2(B, A) * 180 / Math.PI + 360) % 360; }
function lightnessOf(hex: string) { return toOklab(hex)[0]; }

export function phaseColor(phase: string): string { return PHASE_COLORS[phase] ?? '#55708b'; }

export function regionColor(phases: string[], key?: string): string {
  if (phases.length < 2) return PHASE_COLORS[phases[0] ?? ''] ?? '#55708b';
  const first = PHASE_COLORS[phases[0]] ?? '#55708b';
  const second = PHASE_COLORS[phases[1]] ?? '#55708b';
  const tone = key !== undefined && REGION_TONE[key] !== undefined ? REGION_TONE[key] : 0;
  const [L, C] = TONES[tone] ?? TONES[0];
  const h1 = hueOf(first);
  const delta = ((hueOf(second) - h1 + 540) % 360) - 180;   // 最短弧
  const hue = (h1 + delta / 2 + 360) % 360;
  return fromOklab([L, C * Math.cos(hue * Math.PI / 180), C * Math.sin(hue * Math.PI / 180)]);
}

/** 底色偏亮时文字改用深色，保证相区标签始终可读。 */
export function readableInk(fill: string): string {
  return lightnessOf(fill) > 0.62 ? '#0a1420' : '#eef5ff';
}

export function legendPhases(phases: string[]): string[] {
  return [...new Set(phases)].filter((phase) => PHASE_COLORS[phase]);
}
