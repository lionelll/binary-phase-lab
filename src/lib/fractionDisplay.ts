/** 小于该百分数的相或组织在一位小数界面中会显示为 0.0%，因此不作为可见条目。 */
export const MIN_VISIBLE_FRACTION = 0.05;

export function isVisibleFraction(fraction: number): boolean {
  return Number.isFinite(fraction) && fraction >= MIN_VISIBLE_FRACTION;
}
