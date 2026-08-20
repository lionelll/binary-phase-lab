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
      points: [[0, 1085], [5, 1115.82], [10, 1145.31], [15, 1173.54], [20, 1200.44], [25, 1226.08], [30, 1250.39], [35, 1273.44], [40, 1295.16], [45, 1315.62], [50, 1334.75], [55, 1352.62], [60, 1369.16], [65, 1384.44], [70, 1398.39], [75, 1411.08], [80, 1422.44], [85, 1432.54], [90, 1441.31], [95, 1448.82], [100, 1455]],
    },
    {
      id: 'solidus', kind: 'solidus', phases: ['L+α', 'α'],
      // 两条相界以纯组元熔点连线为中心对称展开；曲率相对上版缩放为 70%，
      // 使 50% Ni 处 L+α 温度跨度由 185℃ 缩小为 129.5℃，同时保持两端硬锚定。
      points: [[0, 1085], [5, 1091.18], [10, 1098.69], [15, 1107.46], [20, 1117.56], [25, 1128.92], [30, 1141.61], [35, 1155.56], [40, 1170.84], [45, 1187.38], [50, 1205.25], [55, 1224.38], [60, 1244.84], [65, 1266.56], [70, 1289.61], [75, 1313.92], [80, 1339.56], [85, 1366.46], [90, 1394.69], [95, 1424.18], [100, 1455]],
    },
  ],
  regions: [
    {
      id: 'liquid', label: 'L', phases: ['L'], labelAnchor: [55, 1480], teaching: '合金完全处于液态，继续冷却到液相线后开始析出 α 固溶体。',
      outline: [{ type: 'boundary', boundaryId: 'liquidus' }, { type: 'line', points: [[100, 1550], [0, 1550]] }],
    },
    {
      id: 'liquid-alpha', label: 'L + α', phases: ['L', 'α'], labelAnchor: [53, 1280], teaching: '液相与 α 固溶体平衡共存。等温线两端分别给出液相和固相成分。',
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
