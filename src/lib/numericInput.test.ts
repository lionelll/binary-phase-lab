import { describe, expect, it } from 'vitest';
import { formatNumericValue, parseCommittedNumber } from './numericInput';

describe('numeric input drafts', () => {
  it('rejects incomplete drafts without silently turning them into zero', () => {
    for (const draft of ['', '.', '-', '+']) expect(parseCommittedNumber(draft, 0, 10)).toBeNull();
  });

  it('accepts valid decimal drafts and clamps committed values', () => {
    expect(parseCommittedNumber('1.', 0, 6.69)).toBe(1);
    expect(parseCommittedNumber('0.0218', 0, 6.69)).toBeCloseTo(.0218);
    expect(parseCommittedNumber('9', 0, 6.69)).toBe(6.69);
    expect(parseCommittedNumber('-3', 0, 100)).toBe(0);
  });

  it('formats Fe-C composition and temperature deterministically', () => {
    expect(formatNumericValue(.17, 6.69)).toBe('0.17');
    expect(formatNumericValue(1495.4, 10000)).toBe('1495');
  });
});
