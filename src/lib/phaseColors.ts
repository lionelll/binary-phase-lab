const PHASE_COLORS: Record<string, string> = {
  L: '#287cc1',
  'α': '#2ca879',
  'β': '#9d6bd1',
  'γ': '#df8a3d',
  'δ': '#dc6074',
  'Fe₃C': '#8c98aa',
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

export function phaseColor(phase: string): string { return PHASE_COLORS[phase] ?? '#55708b'; }
export function regionColor(phases: string[]): string {
  if (phases.length < 2) return phaseColor(phases[0] ?? '');
  const left = toOklab(phaseColor(phases[0])); const right = toOklab(phaseColor(phases[1]));
  return fromOklab(left.map((value, index) => (value + right[index]) / 2));
}
export function legendPhases(phases: string[]): string[] { return [...new Set(phases)].filter((phase) => PHASE_COLORS[phase]); }
