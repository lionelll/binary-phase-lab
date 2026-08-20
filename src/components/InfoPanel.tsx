import type { ModuleId, PhaseDiagramDefinition, PhaseState } from '../data';
import { describeMicrostructure, describeMicrostructureFractions } from '../lib/microstructure';
import { PhaseNotation } from './PhaseNotation';

function composition(value:number,max:number){ return `${max<=10?value.toFixed(3).replace(/0+$/,'').replace(/\.$/,''):value.toFixed(1)}%`; }

export function InfoPanel({diagram,state,module}:{diagram:PhaseDiagramDefinition;state:PhaseState;module:ModuleId}){
  const [left,right]=state.equilibrium.length===2?state.equilibrium:[];
  const precision=diagram.compositionAxis.max<=10?3:1;
  const microstructure=describeMicrostructure(diagram,state.composition,state.temperature);
  const microstructureFractions=describeMicrostructureFractions(diagram,state.composition,state.temperature);
  return <aside className="panel-stack right-rail">
    <section className="panel info-card"><div className="card-title">当前信息</div><dl className="info-grid">
      <dt>当前相图：</dt><dd><PhaseNotation text={diagram.title}/></dd><dt>体系类型：</dt><dd>{diagram.systemType}</dd><dt>合金成分：</dt><dd>{composition(state.composition,diagram.compositionAxis.max)} <PhaseNotation text={diagram.components.right}/></dd><dt>当前温度：</dt><dd>{Math.round(state.temperature)}℃</dd><dt>当前相区：</dt><dd className="phase-name"><PhaseNotation text={state.regionLabel}/></dd>
    </dl></section>
    <section className="panel balance-card"><div className="card-title">相平衡</div><div className="balance-content">
      {state.kind==='invariant'?<p className="invariant-note">三相平衡组成固定，但三相比例随反应进度变化，不存在唯一值。</p>:<>{state.equilibrium.map((item,index)=><div className="fraction-row" key={`${item.phase}-${index}`}><div><strong><PhaseNotation text={item.phase}/></strong><span>平衡成分 {composition(item.composition,diagram.compositionAxis.max)}</span><b>{item.fraction.toFixed(1)}%</b></div><div className="fraction-track"><i style={{width:`${item.fraction}%`}}/></div></div>)}{module==='lever'&&left&&right&&<div className="lever-formula"><strong>杠杆定律代入</strong><code>W<sub>{left.phase}</sub> = (C<sub>{right.phase}</sub> − C₀)/(C<sub>{right.phase}</sub> − C<sub>{left.phase}</sub>)</code><span>= ({right.composition.toFixed(precision)} − {state.composition.toFixed(precision)})/({right.composition.toFixed(precision)} − {left.composition.toFixed(precision)}) = {left.fraction.toFixed(1)}%</span><code>W<sub>{right.phase}</sub> = (C₀ − C<sub>{left.phase}</sub>)/(C<sub>{right.phase}</sub> − C<sub>{left.phase}</sub>) = {right.fraction.toFixed(1)}%</code></div>}</>}
    </div></section>
    <section className="panel microstructure-card"><div className="card-title">显微组织及相对含量</div><div className="microstructure-content">
      {microstructure ? <>
        <div className="microstructure-summary">
          <span>冷却阶段</span><em><PhaseNotation text={microstructure.stage}/></em>
          <span>当前显微组织</span><strong><PhaseNotation text={microstructure.name}/></strong>
        </div>
        <div className="microstructure-fractions">
          <span className="microstructure-section-label">组织相对含量</span>
          {microstructureFractions.items.length > 0 ? microstructureFractions.items.map((item,index)=><div className="microstructure-fraction-row" key={`${item.name}-${index}`}>
            <div><strong><PhaseNotation text={item.name}/></strong><b>{item.fraction.toFixed(1)}%</b></div>
            <div className="fraction-track"><i style={{width:`${item.fraction}%`}}/></div>
          </div>) : <p className="invariant-note"><PhaseNotation text={microstructureFractions.note}/></p>}
          {microstructureFractions.items.length > 0 && <small><PhaseNotation text={microstructureFractions.note}/></small>}
        </div>
        <div className="microstructure-formation"><span className="microstructure-section-label">组织形成过程</span><p><PhaseNotation text={microstructure.formation}/></p></div>
      </> : <p className="microstructure-empty">该相图暂未提供显微组织判定。</p>}
    </div></section>
    {state.invariant && <section className="panel reaction-card active"><div className="card-title">反应信息</div><div className="reaction-content"><strong><PhaseNotation text={state.invariant.equation}/></strong><span>{state.invariant.temperature}℃ · {state.invariant.type==='peritectic'?'包晶':state.invariant.type==='eutectic'?'共晶':'共析'}反应</span></div></section>}
  </aside>;
}
