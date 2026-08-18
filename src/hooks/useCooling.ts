import { useCallback, useEffect, useRef, useState } from 'react';
import type { InvariantReaction, PhaseDiagramDefinition } from '../data/types';
import { findCrossedInvariant } from '../lib/phaseState';

export interface CoolingSession {
  triggeredIds: ReadonlySet<string>;
  runStartTemperature: number | null;
}

export function startNewCoolingSession(temperature: number): CoolingSession {
  return { triggeredIds: new Set(), runStartTemperature: temperature };
}

export function resetCoolingSession(): CoolingSession {
  return { triggeredIds: new Set(), runStartTemperature: null };
}

interface CoolingOptions {
  diagram: PhaseDiagramDefinition;
  composition: number;
  temperature: number;
  onTemperature: (temperature: number) => void;
  onInvariant: (reaction: InvariantReaction | null) => void;
}

export function useCooling({ diagram, composition, temperature, onTemperature, onInvariant }: CoolingOptions) {
  const [isCooling, setIsCooling] = useState(false);
  const [runStartTemperature, setRunStartTemperature] = useState<number | null>(null);
  const frame = useRef<number | null>(null);
  const timer = useRef<number | null>(null);
  const previousTime = useRef<number | null>(null);
  const temperatureRef = useRef(temperature);
  const compositionRef = useRef(composition);
  const sessionRef = useRef<CoolingSession>(resetCoolingSession());

  useEffect(() => { temperatureRef.current = temperature; }, [temperature]);
  useEffect(() => { compositionRef.current = composition; }, [composition]);

  const cancelSchedules = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (timer.current !== null) window.clearTimeout(timer.current);
    frame.current = null;
    timer.current = null;
    previousTime.current = null;
  }, []);

  const stop = useCallback(() => {
    cancelSchedules();
    sessionRef.current = { ...sessionRef.current, runStartTemperature: null };
    setRunStartTemperature(null);
    setIsCooling(false);
    onInvariant(null);
  }, [cancelSchedules, onInvariant]);

  const reset = useCallback(() => {
    cancelSchedules();
    sessionRef.current = resetCoolingSession();
    setRunStartTemperature(null);
    setIsCooling(false);
    onInvariant(null);
  }, [cancelSchedules, onInvariant]);

  const tick = useCallback((timestamp: number) => {
    const last = previousTime.current ?? timestamp;
    previousTime.current = timestamp;
    const span = diagram.temperatureAxis.max - diagram.temperatureAxis.min;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const speed = span / (reduced ? 8 : 18);
    const current = temperatureRef.current;
    let next = current - speed * Math.min(0.05, (timestamp - last) / 1000);
    const crossed = findCrossedInvariant(
      diagram,
      compositionRef.current,
      current,
      next,
      sessionRef.current.triggeredIds,
    );

    if (crossed) {
      next = crossed.temperature;
      temperatureRef.current = next;
      onTemperature(next);
      onInvariant(crossed);
      sessionRef.current = {
        ...sessionRef.current,
        triggeredIds: new Set([...sessionRef.current.triggeredIds, crossed.id]),
      };
      previousTime.current = null;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        onInvariant(null);
        frame.current = requestAnimationFrame(tick);
      }, 2500);
      return;
    }

    if (next <= diagram.temperatureAxis.min) {
      next = diagram.temperatureAxis.min;
      temperatureRef.current = next;
      onTemperature(next);
      setIsCooling(false);
      onInvariant(null);
      cancelSchedules();
      return;
    }
    temperatureRef.current = next;
    onTemperature(next);
    frame.current = requestAnimationFrame(tick);
  }, [cancelSchedules, diagram, onInvariant, onTemperature]);

  const startNewRun = useCallback(() => {
    cancelSchedules();
    let initial = temperatureRef.current;
    if (initial <= diagram.temperatureAxis.min + .01) {
      initial = diagram.temperatureAxis.max;
      temperatureRef.current = initial;
      onTemperature(initial);
    }
    sessionRef.current = startNewCoolingSession(initial);
    setRunStartTemperature(initial);
    setIsCooling(true);
    onInvariant(null);
    frame.current = requestAnimationFrame(tick);
  }, [cancelSchedules, diagram.temperatureAxis.max, diagram.temperatureAxis.min, onInvariant, onTemperature, tick]);

  useEffect(() => () => cancelSchedules(), [cancelSchedules]);
  useEffect(() => { reset(); }, [diagram.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isCooling, runStartTemperature, startNewRun, stop, reset };
}
