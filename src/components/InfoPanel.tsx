import type { ModuleId, PhaseDiagramDefinition, PhaseState } from '../data';
import { describeMicrostructure } from '../lib/microstructure';
import { degreesOfFreedom } from '../lib/phaseRule';

function composition(value:number,max:number){ return `${max<=10?value.toFixed(3).replace(/0+$/,'').replace(/\.$/,''):value.toFixed(1)}%`; }

export function InfoPanel({diagram,state,module}:{diagram:PhaseDiagramDefinition;state:PhaseState;module:ModuleId}){
  const [left,right]=state.equilibrium.length===2?state.equilibrium:[];
  const precision=diagram.compositionAxis.max<=10?3:1;
  return <aside className="panel-stack right-rail">
    <section className="panel info-card"><div className="card-title">当前信息</div><dl className="info-grid">
      <dt>当前相图：</dt><dd>{diagram.title}</dd><dt>体系类型：</dt><dd>{diagram.systemType}</dd><dt>合金成分：</dt><dd>{composition(state.composition,diagram.compositionAxis.max)} {diagram.components.right}</dd><dt>当前温度：</dt><dd>{Math.round(state.temperature)}℃</dd><dt>当前相区：</dt><dd className="phase-name">{state.regionLabel}</dd><dt>自由度：</dt><dd>{degreesOfFreedom(state)?.text ?? '—'}</dd>
    </dl></section>
    <section className="panel balance-card"><div className="card-title">相平衡</div><div className="balance-content">
      {state.kind==='invariant'?<p className="invariant-note">三相平衡组成固定，但三相比例随反应进度变化，不存在唯一值。</p>:<>{state.equilibrium.map((item,index)=><div className="fraction-row" key={`${item.phase}-${index}`}><div><strong>{item.phase}</strong><span>平衡成分 {composition(item.composition,diagram.compositionAxis.max)}</span><b>{item.fraction.toFixed(1)}%</b></div><div className="fraction-track"><i style={{width:`${item.fraction}%`}}/></div></div>)}{module==='lever'&&left&&right&&<div className="lever-formula"><strong>杠杆定律代入</strong><code>W<sub>{left.phase}</sub> = (C<sub>{right.phase}</sub> − C₀)/(C<sub>{right.phase}</sub> − C<sub>{left.phase}</sub>)</code><span>= ({right.composition.toFixed(precision)} − {state.composition.toFixed(precision)})/({right.composition.toFixed(precision)} − {left.composition.toFixed(precision)}) = {left.fraction.toFixed(1)}%</span><code>W<sub>{right.phase}</sub> = (C₀ − C<sub>{left.phase}</sub>)/(C<sub>{right.phase}</sub> − C<sub>{left.phase}</sub>) = {right.fraction.toFixed(1)}%</code></div>}</>}
    </div></section>
    {module==='microstructure'&&(()=>{
      const micro=describeMicrostructure(diagram,state.composition,state.temperature);
      return <section className="panel micro-card"><div className="card-title">金相显微组织</div><div className="micro-content">
        {micro?<><span className="micro-label">当前组织类型</span><strong>{micro.name}</strong>
          <span className="micro-label">显微形态及特征解析</span><p>{micro.morphology}</p></>
        :<p className="micro-empty">当前点位于相界或图外，暂无对应的组织描述。请把状态点移入某个相区。</p>}
      </div></section>;
    })()}
    <section className={`panel reaction-card ${state.invariant?'active':''}`}><div className="card-title">反应信息</div><div className="reaction-content">{state.invariant?<><strong>{state.invariant.equation}</strong><span>{state.invariant.temperature}℃ · {state.invariant.type==='peritectic'?'包晶':state.invariant.type==='eutectic'?'共晶':'共析'}反应</span></>:<><strong>当前无三相反应</strong><span>冷却到水平反应线时自动显示反应式</span></>}</div></section>
    <section className="panel teaching-card"><div className="card-title">教学解析</div><p>{state.teaching}</p></section>
  </aside>;
}
