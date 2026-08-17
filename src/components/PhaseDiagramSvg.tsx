import { useMemo, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import type { ModuleId, PhaseDiagramDefinition, PhaseState, Point } from '../data';
import { buildRegionPolygon, sampleBoundary, temperatureAt } from '../lib/geometry';
import { legendPhases, phaseColor, regionColor } from '../lib/phaseColors';
import { isInvariantApplicable } from '../lib/phaseState';
import type { DisplayOptions } from './ControlPanel';

const VIEW_W = 920, VIEW_H = 690;
const M = { left: 92, right: 48, top: 58, bottom: 78 };
const W = VIEW_W - M.left - M.right, H = VIEW_H - M.top - M.bottom;

function path(points: Point[], x: (v: number) => number, y: (v: number) => number) { return points.map((p, i) => `${i ? 'L' : 'M'} ${x(p.x).toFixed(2)} ${y(p.y).toFixed(2)}`).join(' '); }
function poly(points: Point[], x: (v: number) => number, y: (v: number) => number) { return points.map((p) => `${x(p.x)},${y(p.y)}`).join(' '); }

interface Props {
  diagram: PhaseDiagramDefinition;
  state: PhaseState;
  module: ModuleId;
  display: DisplayOptions;
  activeInvariant: string | null;
  runStartTemperature: number | null;
  onChange: (composition: number, temperature: number) => void;
  onManual: () => void;
}

export function PhaseDiagramSvg({ diagram, state, module, display, activeInvariant, runStartTemperature, onChange, onManual }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const x = (value: number) => M.left + (value - diagram.compositionAxis.min) / (diagram.compositionAxis.max - diagram.compositionAxis.min) * W;
  const y = (value: number) => M.top + (diagram.temperatureAxis.max - value) / (diagram.temperatureAxis.max - diagram.temperatureAxis.min) * H;
  const fromScreen = (clientX: number, clientY: number) => {
    const node = svg.current; if (!node) return null;
    const point = node.createSVGPoint(); point.x = clientX; point.y = clientY;
    const matrix = node.getScreenCTM()?.inverse(); if (!matrix) return null;
    const local = point.matrixTransform(matrix);
    return {
      localY: local.y,
      composition: diagram.compositionAxis.min + (local.x - M.left) / W * (diagram.compositionAxis.max - diagram.compositionAxis.min),
      temperature: diagram.temperatureAxis.max - (local.y - M.top) / H * (diagram.temperatureAxis.max - diagram.temperatureAxis.min),
    };
  };
  const apply = (clientX: number, clientY: number) => {
    const value = fromScreen(clientX, clientY); if (!value) return;
    const composition = Math.min(diagram.compositionAxis.max, Math.max(diagram.compositionAxis.min, value.composition));
    let temperature = Math.min(diagram.temperatureAxis.max, Math.max(diagram.temperatureAxis.min, value.temperature));
    const node = svg.current;
    const matrix = node?.getScreenCTM();
    if (node && matrix) {
      const snap = diagram.invariants.find((reaction) => {
        if (!isInvariantApplicable(reaction, composition)) return false;
        const point = node.createSVGPoint(); point.x = M.left; point.y = y(reaction.temperature);
        return Math.abs(point.matrixTransform(matrix).y - clientY) <= 8;
      });
      if (snap) temperature = snap.temperature;
    }
    onManual();
    onChange(composition, temperature);
  };
  const pointerDown = (event: PointerEvent<SVGCircleElement>) => { event.currentTarget.setPointerCapture(event.pointerId); apply(event.clientX, event.clientY); };
  const keyDown = (event: KeyboardEvent<SVGCircleElement>) => {
    const cStep = (diagram.compositionAxis.max - diagram.compositionAxis.min) / 200;
    const tStep = (diagram.temperatureAxis.max - diagram.temperatureAxis.min) / 200;
    let composition = state.composition, temperature = state.temperature;
    if (event.key === 'ArrowLeft') composition -= cStep;
    else if (event.key === 'ArrowRight') composition += cStep;
    else if (event.key === 'ArrowUp') temperature += tStep;
    else if (event.key === 'ArrowDown') temperature -= tStep;
    else return;
    event.preventDefault(); onManual();
    onChange(
      Math.min(diagram.compositionAxis.max, Math.max(diagram.compositionAxis.min, composition)),
      Math.min(diagram.temperatureAxis.max, Math.max(diagram.temperatureAxis.min, temperature)),
    );
  };
  const tie = useMemo(() => state.equilibrium.length === 2 ? state.equilibrium.map((item) => item.composition) : [], [state.equilibrium]);
  const phases = useMemo(() => legendPhases([
    ...diagram.regions.flatMap((region) => region.phases),
    ...diagram.boundaries.flatMap((boundary) => boundary.phases),
  ]), [diagram]);
  const coolingStart = runStartTemperature ?? diagram.temperatureAxis.max;
  const coolingNodes = useMemo(() => {
    const nodes = [
      ...diagram.invariants.filter((reaction) => isInvariantApplicable(reaction, state.composition)).map((reaction) => ({ id: `i-${reaction.id}`, temperature: reaction.temperature, label: reaction.equation, invariant: true })),
      ...diagram.boundaries.map((boundary) => {
        const temperature = temperatureAt(boundary, state.composition);
        return temperature === null ? null : { id: `b-${boundary.id}`, temperature, label: boundary.label ?? boundary.id, invariant: false };
      }).filter((item): item is { id: string; temperature: number; label: string; invariant: boolean } => item !== null),
    ].sort((a, b) => b.temperature - a.temperature);
    return nodes.filter((node, index) => index === 0 || Math.abs(node.temperature - nodes[index - 1].temperature) > .3);
  }, [diagram, state.composition]);
  const passedNodes = coolingNodes.filter((node) => node.temperature <= coolingStart + .01 && node.temperature >= state.temperature - .01);

  return <svg ref={svg} className={`phase-svg diagram-${diagram.id}`} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" aria-label={`${diagram.title}交互图`}>
    <defs><filter id="pointGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <rect className="plot-bg" x={M.left} y={M.top} width={W} height={H}/>
    {diagram.regions.map((region) => <polygon className={`phase-region ${region.id === state.regionId ? 'current' : ''}`} key={region.id} points={poly(buildRegionPolygon(diagram, region), x, y)} fill={regionColor(region.phases)}/>) }
    {diagram.invariants.map((reaction) => <line key={reaction.id} className={`invariant-line ${(activeInvariant === reaction.id || module === 'invariant') ? 'active' : ''}`} x1={x(reaction.points.left)} x2={x(reaction.points.right)} y1={y(reaction.temperature)} y2={y(reaction.temperature)}/>) }
    {diagram.boundaries.map((boundary) => <path className={`phase-boundary ${boundary.dashed ? 'dashed' : ''} ${boundary.id === state.boundaryId ? 'active' : ''}`} key={boundary.id} d={path(sampleBoundary(boundary, 80), x, y)}/>) }

    {module === 'cooling' && <>
      <line className="cooling-track" x1={x(state.composition)} x2={x(state.composition)} y1={y(coolingStart)} y2={y(state.temperature)}/>
      {passedNodes.map((node, index) => {
        const rightSide = state.composition > (diagram.compositionAxis.min + diagram.compositionAxis.max) / 2;
        return <g className="cooling-node" key={node.id}><circle cx={x(state.composition)} cy={y(node.temperature)} r={node.invariant ? 6 : 4}/><text textAnchor={rightSide?'end':'start'} x={x(state.composition) + (rightSide?-9:9)} y={y(node.temperature) + (index % 2 ? 13 : -7)}>{node.temperature.toFixed(0)}℃{node.invariant?` · ${node.label}`:''}</text></g>;
      })}
    </>}

    {display.labels && diagram.regions.map((region) => {
      const anchorX = x(region.labelAnchor[0]), anchorY = y(region.labelAnchor[1]);
      const textX = anchorX + (region.labelOffset?.dx ?? 0), textY = anchorY + (region.labelOffset?.dy ?? 0);
      return <g key={region.id}>{region.labelOffset && <line className="region-leader" x1={anchorX} y1={anchorY} x2={textX} y2={textY}/>}<text className={`region-label ${region.id === state.regionId ? 'active' : ''}`} x={textX} y={textY}>{region.label}</text></g>;
    })}
    {display.labels && diagram.annotations?.map((annotation) => {
      const anchorX = x(annotation.anchor[0]), anchorY = y(annotation.anchor[1]);
      const textX = anchorX + (annotation.offset?.dx ?? 0), textY = anchorY + (annotation.offset?.dy ?? 0);
      return <g key={annotation.id}>{annotation.leader && <line className="annotation-leader" x1={anchorX} y1={anchorY} x2={textX} y2={textY}/>}<text className="diagram-annotation" x={textX} y={textY}>{annotation.text}</text></g>;
    })}
    {display.keyPoints && diagram.keyPoints.map((point) => <g className="key-point" key={`${point.label}-${point.composition}`}><circle cx={x(point.composition)} cy={y(point.temperature)} r="3"/>{((point.dx ?? 0) > 10 || Math.abs(point.dy ?? 0) > 20) ? <line className="key-leader" x1={x(point.composition)} y1={y(point.temperature)} x2={x(point.composition) + (point.dx ?? 5) - 3} y2={y(point.temperature) + (point.dy ?? -8) + 3}/> : null}<text x={x(point.composition) + (point.dx ?? 5)} y={y(point.temperature) + (point.dy ?? -8)}>{point.label}</text></g>)}
    {diagram.invariants.map((reaction) => module === 'invariant' || activeInvariant === reaction.id ? <g className="invariant-points" key={`${reaction.id}-points`}>{[reaction.points.left, reaction.points.middle, reaction.points.right].map((composition, index) => <circle key={composition} cx={x(composition)} cy={y(reaction.temperature)} r={index === 1 ? 6 : 4}/>)}</g> : null)}

    <g className="phase-legend">{phases.map((phase, index) => <g key={phase} transform={`translate(${M.left + index * 67} 27)`}><rect width="15" height="11" rx="2" fill={phaseColor(phase)}/><text x="20" y="10">{phase}</text></g>)}</g>
    <g className="axis"><line x1={M.left} y1={M.top} x2={M.left} y2={M.top + H}/><line x1={M.left} y1={M.top + H} x2={M.left + W} y2={M.top + H}/>
      {diagram.compositionAxis.ticks.map((tick) => <g key={`x${tick}`}><line x1={x(tick)} y1={M.top + H} x2={x(tick)} y2={M.top + H + 7}/><text x={x(tick)} y={M.top + H + 25}>{tick}</text></g>)}
      {diagram.temperatureAxis.ticks.map((tick) => <g key={`y${tick}`}><line x1={M.left - 7} y1={y(tick)} x2={M.left} y2={y(tick)}/><text className="y-tick" x={M.left - 12} y={y(tick) + 4}>{tick}</text></g>)}
      <text className="axis-title" x={M.left + W / 2} y={VIEW_H - 18}>{diagram.compositionAxis.label}</text><text className="axis-title y-title" transform={`translate(25 ${M.top + H / 2}) rotate(-90)`}>{diagram.temperatureAxis.label}</text><text className="component left" x={M.left} y={M.top + H + 50}>{diagram.components.left}</text><text className="component right" x={M.left + W} y={M.top + H + 50}>{diagram.components.right}</text>
    </g>
    <line className="composition-guide" x1={x(state.composition)} x2={x(state.composition)} y1={M.top} y2={M.top + H}/>
    {display.tieLine && tie.length === 2 && <><line className="tie-line" x1={x(tie[0])} x2={x(tie[1])} y1={y(state.temperature)} y2={y(state.temperature)}/>{module === 'lever' && <><line className="lever-arm left" x1={x(tie[0])} x2={x(state.composition)} y1={y(state.temperature)} y2={y(state.temperature)}/><line className="lever-arm right" x1={x(state.composition)} x2={x(tie[1])} y1={y(state.temperature)} y2={y(state.temperature)}/></>}{tie.map((composition, index) => <g className="equilibrium-point" key={`${composition}-${index}`}><circle cx={x(composition)} cy={y(state.temperature)} r="6"/><text x={x(composition)} y={y(state.temperature) - 12}>{composition.toFixed(diagram.compositionAxis.max <= 10 ? 3 : 1)}%</text></g>)}</>}
    <circle className="state-point-hit" tabIndex={0} role="slider" aria-label="当前相图温度与成分状态点" aria-valuemin={diagram.temperatureAxis.min} aria-valuemax={diagram.temperatureAxis.max} aria-valuenow={state.temperature} aria-valuetext={`${state.composition.toFixed(3)}%, ${state.temperature.toFixed(0)}℃`} cx={x(state.composition)} cy={y(state.temperature)} r="18" onPointerDown={pointerDown} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) apply(event.clientX, event.clientY); }} onKeyDown={keyDown}/><circle className="state-point" cx={x(state.composition)} cy={y(state.temperature)} r="7"/>
  </svg>;
}
