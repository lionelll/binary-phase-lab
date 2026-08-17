import { useCallback, useMemo, useState } from 'react';
import brandLogo from './assets/brand-logo.png';
import { ControlPanel, type DisplayOptions } from './components/ControlPanel';
import { Icon } from './components/Icons';
import { InfoPanel } from './components/InfoPanel';
import { PhaseDiagramSvg } from './components/PhaseDiagramSvg';
import { resolveDiagram, type DiagramId, type InvariantReaction, type ModuleId } from './data';
import { useCooling } from './hooks/useCooling';
import { evaluatePhaseState } from './lib/phaseState';

const portalUrl=import.meta.env.VITE_PORTAL_URL||'http://123.57.11.145:8080/';

export default function App(){
  const [diagramId,setDiagramId]=useState<DiagramId>('cu-ni');
  const diagram=resolveDiagram(diagramId);
  const [module,setModule]=useState<ModuleId>('structure');
  const [composition,setComposition]=useState(diagram.defaultState.composition);
  const [temperature,setTemperature]=useState(diagram.defaultState.temperature);
  const [display,setDisplay]=useState<DisplayOptions>({labels:true,keyPoints:true,tieLine:true});
  const [coolingInvariant,setCoolingInvariant]=useState<InvariantReaction|null>(null);
  const state=useMemo(()=>evaluatePhaseState(diagram,composition,temperature),[diagram,composition,temperature]);
  const updateTemperature=useCallback((value:number)=>setTemperature(Math.min(diagram.temperatureAxis.max,Math.max(diagram.temperatureAxis.min,value))),[diagram]);
  const cooling=useCooling({diagram,composition,temperature,onTemperature:updateTemperature,onInvariant:setCoolingInvariant});
  const manual=useCallback(()=>{cooling.stop();setCoolingInvariant(null)},[cooling]);
  const changeDiagram=(id:DiagramId)=>{cooling.reset();const next=resolveDiagram(id);setDiagramId(id);setComposition(next.defaultState.composition);setTemperature(next.defaultState.temperature);setModule('structure');setCoolingInvariant(null)};
  const reset=()=>{cooling.reset();setComposition(diagram.defaultState.composition);setTemperature(diagram.defaultState.temperature);setModule('structure');setDisplay({labels:true,keyPoints:true,tieLine:true});setCoolingInvariant(null)};
  const startCooling=()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();setModule('cooling');cooling.startNewRun()};
  const displayedState=coolingInvariant?{...state,kind:'invariant' as const,invariant:coolingInvariant,regionLabel:'三相平衡',phases:coolingInvariant.phaseCompositions.map(item=>item.phase),teaching:`${coolingInvariant.teaching} 三相共存时比例随反应进度变化，不存在唯一比例。`,equilibrium:coolingInvariant.phaseCompositions.map(item=>({...item,fraction:0}))}:state;
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><img src={brandLogo} alt=""/></div><div><h1>材科基 · 二元相图动态交互实验室</h1><span>畅研材料考研交流群：692990403</span></div></div><div className="top-actions"><a href={portalUrl}><Icon name="home"/><span>返回首页</span></a><button type="button" onClick={reset}><Icon name="reset"/><span>重置实验</span></button><button type="button" className={cooling.isCooling?'active':''} onClick={startCooling}><Icon name="play"/><span>自动凝固</span></button></div></header>
    <main className="workspace">
      <ControlPanel diagram={diagram} module={module} composition={composition} temperature={temperature} display={display} onDiagram={changeDiagram} onModule={setModule} onComposition={value=>setComposition(Math.min(diagram.compositionAxis.max,Math.max(diagram.compositionAxis.min,value)))} onTemperature={updateTemperature} onDisplay={setDisplay} onManualChange={manual}/>
      <section className="stage-column"><div className="stage-panel"><div className="stage-heading"><img src={brandLogo} alt=""/><div><strong>{diagram.title}</strong></div></div><div className="svg-host"><PhaseDiagramSvg diagram={diagram} state={displayedState} module={module} display={display} activeInvariant={coolingInvariant?.id??null} runStartTemperature={cooling.runStartTemperature} onManual={manual} onChange={(c,t)=>{setComposition(c);setTemperature(t)}}/></div><div className="stage-status"><span className={`status-dot ${cooling.isCooling?'running':''}`}/><strong>{cooling.isCooling?'正在自动凝固':cooling.isPaused?'凝固过程已暂停':'拖动红色状态点开始探索'}</strong><span>{composition.toFixed(diagram.compositionAxis.max<=10?3:1)}% · {Math.round(temperature)}℃ · {state.regionLabel}</span></div></div></section>
      <InfoPanel diagram={diagram} state={displayedState} module={module}/>
    </main>
  </div>
}
