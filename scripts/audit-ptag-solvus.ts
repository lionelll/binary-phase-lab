import { resolveDiagram } from '../src/data';
import { temperatureAt } from '../src/lib/geometry';
import { describeMicrostructureSnapshot, splitMicrostructureName } from '../src/lib/microstructure';
import { phaseStateDisplayLabel } from '../src/lib/phaseLabel';
import { evaluatePhaseState } from '../src/lib/phaseState';

const diagram = resolveDiagram('pt-ag');
const boundaries = ['alpha-solvus', 'beta-solvus'].map((id) =>
  diagram.boundaries.find((item) => item.id === id)!);
const mismatches: string[] = [];
const temperatureSpan = diagram.temperatureAxis.max - diagram.temperatureAxis.min;
// 同时覆盖语义相界容差内外：最远到温度轴跨度的 4%，避免所有样本都被相界分支吸收。
const offsets = [-0.04, -0.03, -0.02, -0.01, -0.005, -0.002, 0, 0.002, 0.005, 0.01, 0.02, 0.03, 0.04]
  .map((ratio) => ratio * temperatureSpan);
let samples = 0;
let regionSamples = 0;
let boundarySamples = 0;

for (const boundary of boundaries) {
  const start = boundary.points[0][0];
  const end = boundary.points[boundary.points.length - 1][0];
  for (let composition = start; composition <= end + 1e-8; composition += 0.05) {
    const boundaryTemperature = temperatureAt(boundary, Math.min(composition, end));
    if (boundaryTemperature === null) continue;
    for (const offset of offsets) {
      const temperature = boundaryTemperature + offset;
      if (temperature < diagram.temperatureAxis.min || temperature > diagram.temperatureAxis.max) continue;
      const state = evaluatePhaseState(diagram, composition, temperature);
      const { microstructure, fractions } = describeMicrostructureSnapshot(diagram, composition, temperature);
      samples += 1;

      if (state.kind !== 'invariant' && fractions.items.length > 0 &&
        splitMicrostructureName(microstructure.name).join('|') !== fractions.items.map((item) => item.name).join('|')) {
        mismatches.push(`${composition.toFixed(2)}% @ ${temperature.toFixed(2)}℃: 名称与含量条目不一致`);
      }

      if (state.kind === 'region') {
        regionSamples += 1;
        const visiblePhaseCount = state.equilibrium.filter((item) => item.fraction >= 0.05).length;
        if (visiblePhaseCount !== fractions.items.length ||
          (state.regionId === 'alpha-beta' && microstructure.name.includes('单相'))) {
          mismatches.push(`${composition.toFixed(2)}% @ ${temperature.toFixed(2)}℃: ${state.regionId} / ${microstructure.name}`);
        }
      } else if (state.kind === 'boundary' &&
        (state.boundaryId === 'alpha-solvus' || state.boundaryId === 'beta-solvus')) {
        boundarySamples += 1;
        if (microstructure.stage !== '固溶度线临界状态' ||
          !phaseStateDisplayLabel(diagram, state).endsWith('固溶度线') ||
          microstructure.name.includes('单相') ||
          fractions.items.some((item) => item.fraction < 0.05)) {
          mismatches.push(`${composition.toFixed(2)}% @ ${temperature.toFixed(2)}℃: 相界显示不一致`);
        }
      }
    }
  }
}

if (samples < 10_000 || regionSamples < samples * 0.25 || boundarySamples === 0 || mismatches.length > 0) {
  throw new Error(`Pt–Ag 固溶度线审计失败：${JSON.stringify({ samples, regionSamples, boundarySamples, mismatches: mismatches.slice(0, 20) })}`);
}

console.log(`Pt–Ag 固溶度线审计通过：${samples} 个样本，${regionSamples} 个相区点，${boundarySamples} 个固溶度线临界点，0 例漂移。`);
