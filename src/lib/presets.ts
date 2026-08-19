import type { AlloyPreset } from '../data/types';

const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';

export interface NumberedPreset extends AlloyPreset {
  /** 沿成分轴从左到右的序号，从 1 开始。 */
  order: number;
  /** 带圈序号，左栏与图上标注共用，保证两处一致。 */
  mark: string;
}

/** 按成分升序编号。左栏列表与图顶标注都用它，避免两处各排各的。 */
export function numberedPresets(presets?: AlloyPreset[]): NumberedPreset[] {
  if (!presets?.length) return [];
  return [...presets]
    .sort((a, b) => a.composition - b.composition)
    .map((preset, index) => ({ ...preset, order: index + 1, mark: CIRCLED[index] ?? String(index + 1) }));
}
