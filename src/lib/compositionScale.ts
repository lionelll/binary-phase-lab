import type { AxisDefinition } from '../data/types';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function validStops(axis: AxisDefinition) {
  const stops = axis.scaleStops;
  if (!stops || stops.length < 2) return null;
  const ordered = [...stops].sort((a, b) => a.value - b.value);
  if (ordered[0].value !== axis.min || ordered[ordered.length - 1].value !== axis.max) return null;
  if (ordered[0].position !== 0 || ordered[ordered.length - 1].position !== 1) return null;
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].value <= ordered[index - 1].value || ordered[index].position <= ordered[index - 1].position) return null;
  }
  return ordered;
}

/** 将真实成分映射到绘图区 0–1 位置；无分段配置时保持线性。 */
export function compositionToNormalized(axis: AxisDefinition, composition: number): number {
  const safe = Math.min(axis.max, Math.max(axis.min, composition));
  const stops = validStops(axis);
  if (!stops) return (safe - axis.min) / (axis.max - axis.min);
  for (let index = 1; index < stops.length; index += 1) {
    const left = stops[index - 1], right = stops[index];
    if (safe <= right.value) {
      const ratio = (safe - left.value) / (right.value - left.value);
      return left.position + ratio * (right.position - left.position);
    }
  }
  return 1;
}

/** 将绘图区 0–1 位置反算为真实成分，供二维拖点使用。 */
export function normalizedToComposition(axis: AxisDefinition, normalized: number): number {
  const safe = clamp01(normalized);
  const stops = validStops(axis);
  if (!stops) return axis.min + safe * (axis.max - axis.min);
  for (let index = 1; index < stops.length; index += 1) {
    const left = stops[index - 1], right = stops[index];
    if (safe <= right.position) {
      const ratio = (safe - left.position) / (right.position - left.position);
      return left.value + ratio * (right.value - left.value);
    }
  }
  return axis.max;
}
