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
      points: [[0, 1085], [5, 1121.1], [10, 1155.3], [15, 1187.7], [20, 1218.2], [25, 1246.9], [30, 1273.7], [35, 1298.7], [40, 1321.8], [45, 1343.1], [50, 1362.5], [55, 1380.1], [60, 1395.8], [65, 1409.7], [70, 1421.7], [75, 1431.9], [80, 1440.2], [85, 1446.7], [90, 1451.3], [95, 1454.1], [100, 1455]],
    },
    {
      id: 'solidus', kind: 'solidus', phases: ['L+α', 'α'],
      points: [[0, 1085], [5, 1092.5], [10, 1103.5], [15, 1116.4], [20, 1130.7], [25, 1146], [30, 1162.3], [35, 1179.5], [40, 1197.4], [45, 1216], [50, 1235.3], [55, 1255.1], [60, 1275.5], [65, 1296.3], [70, 1317.7], [75, 1339.6], [80, 1361.8], [85, 1384.5], [90, 1407.6], [95, 1431.1], [100, 1455]],
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
    { label: 'Cu 1085℃', composition: 0, temperature: 1085, dx: 26, dy: 8 },
    { label: 'Ni 1455℃', composition: 100, temperature: 1455, dx: -72, dy: -10 },
  ],
  presets: [
    { id: 'p-b10', label: 'B10 白铜（10% Ni）', composition: 10, temperature: 1130 },
    { id: 'p-b30', label: 'B30 白铜（30% Ni）', composition: 30, temperature: 1218 },
    { id: 'p-constantan', label: '康铜（40% Ni）', composition: 40, temperature: 1260 },
    { id: 'p-monel', label: '蒙乃尔合金（67% Ni）', composition: 67, temperature: 1360 },
  ],
  defaultState: { composition: 40, temperature: 1260 },
  teaching: { overview: 'Cu 与 Ni 在液态和固态均完全互溶，是理解液相线、固相线和杠杆定律的经典匀晶体系。' },
};
