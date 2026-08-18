import type { PhaseDiagramDefinition } from './types';

export const ptAg: PhaseDiagramDefinition = {
  id: 'pt-ag', title: 'Pt–Ag 包晶相图', shortTitle: 'Pt–Ag 包晶', systemType: '包晶反应体系',
  components: { left: 'Pt', right: 'Ag' },
  compositionAxis: { min: 0, max: 100, ticks: [0, 20, 40, 60, 80, 100], label: 'wAg / %' },
  temperatureAxis: { min: 400, max: 1800, ticks: [400, 800, 1200, 1600, 1800], label: '温度 / ℃' },
  boundaries: [
    { id: 'liquidus-left', kind: 'liquidus', phases: ['L', 'L+α'], points: [[0,1769],[15,1660],[35,1575],[50,1480],[60,1340],[66.3,1186]] },
    { id: 'liquidus-right', kind: 'liquidus', phases: ['L', 'L+β'], points: [[66.3,1186],[78,1110],[90,1030],[100,962]] },
    { id: 'alpha-solidus', kind: 'solidus', phases: ['α','L+α'], points: [[0,1769],[3,1550],[6,1350],[10.5,1186]] },
    { id: 'alpha-solvus', kind: 'solvus', phases: ['α','α+β'], points: [[1,400],[2,700],[4.5,1000],[10.5,1186]] },
    { id: 'beta-solidus', kind: 'solidus', phases: ['β','L+β'], points: [[42.4,1186],[58,1090],[76,1000],[90,965],[100,962]] },
    { id: 'beta-solvus', kind: 'solvus', phases: ['α+β','β'], points: [[42.4,1186],[58,1040],[72,820],[84,560],[90,400]] },
  ],
  regions: [
    { id:'liquid', label:'L', phases:['L'], labelAnchor:[72,1510], teaching:'当前为均匀液相。冷却穿过液相线后开始析出初生固相。', outline:[{type:'boundary',boundaryId:'liquidus-left'},{type:'boundary',boundaryId:'liquidus-right'},{type:'line',points:[[100,1800],[0,1800]]}] },
    { id:'alpha', label:'α', phases:['α'], labelAnchor:[2,1050], teaching:'Pt 端 α 固溶体单相区。', outline:[{type:'boundary',boundaryId:'alpha-solidus'},{type:'boundary',boundaryId:'alpha-solvus',reverse:true},{type:'line',points:[[0,400],[0,1769]]}] },
    { id:'liquid-alpha', label:'L + α', phases:['L','α'], labelAnchor:[30,1450], teaching:'液相与 α 固相平衡共存；到达 1186℃ 后可发生包晶反应。', tieLine:{left:{phase:'α',boundaryId:'alpha-solidus'},right:{phase:'L',boundaryId:'liquidus-left'}}, outline:[{type:'boundary',boundaryId:'liquidus-left'},{type:'line',points:[[66.3,1186],[10.5,1186]]},{type:'boundary',boundaryId:'alpha-solidus',reverse:true}] },
    { id:'liquid-beta', label:'L + β', phases:['L','β'], labelAnchor:[66.8,1095], teaching:'液相与 β 固相平衡共存。', tieLine:{left:{phase:'β',boundaryId:'beta-solidus'},right:{phase:'L',boundaryId:'liquidus-right'}}, outline:[{type:'boundary',boundaryId:'liquidus-right'},{type:'boundary',boundaryId:'beta-solidus',reverse:true},{type:'line',points:[[42.4,1186],[66.3,1186]]}] },
    { id:'beta', label:'β', phases:['β'], labelAnchor:[88,720], teaching:'Ag 端 β 固溶体单相区。', outline:[{type:'boundary',boundaryId:'beta-solidus'},{type:'line',points:[[100,400],[90,400]]},{type:'boundary',boundaryId:'beta-solvus',reverse:true}] },
    { id:'alpha-beta', label:'α + β', phases:['α','β'], labelAnchor:[42,700], teaching:'α 与 β 两种固溶体平衡共存，可用溶解度线交点进行杠杆计算。', tieLine:{left:{phase:'α',boundaryId:'alpha-solvus'},right:{phase:'β',boundaryId:'beta-solvus'}}, outline:[{type:'boundary',boundaryId:'alpha-solvus'},{type:'line',points:[[10.5,1186],[42.4,1186]]},{type:'boundary',boundaryId:'beta-solvus'},{type:'line',points:[[90,400],[1,400]]}] },
  ],
  invariants:[{ id:'peritectic', type:'peritectic', temperature:1186, equation:'L + α → β', points:{left:10.5,middle:42.4,right:66.3}, phaseCompositions:[{phase:'α',composition:10.5},{phase:'β',composition:42.4},{phase:'L',composition:66.3}], teaching:'在 1186℃ 冷却时，成分为 66.3% Ag 的液相与 10.5% Ag 的 α 相反应，生成 42.4% Ag 的 β 相。'}],
  keyPoints:[{label:'D 10.5%',composition:10.5,temperature:1186,dy:-10},{label:'P 42.4%',composition:42.4,temperature:1186,dx:3,dy:34},{label:'C 66.3%',composition:66.3,temperature:1186,dy:-10}],
  presets:[
    {id:'p-alpha',label:'单相 α 合金（2% Ag）',composition:2,temperature:1000},
    {id:'p-peritectic-left',label:'包晶反应合金（30% Ag）',composition:30,temperature:1250},
    {id:'p-peritectic',label:'包晶点合金（42.4% Ag）',composition:42.4,temperature:1250},
    {id:'p-hyper',label:'过包晶合金（60% Ag）',composition:60,temperature:1250},
    {id:'p-beta',label:'富银合金（85% Ag）',composition:85,temperature:1000},
  ],
  defaultState:{composition:52,temperature:1300},
  teaching:{overview:'包晶反应的核心是液相与一种固相共同反应生成另一种固相，反应方向不得倒置。'},
};
