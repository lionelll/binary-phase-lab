import type { PhaseDiagramDefinition } from './types';

export const pbSn: PhaseDiagramDefinition = {
  id:'pb-sn', title:'Pb–Sn 共晶相图', shortTitle:'Pb–Sn 共晶', systemType:'经典共晶反应体系', components:{left:'Pb',right:'Sn'},
  compositionAxis:{min:0,max:100,ticks:[0,20,40,60,80,100],label:'wSn / %'}, temperatureAxis:{min:0,max:350,ticks:[0,100,183,250,350],label:'温度 / ℃'},
  boundaries:[
    {id:'liquidus-left',kind:'liquidus',phases:['L','L+α'],points:[[0,327],[15,285],[35,240],[50,205],[61.9,183]]},
    {id:'liquidus-right',kind:'liquidus',phases:['L','L+β'],points:[[61.9,183],[78,202],[90,218],[100,232]]},
    {id:'alpha-solidus',kind:'solidus',phases:['α','L+α'],points:[[0,327],[5,280],[11,235],[19,183]]},
    {id:'alpha-solvus',kind:'solvus',phases:['α','α+β'],points:[[2,0],[4,70],[8,125],[19,183]]},
    {id:'beta-solidus',kind:'solidus',phases:['L+β','β'],points:[[97.5,183],[98.4,205],[99.2,220],[100,232]]},
    {id:'beta-solvus',kind:'solvus',phases:['α+β','β'],points:[[97.5,183],[98.2,120],[98.7,70],[99,0]]},
  ],
  regions:[
    {id:'liquid',label:'L',phases:['L'],labelAnchor:[55,285],teaching:'合金完全为液态；冷却到液相线后将析出初生 α 或初生 β。',outline:[{type:'boundary',boundaryId:'liquidus-left'},{type:'boundary',boundaryId:'liquidus-right'},{type:'line',points:[[100,350],[0,350]]}]},
    {id:'alpha',label:'α',phases:['α'],labelAnchor:[7,150],teaching:'Pb 端 α 固溶体单相区。',outline:[{type:'boundary',boundaryId:'alpha-solidus'},{type:'boundary',boundaryId:'alpha-solvus',reverse:true},{type:'line',points:[[0,0],[0,327]]}]},
    {id:'liquid-alpha',label:'L + α',phases:['L','α'],labelAnchor:[28,235],teaching:'液相与富 Pb 的 α 相平衡共存。',tieLine:{left:{phase:'α',boundaryId:'alpha-solidus'},right:{phase:'L',boundaryId:'liquidus-left'}},outline:[{type:'boundary',boundaryId:'liquidus-left'},{type:'line',points:[[61.9,183],[19,183]]},{type:'boundary',boundaryId:'alpha-solidus',reverse:true}]},
    {id:'liquid-beta',label:'L + β',phases:['L','β'],labelAnchor:[94,205],teaching:'液相与富 Sn 的 β 相平衡共存。',tieLine:{left:{phase:'L',boundaryId:'liquidus-right'},right:{phase:'β',boundaryId:'beta-solidus'}},outline:[{type:'boundary',boundaryId:'liquidus-right'},{type:'boundary',boundaryId:'beta-solidus',reverse:true},{type:'line',points:[[97.5,183],[61.9,183]]}]},
    {id:'beta',label:'β',phases:['β'],labelAnchor:[99,145],teaching:'Sn 端 β 固溶体单相区。',outline:[{type:'boundary',boundaryId:'beta-solidus'},{type:'line',points:[[100,0],[99,0]]},{type:'boundary',boundaryId:'beta-solvus',reverse:true}]},
    {id:'alpha-beta',label:'α + β',phases:['α','β'],labelAnchor:[58,80],teaching:'共晶温度以下 α 与 β 两相共存，比例由两端溶解度和总体成分决定。',tieLine:{left:{phase:'α',boundaryId:'alpha-solvus'},right:{phase:'β',boundaryId:'beta-solvus'}},outline:[{type:'boundary',boundaryId:'alpha-solvus'},{type:'line',points:[[19,183],[97.5,183]]},{type:'boundary',boundaryId:'beta-solvus'},{type:'line',points:[[99,0],[2,0]]}]},
  ],
  invariants:[{id:'eutectic',type:'eutectic',temperature:183,equation:'L → α + β',points:{left:19,middle:61.9,right:97.5},phaseCompositions:[{phase:'α',composition:19},{phase:'L',composition:61.9},{phase:'β',composition:97.5}],teaching:'在 183℃，61.9% Sn 的液相同时转变为 19% Sn 的 α 相和 97.5% Sn 的 β 相。'}],
  keyPoints:[{label:'C 19%',composition:19,temperature:183,dy:-10},{label:'E 61.9%',composition:61.9,temperature:183,dy:22},{label:'D 97.5%',composition:97.5,temperature:183,dx:-46,dy:-8}],
  defaultState:{composition:40,temperature:230}, teaching:{overview:'Pb–Sn 是典型共晶体系，液相在共晶温度同时生成两种固相。'},
};
