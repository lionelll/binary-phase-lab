export interface LeverResult {
  left: number;
  right: number;
}

export function calculatePhaseFractions(
  composition: number,
  leftComposition: number,
  rightComposition: number,
): LeverResult {
  const span = rightComposition - leftComposition;
  if (!Number.isFinite(span) || span <= 1e-9) return { left: 50, right: 50 };
  const clamped = Math.min(rightComposition, Math.max(leftComposition, composition));
  const right = ((clamped - leftComposition) / span) * 100;
  const left = 100 - right;
  return { left, right };
}
