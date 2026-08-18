import type { PhaseDiagramDefinition } from '../data/types';
import { regionAt } from './geometry';

export interface Microstructure {
  /** 组织类型名称，如「亚共析钢：F + P」。 */
  name: string;
  /** 显微形态及特征解析。 */
  morphology: string;
}

const EPS = 5e-3;

/** Fe–Fe₃C：同一相区内还要按成分再分组织，故单独判定。 */
function ironCarbon(regionId: string, composition: number): Microstructure | null {
  switch (regionId) {
    case 'liquid':
      return { name: 'L（液相）', morphology: '完全熔融的液态合金，无固定组织形貌。冷却穿过液相线后才开始出现初生固相。' };
    case 'delta':
      return { name: 'δ（高温铁素体）', morphology: 'δ 铁素体单相，体心立方结构。高温下晶粒粗大，呈多边形等轴状，晶界平直。' };
    case 'liquid-delta':
      return { name: 'L + δ', morphology: '液相中分布着初生 δ 铁素体枝晶。枝晶沿散热方向择优生长，二次枝晶臂随冷却速度减慢而变粗。' };
    case 'delta-gamma':
      return { name: 'δ + A', morphology: '包晶反应进行中。新生奥氏体在 δ 铁素体与液相的界面形核，呈壳层状包覆在 δ 枝晶外围，δ 被逐步蚕食。' };
    case 'liquid-gamma':
      return { name: 'L + A', morphology: '液相中分布初生奥氏体枝晶。枝晶随温度下降不断长大并富集碳于剩余液相，是形成枝晶偏析的阶段。' };
    case 'liquid-cementite':
      return { name: 'L + Fe₃CⅠ', morphology: '液相中析出粗大板条状（针状）一次渗碳体。Fe₃CⅠ 直接从液相长出，尺寸远大于二次、三次渗碳体，浸蚀后呈白亮色。' };
    case 'gamma':
      return { name: 'A（奥氏体）', morphology: '单相奥氏体，面心立方结构。呈多边形等轴晶粒，晶界平直，常可见退火孪晶带——这是奥氏体区别于铁素体的典型特征。' };
    case 'alpha-gamma':
      return { name: 'F + A', morphology: '先共析铁素体沿奥氏体晶界形核，呈网状或块状包围奥氏体晶粒。随温度下降铁素体量增加、奥氏体含碳量沿 GS 线升高。' };
    case 'alpha':
      return { name: 'F（铁素体）', morphology: '单相铁素体，体心立方结构。浸蚀后呈白亮多边形等轴晶粒，碳固溶度极低（727℃ 时仅 0.0218%）。' };
    case 'gamma-cementite':
      if (composition < 2.11 - EPS) return { name: 'A + Fe₃CⅡ', morphology: '二次渗碳体自奥氏体中析出，沿奥氏体晶界呈网状分布。含碳量越高，网越连续完整。' };
      if (composition < 4.3 - EPS) return { name: 'A + Fe₃CⅡ + Ld（亚共晶白口铸铁高温组织）', morphology: '初生奥氏体枝晶 + 沿晶界析出的网状二次渗碳体，二者分布在高温莱氏体基体上。Ld 中奥氏体呈粒状或短棒状嵌于渗碳体基体。' };
      if (composition < 4.3 + EPS) return { name: 'Ld（高温莱氏体）', morphology: '共晶组织。奥氏体呈粒状、短棒状均匀分布在连续的渗碳体基体上，硬而脆。' };
      return { name: 'Ld + Fe₃CⅠ（过共晶白口铸铁高温组织）', morphology: '粗大板条状一次渗碳体分布在高温莱氏体基体上。Fe₃CⅠ 尺寸明显大于莱氏体内的渗碳体。' };
    case 'alpha-cementite':
      if (composition < 0.0218 - 1e-4) return { name: 'F + Fe₃CⅢ', morphology: '铁素体基体，晶界处析出少量三次渗碳体薄片。Fe₃CⅢ 量极少，通常只在极低碳钢中才可分辨。' };
      if (composition < 0.77 - EPS) return { name: '亚共析钢：F + P', morphology: '白亮块状先共析铁素体 + 层片状珠光体。含碳量越低铁素体越多；铁素体常沿原奥氏体晶界呈网状或等轴块状分布。' };
      if (composition < 0.77 + EPS) return { name: '共析钢：P（珠光体）', morphology: '全部为珠光体。铁素体与渗碳体交替呈层片状排列，高倍下呈明暗相间条纹，低倍下因层片过细而呈暗色，形似指纹。' };
      if (composition < 2.11 - EPS) return { name: '过共析钢：P + Fe₃CⅡ', morphology: '珠光体基体上，二次渗碳体呈白亮网状包围原奥氏体晶界。网状 Fe₃CⅡ 显著降低韧性，生产上需球化退火消除。' };
      if (composition < 4.3 - EPS) return { name: '亚共晶白口铸铁：P + Fe₃CⅡ + Ld′', morphology: '由初生奥氏体枝晶转变来的珠光体（呈枝晶状黑块）+ 其外围网状二次渗碳体，二者分布在低温莱氏体基体上。' };
      if (composition < 4.3 + EPS) return { name: '共晶白口铸铁：Ld′（低温莱氏体）', morphology: '珠光体呈黑色粒状或短棒状均匀分布在白亮渗碳体基体上，形似豹纹或斑点。硬度高、脆性大，不能切削加工。' };
      return { name: '过共晶白口铸铁：Ld′ + Fe₃CⅠ', morphology: '粗大白亮板条状一次渗碳体贯穿视场，其余为低温莱氏体基体。Fe₃CⅠ 是区分过共晶与亚共晶白口铸铁的判据。' };
    case 'cementite':
      return { name: 'Fe₃C（渗碳体）', morphology: '正交晶系间隙化合物，含碳 6.69%。硬度极高（约 800HBW）、塑性几乎为零，浸蚀后呈白亮色。' };
    default:
      return null;
  }
}

/** 其余三套相图按相区给出组织描述。 */
const GENERIC: Record<string, Record<string, Microstructure>> = {
  'cu-ni': {
    liquid: { name: 'L（液相）', morphology: '完全熔融的液态合金，无固定组织形貌。' },
    'liquid-alpha': { name: 'L + α', morphology: '液相中生长着 α 固溶体枝晶。因固液两相成分始终不同，非平衡冷却时枝晶心部富 Ni、外缘富 Cu，形成枝晶偏析（树枝状组织）。' },
    alpha: { name: 'α（单相固溶体）', morphology: '单相置换固溶体，呈多边形等轴晶粒。铸态下常保留枝晶偏析痕迹，需扩散退火（均匀化退火）消除。' },
  },
  'pt-ag': {
    liquid: { name: 'L（液相）', morphology: '完全熔融的液态合金，无固定组织形貌。' },
    alpha: { name: 'α（富 Pt 固溶体）', morphology: '单相 α 固溶体，多边形等轴晶粒。' },
    'liquid-alpha': { name: 'L + α', morphology: '液相中分布初生 α 固溶体枝晶，冷至包晶温度后 α 将与液相反应生成 β。' },
    'liquid-beta': { name: 'L + β', morphology: '液相与 β 固溶体共存。包晶反应生成的 β 呈壳层状包覆在 α 外围，阻碍反应继续进行，常留下未反应完的 α 心部。' },
    beta: { name: 'β（富 Ag 固溶体）', morphology: '单相 β 固溶体，多边形等轴晶粒。' },
    'alpha-beta': { name: 'α + β', morphology: '两种固溶体共存。包晶产物 β 包裹残余 α，形成典型的「壳心结构」，是包晶组织不平衡的显微标志。' },
  },
  'pb-sn': {
    liquid: { name: 'L（液相）', morphology: '完全熔融的液态合金，无固定组织形貌。' },
    alpha: { name: 'α（富 Pb 固溶体）', morphology: '单相 α 固溶体，多边形等轴晶粒。' },
    'liquid-alpha': { name: 'L + α', morphology: '液相中分布初生 α 枝晶（亚共晶合金）。剩余液相成分沿液相线向共晶点富集。' },
    'liquid-beta': { name: 'L + β', morphology: '液相中分布初生 β 枝晶（过共晶合金）。' },
    beta: { name: 'β（富 Sn 固溶体）', morphology: '单相 β 固溶体，多边形等轴晶粒。' },
    'alpha-beta': { name: 'α + β', morphology: '共晶组织为 α 与 β 交替排列的层片状（或棒状）两相混合物；亚共晶合金中还可见初生 α 枝晶分布于共晶基体上，过共晶则为初生 β。' },
  },
};

export function describeMicrostructure(
  diagram: PhaseDiagramDefinition,
  composition: number,
  temperature: number,
): Microstructure | null {
  const region = regionAt(diagram, composition, temperature);
  if (!region) return null;
  if (diagram.id === 'fe-c') return ironCarbon(region.id, composition);
  return GENERIC[diagram.id]?.[region.id] ?? null;
}
