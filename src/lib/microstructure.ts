import type { PhaseDiagramDefinition } from '../data/types';
import { compositionsAt, temperatureAt } from './geometry';
import { evaluatePhaseState, isInvariantApplicable } from './phaseState';

/**
 * 显微组织判定。
 *
 * 与相区判定的区别：相区只回答「此处有哪些相」（如 α+β），
 * 显微组织要回答「按平衡冷却走到这一步，显微镜下看到什么」（如 初生α相 +（α+β）共晶组织）。
 * 因此必须沿成分垂线模拟冷却路径：液相 → 初生相析出 → 三相反应 → 固态析出 → 最终组织。
 *
 * 二次相一律用罗马数字：βⅡ、Fe₃CⅡ。
 */
export interface Microstructure {
  /** 冷却阶段 */
  stage: string;
  /** 当前显微组织 */
  name: string;
  /** 组织形成过程 */
  formation: string;
}

export interface MicrostructureFraction {
  /** 组织组成物名称，而不是相名。 */
  name: string;
  /** 占全部显微组织的质量百分数。 */
  fraction: number;
}

export interface MicrostructureFractions {
  items: MicrostructureFraction[];
  note: string;
}

/** 判定「正处于三相反应温度」的带宽，取温度轴跨度的 0.4%，使拖动可及。 */
function reactionBand(diagram: PhaseDiagramDefinition) {
  return (diagram.temperatureAxis.max - diagram.temperatureAxis.min) * 0.004;
}

const at = (diagram: PhaseDiagramDefinition, id: string, composition: number) =>
  temperatureAt(diagram.boundaries.find((item) => item.id === id)!, composition);

// ── Cu–Ni 匀晶 ────────────────────────────────────────────────
function isomorphous(diagram: PhaseDiagramDefinition, c: number, T: number): Microstructure {
  const liquidus = at(diagram, 'liquidus', c) ?? diagram.temperatureAxis.max;
  const solidus = at(diagram, 'solidus', c) ?? diagram.temperatureAxis.min;
  if (T > liquidus) return {
    stage: '液态', name: '液相 L',
    formation: `合金完全熔融。冷却到液相线 ${liquidus.toFixed(0)}℃ 时才开始结晶。`,
  };
  if (T > solidus) return {
    stage: '结晶进行中（L → α）', name: 'L + 初生α相',
    formation: `液相冷至 ${liquidus.toFixed(0)}℃ 开始析出初生 α 固溶体，呈枝晶状长大。液、固两相成分分别沿液相线与固相线变化，先结晶部分富高熔点组元，形成枝晶偏析。`,
  };
  return {
    stage: '凝固完成', name: 'α固溶体（单相）',
    formation: `冷至固相线 ${solidus.toFixed(0)}℃ 液相耗尽，全部转变为单相 α 置换固溶体。铸态下保留枝晶偏析，需扩散退火消除。`,
  };
}

// ── Pb–Sn 共晶 ────────────────────────────────────────────────
function eutectic(diagram: PhaseDiagramDefinition, c: number, T: number): Microstructure {
  const inv = diagram.invariants[0];
  const { left: cAlpha, middle: cE, right: cBeta } = inv.points;
  const band = reactionBand(diagram);
  const left = c < cE;
  const liquidus = at(diagram, left ? 'liquidus-left' : 'liquidus-right', c) ?? diagram.temperatureAxis.max;
  const solvus = at(diagram, left ? 'alpha-solvus' : 'beta-solvus', c);
  const primary = left ? 'α' : 'β';
  const secondary = left ? 'βⅡ' : 'αⅡ';
  const singlePhase = left ? c < cAlpha : c > cBeta;

  if (T > liquidus) return { stage: '液态', name: '液相 L', formation: `合金完全熔融，冷却到液相线 ${liquidus.toFixed(0)}℃ 才开始结晶。` };

  // 单相固溶体成分：不经历共晶反应
  if (singlePhase) {
    const solidus = at(diagram, left ? 'alpha-solidus' : 'beta-solidus', c) ?? inv.temperature;
    if (T > solidus) return {
      stage: '结晶进行中', name: `L + 初生${primary}相`,
      formation: `液相中析出初生 ${primary} 固溶体枝晶，剩余液相成分沿液相线向共晶点富集。`,
    };
    if (solvus === null || T > solvus) return {
      stage: '单相固溶体', name: `${primary}固溶体（单相）`,
      formation: `液相在 ${solidus.toFixed(0)}℃ 耗尽，得到单相 ${primary} 固溶体。该成分未达共晶点，不发生共晶反应。`,
    };
    return {
      stage: '固态析出', name: `${primary}固溶体 + ${secondary}`,
      formation: `冷至溶解度线 ${solvus.toFixed(0)}℃ 以下，${primary} 相中溶质过饱和，沿晶界析出二次相 ${secondary}。`,
    };
  }

  // 共晶成分
  if (Math.abs(c - cE) < 0.6) {
    if (T > inv.temperature + band) return { stage: '液态（共晶成分）', name: '液相 L', formation: `共晶成分合金冷却时不析出初生相，直到 ${inv.temperature}℃ 才一次性发生共晶反应。` };
    if (T > inv.temperature - band) return {
      stage: '共晶反应阶段', name: '（α+β）共晶组织形成中',
      formation: `${inv.temperature}℃ 恒温下发生 ${inv.equation}：全部液相同时转变为 α 与 β 两相。反应期间三相共存，温度不变。`,
    };
    return { stage: '固态冷却', name: '（α+β）共晶组织', formation: `全部组织为共晶体，α 与 β 交替呈层片状（或棒状）排列，是典型的两相混合物。` };
  }

  // 亚共晶 / 过共晶
  const kind = left ? '亚共晶' : '过共晶';
  if (T > inv.temperature + band) return {
    stage: '初生相结晶阶段', name: `L + 初生${primary}相`,
    formation: `${kind}合金。液相冷至 ${liquidus.toFixed(0)}℃ 开始析出初生 ${primary} 枝晶，剩余液相成分沿液相线移向共晶点 ${cE}%。`,
  };
  if (T > inv.temperature - band) return {
    stage: '共晶反应阶段', name: `初生${primary}相 +（α+β）共晶组织`,
    formation: `温度降至 ${inv.temperature}℃，剩余液相达到共晶成分 ${cE}%，恒温发生 ${inv.equation}。初生 ${primary} 枝晶保留，其余液相转变为共晶体。`,
  };
  return {
    stage: '固态析出', name: `初生${primary}相 +（α+β）共晶组织 + ${secondary}`,
    formation: `共晶反应结束后继续冷却，初生 ${primary} 相因溶解度沿溶解度线下降而过饱和，析出二次相 ${secondary}。最终组织为初生 ${primary} 枝晶分布在共晶基体上。`,
  };
}

// ── Pt–Ag 包晶 ────────────────────────────────────────────────
function peritectic(diagram: PhaseDiagramDefinition, c: number, T: number): Microstructure {
  const inv = diagram.invariants[0];
  const { left: cA, middle: cB, right: cL } = inv.points;   // α 10.5 / β 42.4 / L 66.3
  const band = reactionBand(diagram);
  const liquidus = at(diagram, c <= cL ? 'liquidus-left' : 'liquidus-right', c) ?? diagram.temperatureAxis.max;

  if (T > liquidus) return { stage: '液态', name: '液相 L', formation: `合金完全熔融，冷却到液相线 ${liquidus.toFixed(0)}℃ 才开始结晶。` };

  if (c < cA) {   // 富 Pt 侧单相 α
    const solidus = at(diagram, 'alpha-solidus', c) ?? inv.temperature;
    const solvus = at(diagram, 'alpha-solvus', c);
    if (T > solidus) return { stage: '结晶进行中', name: 'L + 初生α相', formation: '液相中析出初生 α 固溶体枝晶。该成分位于包晶点左侧，不发生包晶反应。' };
    if (solvus === null || T > solvus) return { stage: '单相固溶体', name: 'α固溶体（单相）', formation: `液相在 ${solidus.toFixed(0)}℃ 耗尽，得到单相 α 固溶体。` };
    return { stage: '固态析出', name: 'α固溶体 + βⅡ', formation: `冷至溶解度线 ${solvus.toFixed(0)}℃ 以下，α 过饱和析出二次相 βⅡ。` };
  }

  if (c > cL) {   // 富 Ag 侧，直接从液相析出 β
    const solidus = at(diagram, 'beta-solidus', c) ?? inv.temperature;
    if (T > solidus) return { stage: '结晶进行中', name: 'L + 初生β相', formation: '该成分位于包晶点 C 右侧，液相直接析出初生 β 固溶体，不经历包晶反应。' };
    return { stage: '凝固完成', name: 'β固溶体（单相）', formation: `液相在 ${solidus.toFixed(0)}℃ 耗尽，得到单相 β 固溶体。` };
  }

  // cA ≤ c ≤ cL：经历包晶反应
  if (T > inv.temperature + band) return {
    stage: '包晶反应前', name: 'L + 初生α相',
    formation: `液相冷至 ${liquidus.toFixed(0)}℃ 开始析出初生 α 枝晶。继续冷却时液相成分沿液相线移向 C 点 ${cL}%、α 成分移向 D 点 ${cA}%，为 ${inv.temperature}℃ 的包晶反应做准备。`,
  };
  if (T > inv.temperature - band) return {
    stage: '包晶反应阶段', name: 'L + α + β（三相共存）',
    formation: `${inv.temperature}℃ 恒温发生 ${inv.equation}。新生 β 在 L 与 α 的界面形核，呈壳层状包覆住 α 枝晶，把液相与 α 隔开，反应只能靠原子扩散穿过 β 层继续进行。`,
  };
  if (Math.abs(c - cB) < 0.6) return {
    stage: '包晶反应结束', name: 'β基体组织（单相）',
    formation: `该成分恰为包晶点 P（${cB}%），L 与 α 恰好完全消耗，全部转变为单相 β。`,
  };
  if (c < cB) return {
    stage: '包晶反应结束', name: '残余α相 + β相',
    formation: `成分位于 D（${cA}%）与 P（${cB}%）之间，液相先被耗尽而 α 有剩余。最终为残余 α 心部被 β 壳层包裹的「壳心结构」，这是包晶组织不平衡的典型标志。`,
  };
  const betaSolidus = at(diagram, 'beta-solidus', c);
  if (betaSolidus !== null && T > betaSolidus) return {
    stage: '包晶反应后继续结晶', name: 'L + β相',
    formation: `成分位于 P（${cB}%）与 C（${cL}%）之间，α 先被耗尽而液相有剩余。剩余液相继续析出 β，直至 ${betaSolidus.toFixed(0)}℃ 凝固完毕。`,
  };
  return { stage: '凝固完成', name: 'β固溶体（单相）', formation: '包晶反应后剩余液相全部转变为 β，最终得到单相 β 固溶体。' };
}

// ── Fe–Fe₃C ──────────────────────────────────────────────────
function ironCarbon(diagram: PhaseDiagramDefinition, c: number, T: number): Microstructure {
  const band = reactionBand(diagram);
  const [peri, eut, eutd] = diagram.invariants;          // 1495 / 1148 / 727
  const cP = 0.0218, cS = 0.77, cE = 2.11, cC = 4.3;
  const liquidusId = c <= 0.53 ? 'liquidus-delta' : c <= cC ? 'liquidus-gamma' : 'liquidus-cementite';
  const liquidus = at(diagram, liquidusId, c) ?? diagram.temperatureAxis.max;
  const a3 = at(diagram, 'a3', c);
  const acm = at(diagram, 'acm', c);

  if (T > liquidus) return { stage: '液态', name: '液相 L', formation: `合金完全熔融，冷却到液相线 ${liquidus.toFixed(0)}℃ 才开始结晶。` };

  // —— 铸铁侧（wC > 2.11）——
  if (c > cE) {
    const hypo = c < cC - 0.05, hyper = c > cC + 0.05;
    const kind = hypo ? '亚共晶白口铸铁' : hyper ? '过共晶白口铸铁' : '共晶白口铸铁';
    if (T > eut.temperature + band) {
      if (hypo) return { stage: '初生奥氏体结晶', name: 'L + 初生奥氏体', formation: `${kind}。液相冷至 ${liquidus.toFixed(0)}℃ 析出初生奥氏体枝晶，剩余液相成分沿液相线移向共晶点 ${cC}%。` };
      if (hyper) return { stage: '一次渗碳体结晶', name: 'L + 一次渗碳体（Fe₃CⅠ）', formation: `${kind}。液相中直接析出粗大板条状一次渗碳体 Fe₃CⅠ，剩余液相成分沿液相线移向共晶点 ${cC}%。` };
      return { stage: '液态（共晶成分）', name: '液相 L', formation: `${kind}。不析出初生相，直到 ${eut.temperature}℃ 一次性发生共晶反应。` };
    }
    if (T > eut.temperature - band) return {
      stage: '共晶反应阶段', name: hypo ? '初生奥氏体 + 莱氏体（Ld）形成中' : hyper ? '一次渗碳体 + 莱氏体（Ld）形成中' : '莱氏体（Ld）形成中',
      formation: `${eut.temperature}℃ 恒温发生 ${eut.equation}。剩余液相转变为奥氏体与渗碳体的机械混合物——高温莱氏体 Ld。`,
    };
    if (T > eutd.temperature + band) return {
      stage: '二次渗碳体析出', name: hypo ? '初生奥氏体 + 二次渗碳体（Fe₃CⅡ）+ 莱氏体（Ld）' : hyper ? '一次渗碳体（Fe₃CⅠ）+ 莱氏体（Ld）' : '莱氏体（Ld）',
      formation: `共晶反应结束后继续冷却，奥氏体含碳量沿 Acm 线下降，沿晶界析出二次渗碳体 Fe₃CⅡ。莱氏体中的奥氏体同样在析出 Fe₃CⅡ。`,
    };
    if (T > eutd.temperature - band) return {
      stage: '共析反应阶段', name: '莱氏体中奥氏体正转变为珠光体',
      formation: `${eutd.temperature}℃ 恒温发生 ${eutd.equation}。所有奥氏体（含莱氏体内的奥氏体）转变为珠光体，高温莱氏体 Ld 随之变为低温莱氏体 Ld′。`,
    };
    return {
      stage: '室温组织', name: hypo ? '珠光体 + 二次渗碳体 + 低温莱氏体（Ld′）' : hyper ? '一次渗碳体（Fe₃CⅠ）+ 低温莱氏体（Ld′）' : '低温莱氏体（Ld′）',
      formation: hypo
        ? '初生奥氏体转变为珠光体（呈枝晶状黑块），其外围为网状二次渗碳体，二者分布在低温莱氏体基体上。'
        : hyper
          ? '粗大白亮板条状一次渗碳体贯穿视场，其余为低温莱氏体基体。Fe₃CⅠ 是区分过共晶与亚共晶白口铸铁的判据。'
          : '低温莱氏体：珠光体呈黑色粒状或短棒状分布在白亮渗碳体基体上，形似豹纹。硬而脆，不能切削加工。',
    };
  }

  // —— 钢侧（wC ≤ 2.11）——
  const deltaZone = c <= 0.53;
  if (deltaZone && T > peri.temperature + band) {
    // δ 固相线只覆盖 0–0.09%（H 点）。成分超出时 δ 始终与液相共存，直到 1495℃ 包晶反应，
    // 不会出现单相 δ；此处返回 null 不能当作「已凝固」。
    const deltaSolidus = at(diagram, 'delta-solidus', c);
    if (deltaSolidus === null || T > deltaSolidus) return {
      stage: '初生δ铁素体结晶', name: 'L + 初生δ铁素体',
      formation: `液相冷至 ${liquidus.toFixed(0)}℃ 开始析出高温 δ 铁素体枝晶（体心立方）。继续冷却时液相成分沿液相线移向 B 点 0.53%、δ 成分移向 H 点 0.09%，为 ${peri.temperature}℃ 的包晶反应做准备。`,
    };
    return { stage: '高温固溶阶段', name: 'δ铁素体（单相）', formation: `液相在 ${deltaSolidus.toFixed(0)}℃ 耗尽，得到单相高温 δ 铁素体。含碳量低于 H 点 0.09%，继续冷却将通过同素异构转变为奥氏体。` };
  }
  if (deltaZone && T > peri.temperature - band && c >= peri.points.left && c <= peri.points.right) return {
    stage: '包晶反应阶段', name: 'L + δ + A（三相共存）',
    formation: `${peri.temperature}℃ 恒温发生 ${peri.equation}。液相与 δ 铁素体在界面处反应生成奥氏体。`,
  };
  const gammaSolidus = at(diagram, 'gamma-solidus', c);
  if (gammaSolidus !== null && T > gammaSolidus && T < liquidus) return {
    stage: '奥氏体结晶阶段', name: 'L + 初生奥氏体', formation: '液相中析出奥氏体枝晶，剩余液相成分沿液相线变化。',
  };

  const hypoEutectoid = c < cS - 0.01, hyperEutectoid = c > cS + 0.01;
  const steelKind = c < cP ? '工业纯铁' : hypoEutectoid ? '亚共析钢' : hyperEutectoid ? '过共析钢' : '共析钢';

  if (T > eutd.temperature + band) {
    if (hypoEutectoid && a3 !== null && T <= a3) return {
      stage: '先共析铁素体析出', name: '奥氏体 + 先共析铁素体',
      formation: `${steelKind}。冷至 A₃ 线 ${a3.toFixed(0)}℃ 以下，先共析铁素体沿奥氏体晶界形核长大，剩余奥氏体含碳量沿 GS 线升高，趋向共析成分 ${cS}%。`,
    };
    if (hyperEutectoid && acm !== null && T <= acm) return {
      stage: '二次渗碳体析出', name: '奥氏体 + 二次渗碳体（Fe₃CⅡ）',
      formation: `${steelKind}。冷至 Acm 线 ${acm.toFixed(0)}℃ 以下，二次渗碳体沿奥氏体晶界呈网状析出，剩余奥氏体含碳量沿 ES 线降低，趋向共析成分 ${cS}%。`,
    };
    return { stage: '单相奥氏体', name: '奥氏体（A）', formation: `${steelKind}。此时为单相奥氏体，面心立方，晶粒呈多边形等轴状，常见退火孪晶。` };
  }

  if (T > eutd.temperature - band && c >= cP) return {
    stage: '共析反应阶段', name: '珠光体形成中',
    formation: `${eutd.temperature}℃ 恒温发生 ${eutd.equation}。含碳量已达 ${cS}% 的奥氏体转变为铁素体与渗碳体的层片状机械混合物——珠光体。`,
  };

  if (c < cP) {
    const solvus = at(diagram, 'alpha-solvus', c);
    if (solvus === null || T > solvus) return { stage: '室温组织', name: '铁素体（F）', formation: '工业纯铁。含碳量低于 0.0218%，室温组织为单相铁素体，白亮多边形等轴晶粒。' };
    return { stage: '三次渗碳体析出', name: '铁素体 + 三次渗碳体（Fe₃CⅢ）', formation: '铁素体中碳的溶解度随温度下降而减小，沿晶界析出极少量三次渗碳体 Fe₃CⅢ。' };
  }
  if (hypoEutectoid) return {
    stage: '室温组织', name: '铁素体 + 珠光体',
    formation: `${steelKind}。先共析铁素体呈白亮块状或网状，其余奥氏体在 ${eutd.temperature}℃ 转变为层片状珠光体。含碳量越低，铁素体比例越大。`,
  };
  if (hyperEutectoid) return {
    stage: '室温组织', name: '珠光体 + 二次渗碳体',
    formation: `${steelKind}。二次渗碳体呈白亮网状包围原奥氏体晶界，网内为珠光体。网状 Fe₃CⅡ 显著降低韧性，生产上需球化退火消除。`,
  };
  return { stage: '室温组织', name: '珠光体（P）', formation: `${steelKind}。全部为珠光体，铁素体与渗碳体交替呈层片状，浸蚀后高倍下呈明暗相间条纹，低倍下形似指纹。` };
}

export function describeMicrostructure(
  diagram: PhaseDiagramDefinition,
  composition: number,
  temperature: number,
): Microstructure | null {
  const c = Math.min(diagram.compositionAxis.max, Math.max(diagram.compositionAxis.min, composition));
  const T = Math.min(diagram.temperatureAxis.max, Math.max(diagram.temperatureAxis.min, temperature));
  switch (diagram.id) {
    case 'cu-ni': return isomorphous(diagram, c, T);
    case 'pb-sn': return eutectic(diagram, c, T);
    case 'pt-ag': return peritectic(diagram, c, T);
    case 'fe-c': return ironCarbon(diagram, c, T);
    default: return null;
  }
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

function normalized(items: MicrostructureFraction[], note: string): MicrostructureFractions {
  const valid = items
    .filter((item) => Number.isFinite(item.fraction) && item.fraction > 1e-9)
    .map((item) => ({ ...item, fraction: clampPercent(item.fraction) }));
  const total = valid.reduce((sum, item) => sum + item.fraction, 0);
  if (total <= 0) return { items: [], note };
  return {
    items: valid.map((item) => ({ ...item, fraction: item.fraction * 100 / total })),
    note,
  };
}

function phaseConstituentName(diagram: PhaseDiagramDefinition, phase: string): string {
  if (phase === 'L') return '液相';
  if (diagram.id === 'fe-c') {
    if (phase === 'α') return '铁素体';
    if (phase === 'γ') return '奥氏体';
    if (phase === 'δ') return 'δ铁素体';
    if (phase === 'Fe₃C') return '渗碳体';
  }
  if (phase === 'α') return 'α固溶体';
  if (phase === 'β') return 'β固溶体';
  return phase;
}

/** 按最外层的加号拆分组织名称；括号内的“α+β”等组合保持完整。 */
export function splitMicrostructureName(name: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < name.length; index += 1) {
    const character = name[index];
    if (character === '(' || character === '（') depth += 1;
    if (character === ')' || character === '）') depth = Math.max(0, depth - 1);
    if (character === '+' && depth === 0) {
      parts.push(name.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(name.slice(start).trim());
  return parts.filter(Boolean);
}

function currentNameForPhase(
  diagram: PhaseDiagramDefinition,
  phase: string,
  microstructure: Microstructure | null,
): string {
  const components = microstructure ? splitMicrostructureName(microstructure.name) : [];
  const includes = (pattern: RegExp) => components.find((item) => pattern.test(item));
  const matched = phase === 'L'
    ? includes(/(^L$|^L\s|液相)/u)
    : phase === 'Fe₃C'
      ? includes(/(Fe₃C|渗碳体)/u)
      : phase === 'γ'
        ? includes(/(奥氏体|^A(?:\s|$|（))/u)
        : phase === 'δ'
          ? includes(/δ/u)
          : phase === 'α'
            ? includes(diagram.id === 'fe-c' ? /铁素体/u : /α/u)
            : phase === 'β'
              ? includes(/β/u)
              : undefined;
  return matched ?? phaseConstituentName(diagram, phase);
}

const compositionAtTemperature = (
  diagram: PhaseDiagramDefinition,
  boundaryId: string,
  temperature: number,
) => compositionsAt(diagram.boundaries.find((item) => item.id === boundaryId)!, temperature)[0] ?? null;

function equilibriumFractions(
  diagram: PhaseDiagramDefinition,
  composition: number,
  temperature: number,
  note = '当前未跨越形成独立组织组成物的不变量反应，比例按此温度下的平衡相含量显示。',
): MicrostructureFractions {
  const state = evaluatePhaseState(diagram, composition, temperature);
  const microstructure = describeMicrostructure(diagram, composition, temperature);
  return normalized(
    state.equilibrium.map((item) => ({
      name: currentNameForPhase(diagram, item.phase, microstructure),
      fraction: item.fraction,
    })),
    note,
  );
}

/**
 * 计算当前冷却路径上的组织组成物比例。
 *
 * 液/固两相区直接沿用实时杠杆定律；共晶、共析和铸铁凝固后的比例，
 * 则在对应不变量温度处按组织组成物重新应用杠杆定律。反应温度带内
 * 三相比例取决于反应进度，因此明确返回空数组，禁止显示虚假的唯一值。
 */
export function describeMicrostructureFractions(
  diagram: PhaseDiagramDefinition,
  composition: number,
  temperature: number,
): MicrostructureFractions {
  const c = Math.min(diagram.compositionAxis.max, Math.max(diagram.compositionAxis.min, composition));
  const T = Math.min(diagram.temperatureAxis.max, Math.max(diagram.temperatureAxis.min, temperature));
  const activeReaction = diagram.invariants.find((reaction) =>
    Math.abs(T - reaction.temperature) <= reactionBand(diagram) && isInvariantApplicable(reaction, c));
  if (activeReaction) {
    return { items: [], note: '三相反应进行中，组织比例随反应进度变化，不存在唯一值。' };
  }

  if (diagram.id === 'pb-sn') {
    const reaction = diagram.invariants[0];
    const { left, middle, right } = reaction.points;
    if (T < reaction.temperature - reactionBand(diagram) && c >= left && c <= right) {
      if (Math.abs(c - middle) < 0.6) {
        return { items: [{ name: '（α+β）共晶组织', fraction: 100 }], note: '共晶成分全部形成（α+β）共晶组织。' };
      }
      const alphaAtT = compositionAtTemperature(diagram, 'alpha-solvus', T) ?? left;
      const betaAtT = compositionAtTemperature(diagram, 'beta-solvus', T) ?? right;
      if (c <= middle) {
        const primary = (middle - c) / (middle - left) * 100;
        const primaryAlpha = primary * (betaAtT - left) / (betaAtT - alphaAtT);
        return normalized([
          { name: '初生α相', fraction: primaryAlpha },
          { name: '（α+β）共晶组织', fraction: 100 - primary },
          { name: 'βⅡ', fraction: primary - primaryAlpha },
        ], '初生组织与共晶组织按共晶温度杠杆关系计算；二次相按当前温度溶解度线进一步分配。');
      }
      const primary = (c - middle) / (right - middle) * 100;
      const primaryBeta = primary * (right - alphaAtT) / (betaAtT - alphaAtT);
      return normalized([
        { name: '初生β相', fraction: primaryBeta },
        { name: '（α+β）共晶组织', fraction: 100 - primary },
        { name: 'αⅡ', fraction: primary - primaryBeta },
      ], '初生组织与共晶组织按共晶温度杠杆关系计算；二次相按当前温度溶解度线进一步分配。');
    }
  }

  if (diagram.id === 'fe-c') {
    const [, eutecticReaction, eutectoidReaction] = diagram.invariants;
    const cP = 0.0218;
    const cS = 0.77;
    const cE = 2.11;
    const cC = 4.30;
    const cFe3C = 6.69;
    const belowEutectoid = T < eutectoidReaction.temperature - reactionBand(diagram);
    const belowEutectic = T < eutecticReaction.temperature - reactionBand(diagram);

    if (belowEutectoid && c >= cP && c <= cE) {
      if (c <= cS) {
        const ferrite = (cS - c) / (cS - cP) * 100;
        return normalized([
          { name: '铁素体', fraction: ferrite },
          { name: '珠光体', fraction: 100 - ferrite },
        ], '按共析温度处的杠杆关系估算组织组成物含量。');
      }
      const pearlite = (cFe3C - c) / (cFe3C - cS) * 100;
      return normalized([
        { name: '珠光体', fraction: pearlite },
        { name: '二次渗碳体', fraction: 100 - pearlite },
      ], '按共析温度处的杠杆关系估算组织组成物含量。');
    }

    if (belowEutectic && c > cE) {
      const hypo = c < cC - 0.05;
      const hyper = c > cC + 0.05;
      if (!hypo && !hyper) {
        return { items: [{ name: belowEutectoid ? '低温莱氏体（Ld′）' : '莱氏体（Ld）', fraction: 100 }], note: '共晶成分全部形成莱氏体组织。' };
      }
      if (hypo) {
        const primaryAtEutectic = (cC - c) / (cC - cE) * 100;
        const ledeburite = 100 - primaryAtEutectic;
        const gammaAtT = belowEutectoid
          ? cS
          : compositionAtTemperature(diagram, 'acm', T) ?? cS;
        const secondaryCementite = primaryAtEutectic * (cE - gammaAtT) / (cFe3C - gammaAtT);
        const transformedPrimary = primaryAtEutectic - secondaryCementite;
        return normalized([
          { name: belowEutectoid ? '珠光体' : '初生奥氏体', fraction: transformedPrimary },
          { name: belowEutectoid ? '二次渗碳体' : '二次渗碳体（Fe₃CⅡ）', fraction: secondaryCementite },
          { name: belowEutectoid ? '低温莱氏体（Ld′）' : '莱氏体（Ld）', fraction: ledeburite },
        ], '初生奥氏体与莱氏体按共晶温度杠杆关系计算；二次渗碳体按初生奥氏体沿 Acm 线的含碳量变化进一步分配。');
      }
      const cementite = (c - cC) / (cFe3C - cC) * 100;
      return normalized([
        { name: '一次渗碳体（Fe₃CⅠ）', fraction: cementite },
        { name: belowEutectoid ? '低温莱氏体（Ld′）' : '莱氏体（Ld）', fraction: 100 - cementite },
      ], '按共晶温度处的杠杆关系估算组织组成物含量。');
    }
  }

  return equilibriumFractions(diagram, c, T);
}
