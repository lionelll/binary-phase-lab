export function formatNumericValue(value: number, maximum: number): string {
  if (!Number.isFinite(value)) return '';
  return maximum <= 10
    ? value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
    : value.toFixed(maximum <= 500 ? 1 : 0);
}

export function parseCommittedNumber(draft: string, minimum: number, maximum: number): number | null {
  const trimmed = draft.trim();
  if (trimmed === '' || trimmed === '.' || trimmed === '-' || trimmed === '+') return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(maximum, Math.max(minimum, parsed));
}
