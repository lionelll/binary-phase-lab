import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { diagrams, type DiagramId, type ModuleId, type PhaseDiagramDefinition } from '../data';
import { formatNumericValue, parseCommittedNumber } from '../lib/numericInput';
import { Icon, type IconName } from './Icons';

export interface DisplayOptions { labels: boolean; keyPoints: boolean; tieLine: boolean }

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
  onManualChange: () => void;
}

const modules: Array<{ id: ModuleId; label: string; icon: IconName }> = [
  { id: 'structure', label: '相图结构', icon: 'diagram' },
  { id: 'cooling', label: '冷却过程', icon: 'cooling' },
  { id: 'lever', label: '杠杆定律', icon: 'lever' },
  { id: 'invariant', label: '三相反应', icon: 'reaction' },
];

function number(value: number, max: number) { return formatNumericValue(value, max); }

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
    <section className="panel selection-panel">
      <div className="panel-heading"><span><Icon name="diagram"/>相图类型</span></div>
      <div className="diagram-list">
        {diagrams.map((item) => <button className={`diagram-card ${item.id === diagram.id ? 'active' : ''}`} type="button" key={item.id} onClick={() => props.onDiagram(item.id)}>
          <span className="diagram-symbol">{item.components.left}<i/> {item.components.right}</span><span><strong>{item.shortTitle}</strong><small>{item.systemType}</small></span><Icon name="chevron"/>
        </button>)}
      </div>
    </section>
    <section className="panel module-panel">
      <div className="panel-heading"><span><Icon name="settings"/>功能模块</span></div>
      <div className="module-list">{modules.map((item) => <button type="button" className={`module-row ${props.module === item.id ? 'active' : ''}`} key={item.id} onClick={() => props.onModule(item.id)}><Icon name={item.icon}/><span>{item.label}</span></button>)}</div>
    </section>
    <section className="panel parameter-panel">
      <div className="panel-heading"><span><Icon name="settings"/>实验参数</span></div>
      <div className="control-stack">
        <label className="control-block"><span>合金成分 <b>{number(props.composition, diagram.compositionAxis.max)}%</b></span><div className="input-pair"><input aria-label="合金成分滑块" type="range" min={diagram.compositionAxis.min} max={diagram.compositionAxis.max} step={diagram.compositionAxis.max <= 10 ? .001 : .1} value={props.composition} onChange={(event) => {props.onManualChange();props.onComposition(Number(event.target.value));}}/><NumericField label="合金成分数值" value={props.composition} min={diagram.compositionAxis.min} max={diagram.compositionAxis.max} step={diagram.compositionAxis.max <= 10 ? .001 : .1} formatMax={diagram.compositionAxis.max} onCommit={(value) => { props.onManualChange(); props.onComposition(value); }}/></div><small>{diagram.components.left} ← {diagram.compositionAxis.label} → {diagram.components.right}</small></label>
        <label className="control-block"><span>当前温度 <b>{Math.round(props.temperature)}℃</b></span><div className="input-pair"><input aria-label="温度滑块" type="range" min={diagram.temperatureAxis.min} max={diagram.temperatureAxis.max} step="1" value={props.temperature} onChange={(event) => {props.onManualChange();props.onTemperature(Number(event.target.value));}}/><NumericField label="温度数值" value={props.temperature} min={diagram.temperatureAxis.min} max={diagram.temperatureAxis.max} step={1} formatMax={10000} onCommit={(value) => { props.onManualChange(); props.onTemperature(value); }}/></div></label>
      </div>
    </section>
    <section className="panel display-panel"><div className="panel-heading"><span><Icon name="info"/>辅助显示</span></div><div className="switch-list">
      {([['labels','相区标签'],['keyPoints','关键点标注'],['tieLine','等温线与交点']] as const).map(([key,label])=><label className="toggle-row" key={key}><input type="checkbox" checked={props.display[key]} onChange={(event)=>props.onDisplay({...props.display,[key]:event.target.checked})}/><span className="fake-check"/><span>{label}</span></label>)}
    </div></section>
  </aside>;
}
