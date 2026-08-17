import { describe, expect, it } from 'vitest';
import { feC, pbSn, ptAg } from '../data';
import { findCrossedInvariant } from '../lib/phaseState';
import { resetCoolingSession, startNewCoolingSession } from './useCooling';

describe('cooling invariant selection', () => {
  it('filters reactions by overall composition', () => {
    expect(findCrossedInvariant(pbSn, 5, 200, 170, new Set())).toBeNull();
    expect(findCrossedInvariant(pbSn, 61.9, 200, 170, new Set())?.id).toBe('eutectic');
    expect(findCrossedInvariant(ptAg, 90, 1200, 1170, new Set())).toBeNull();
    expect(findCrossedInvariant(feC, 3, 1510, 1480, new Set())).toBeNull();
    expect(findCrossedInvariant(feC, .17, 1160, 1130, new Set())).toBeNull();
    expect(findCrossedInvariant(feC, .17, 1510, 1480, new Set())?.id).toBe('peritectic');
    expect(findCrossedInvariant(feC, 3, 1160, 1130, new Set())?.id).toBe('eutectic');
    expect(findCrossedInvariant(feC, .17, 740, 710, new Set())?.id).toBe('eutectoid');
  });

  it('does not return an already-triggered reaction', () => {
    expect(findCrossedInvariant(pbSn, 61.9, 200, 170, new Set(['eutectic']))).toBeNull();
  });

  it('records a crossing and suppresses the same reaction after a resumed pass', () => {
    const triggeredIds = new Set<string>();
    const first = findCrossedInvariant(pbSn, 61.9, 200, 170, triggeredIds);
    expect(first?.id).toBe('eutectic');
    if (first) triggeredIds.add(first.id);
    expect(findCrossedInvariant(pbSn, 61.9, 200, 170, triggeredIds)).toBeNull();
    expect([...triggeredIds]).toEqual(['eutectic']);
  });

  it('clears reaction history for new runs and resets', () => {
    expect(startNewCoolingSession(250).triggeredIds.size).toBe(0);
    expect(startNewCoolingSession(250).runStartTemperature).toBe(250);
    expect(resetCoolingSession()).toMatchObject({ runStartTemperature: null });
    expect(resetCoolingSession().triggeredIds.size).toBe(0);
  });
});
