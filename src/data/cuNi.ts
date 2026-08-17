import type { PhaseDiagramDefinition } from './types';

export const cuNi: PhaseDiagramDefinition = {
  id: 'cu-ni',
  title: 'Cu–Ni 匀晶相图',
  shortTitle: 'Cu–Ni 匀晶',
  systemType: '完全固溶型匀晶体系',
  components: { left: 'Cu', right: 'Ni' },
  compositionAxis: { min: 0, max: 100, ticks: [0, 20, 40, 60, 80, 100], label: 'wNi / %' },
  temperatureAxis: { min: 800, max: 1550, ticks: [800, 1000, 1200, 1400, 1550], label: '温度 / ℃' },
  boundaries: [
    {
      id: 'liquidus', kind: 'liquidus', phases: ['L', 'L+α'],
      points: [[0, 1085], [15, 1195], [35, 1300], [55, 1375], [75, 1425], [100, 1455]],
    },
    {
      id: 'solidus', kind: 'solidus', phases: ['L+α', 'α'],
      points: [[0, 1085], [15, 1115], [35, 1175], [55, 1260], [75, 1360], [100, 1455]],
    },
  ],
  regions: [
    {
      id: 'liquid', label: 'L', phases: ['L'], labelAnchor: [55, 1480], teaching: '合金完全处于液态，继续冷却到液相线后开始析出 α 固溶体。',
      outline: [{ type: 'boundary', boundaryId: 'liquidus' }, { type: 'line', points: [[100, 1550], [0, 1550]] }],
    },
    {
      id: 'liquid-alpha', label: 'L + α', phases: ['L', 'α'], labelAnchor: [53, 1330], teaching: '液相与 α 固溶体平衡共存。等温线两端分别给出液相和固相成分。',
      tieLine: { left: { phase: 'L', boundaryId: 'liquidus' }, right: { phase: 'α', boundaryId: 'solidus' } },
      outline: [{ type: 'boundary', boundaryId: 'liquidus' }, { type: 'boundary', boundaryId: 'solidus', reverse: true }],
    },
    {
      id: 'alpha', label: 'α', phases: ['α'], labelAnchor: [58, 1050], teaching: '合金已经完全凝固为 Cu–Ni 置换型 α 固溶体。',
      outline: [{ type: 'boundary', boundaryId: 'solidus' }, { type: 'line', points: [[100, 800], [0, 800]] }],
    },
  ],
  invariants: [],
  keyPoints: [
    { label: 'Cu 1085℃', composition: 0, temperature: 1085, dx: 8, dy: -10 },
    { label: 'Ni 1455℃', composition: 100, temperature: 1455, dx: -72, dy: -10 },
  ],
  defaultState: { composition: 40, temperature: 1260 },
  teaching: { overview: 'Cu 与 Ni 在液态和固态均完全互溶，是理解液相线、固相线和杠杆定律的经典匀晶体系。' },
};
