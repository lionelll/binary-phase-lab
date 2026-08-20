import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChartSpline } from 'lucide-react';
import { diagrams, type DiagramId, type ModuleId, type PhaseDiagramDefinition } from '../data';
import { formatNumericValue, parseCommittedNumber } from '../lib/numericInput';
import { numberedPresets } from '../lib/presets';
import { Icon, type IconName } from './Icons';

export interface DisplayOptions { labels: boolean; constituents: boolean; keyPoints: boolean; tieLine: boolean }

interface Props {
  diagram: PhaseDiagramDefinition;
  module: ModuleId;
  composition: number;
  temperature: number;
  display: DisplayOptions;
  onDiagram: (id: DiagramId) => void;
  onModule: (id: ModuleId) => void;
  onComposition: (value: number) => void;
  onTemperature: (value: number) => void;
  onDisplay: (display: DisplayOptions) => void;
  onPreset: (composition: number, temperature: number) => void;
  onManualChange: () => void;
}

const modules: Array<{ id: ModuleId; label: string; icon: IconName }> = [
  { id: 'lever', label: '杠杆定律', icon: 'lever' },
  { id: 'invariant', label: '三相反应', icon: 'reaction' },
];

function number(value: number, max: number) { return formatNumericValue(value, max); }

/** 与晶体结构、三元相图一致：单列布局下左栏面板默认折叠，避免把主视图挤到第二屏。 */
const isMobileViewport = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches;

function CollapsiblePanel({ id, title, className, children }: {
  id: string; title: string; className?: string;
  /** 传函数可拿到"手机端选完即收起"的回调，与晶体结构、三元相图的交互一致。 */
  children: ReactNode | ((collapseOnMobile: () => void) => ReactNode);
}) {
  const [mobile, setMobile] = useState(isMobileViewport);
  const [collapsed, setCollapsed] = useState(true);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 820px)');
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  // 桌面端由 CSS 强制展开，这里同步推导，保证 aria-expanded 不会残留手机端的折叠状态。
  const expanded = !mobile || !collapsed;
  const toggle = useCallback(() => { if (isMobileViewport()) setCollapsed((current) => !current); }, []);
  const collapseOnMobile = useCallback(() => { if (isMobileViewport()) setCollapsed(true); }, []);
  return <section className={`panel mobile-collapsible ${expanded ? 'is-expanded' : 'is-collapsed'} ${className ?? ''}`}>
    <button type="button" className="panel-heading panel-heading-button" aria-expanded={expanded} aria-controls={id} onClick={toggle}>
      <span>{title}</span><Icon name="chevron" className="collapse-chevron"/>
    </button>
    <div className="collapsible-content" id={id}>{typeof children === 'function' ? children(collapseOnMobile) : children}</div>
  </section>;
}

function NumericField({ label, value, min, max, step, formatMax, onCommit }: {
  label: string; value: number; min: number; max: number; step: number; formatMax: number; onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(() => formatNumericValue(value, formatMax));
  const [focused, setFocused] = useState(false);
  const cancelBlurCommit = useRef(false);
  useEffect(() => { if (!focused) setDraft(formatNumericValue(value, formatMax)); }, [focused, formatMax, value]);
  const commit = () => {
    const parsed = parseCommittedNumber(draft, min, max);
    if (parsed === null) setDraft(formatNumericValue(value, formatMax));
    else { setDraft(formatNumericValue(parsed, formatMax)); onCommit(parsed); }
  };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur();
    if (event.key === 'Escape') { cancelBlurCommit.current = true; setDraft(formatNumericValue(value, formatMax)); event.currentTarget.blur(); }
  };
  return <input aria-label={label} inputMode="decimal" type="text" value={draft} onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); if (cancelBlurCommit.current) cancelBlurCommit.current = false; else commit(); }} onKeyDown={keyDown} onChange={(event) => setDraft(event.target.value)} data-min={min} data-max={max} data-step={step}/>;
}

export function ControlPanel(props: Props) {
  const { diagram } = props;
  return <aside className="panel-stack left-rail">
    <CollapsiblePanel id="panel-diagram-type" title="相图类型" className="selection-panel">{(collapseOnMobile) => <>
      <div className="diagram-list">
        {diagrams.map((item) => (
          <button className={`diagram-card ${item.id === diagram.id ? 'active' : ''}`} type="button" key={item.id} onClick={() => { props.onDiagram(item.id); collapseOnMobile(); }}>
            <ChartSpline aria-hidden="true"/>
            <strong>{item.shortTitle}</strong>
          </button>
        ))}
      </div>
    </>}</CollapsiblePanel>
    {diagram.presets && <CollapsiblePanel id="panel-presets" title="典型合金预设" className="preset-panel">{(collapseOnMobile) =>
      <div className="preset-block"><div className="preset-list">{numberedPresets(diagram.presets).map((preset) => (
        <button type="button" className="preset-chip" key={preset.id}
          onClick={() => { props.onPreset(preset.composition, preset.temperature); collapseOnMobile(); }}>
          <span className="preset-mark">{preset.mark}</span>{preset.label}
        </button>
      ))}</div></div>
    }</CollapsiblePanel>}
    <CollapsiblePanel id="panel-modules" title="功能模块" className="module-panel">{(collapseOnMobile) => <>
      <div className="module-list">{modules.map((item) => <button type="button" className={`module-row ${props.module === item.id ? 'active' : ''}`} key={item.id} onClick={() => { props.onModule(item.id); collapseOnMobile(); }}><Icon name={item.icon}/><span>{item.label}</span></button>)}</div>
      <section className="module-control-section" aria-labelledby="alloy-control-title">
        <h3 className="module-subheading" id="alloy-control-title">合金成分与温度控制</h3>
        <div className="control-stack">
          <label className="control-block"><span>合金成分 <b>{number(props.composition, diagram.compositionAxis.max)}%</b></span><div className="input-pair"><input aria-label="合金成分滑块" type="range" min={diagram.compositionAxis.min} max={diagram.compositionAxis.max} step={diagram.compositionAxis.max <= 10 ? .001 : .1} value={props.composition} onChange={(event) => {props.onManualChange();props.onComposition(Number(event.target.value));}}/><NumericField label="合金成分数值" value={props.composition} min={diagram.compositionAxis.min} max={diagram.compositionAxis.max} step={diagram.compositionAxis.max <= 10 ? .001 : .1} formatMax={diagram.compositionAxis.max} onCommit={(value) => { props.onManualChange(); props.onComposition(value); }}/></div><small>{diagram.components.left} ← {diagram.compositionAxis.label} → {diagram.components.right}</small></label>
          <label className="control-block"><span>当前温度 <b>{Math.round(props.temperature)}℃</b></span><div className="input-pair"><input aria-label="温度滑块" type="range" min={diagram.temperatureAxis.min} max={diagram.temperatureAxis.max} step="1" value={props.temperature} onChange={(event) => {props.onManualChange();props.onTemperature(Number(event.target.value));}}/><NumericField label="温度数值" value={props.temperature} min={diagram.temperatureAxis.min} max={diagram.temperatureAxis.max} step={1} formatMax={10000} onCommit={(value) => { props.onManualChange(); props.onTemperature(value); }}/></div></label>
        </div>
      </section>
    </>}</CollapsiblePanel>
    <CollapsiblePanel id="panel-display" title="辅助显示" className="display-panel"><div className="switch-list">
      {(([['labels','相区标签'],...(diagram.constituents ? [['constituents','组织标注'] as const] : []),['keyPoints','关键点标注'],['tieLine','等温线与交点']]) as ReadonlyArray<readonly [keyof DisplayOptions, string]>).map(([key,label])=><label className="toggle-row" key={key}><input type="checkbox" checked={props.display[key]} onChange={(event)=>{
        const checked = event.target.checked;
        // 相标注与组织标注是同一张图的两种视角，互斥显示。
        if (key === 'labels') props.onDisplay({ ...props.display, labels: checked, constituents: checked ? false : props.display.constituents });
        else if (key === 'constituents') props.onDisplay({ ...props.display, constituents: checked, labels: checked ? false : props.display.labels });
        else props.onDisplay({ ...props.display, [key]: checked });
      }}/><span className="fake-check"/><span>{label}</span></label>)}
    </div></CollapsiblePanel>
  </aside>;
}
