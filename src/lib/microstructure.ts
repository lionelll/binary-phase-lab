import type { PhaseDiagramDefinition, PhaseState } from '../data/types';
import { compositionsAt, temperatureAt } from './geometry';
import { isVisibleFraction, MIN_VISIBLE_FRACTION } from './fractionDisplay';
import { evaluatePhaseState } from './phaseState';

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

export interface MicrostructureSnapshot {
  microstructure: Microstructure;
  fractions: MicrostructureFractions;
}

const at = (diagram: PhaseDiagramDefinition, id: string, composition: number) =>
  temperatureAt(diagram.boundaries.find((item) => item.id === id)!, composition);

// ── Cu–Ni 匀晶 ────────────────────────────────────────────────
function isomorphous(diagram: PhaseDiagramDefinition, c: number, state: PhaseState): Microstructure {
  const liquidus = at(diagram, 'liquidus', c) ?? diagram.temperatureAxis.max;
  const solidus = at(diagram, 'solidus', c) ?? diagram.temperatureAxis.min;
  if (state.regionId === 'liquid') return {
    stage: '液态', name: '液相 L',
    formation: `合金完全熔融。冷却到液相线 ${liquidus.toFixed(0)}℃ 时才开始结晶。`,
  };
  if (state.regionId === 'liquid-alpha') return {
    stage: '结晶进行中（L → α）', name: 'L + 初生α相',
    formation: `液相冷至 ${liquidus.toFixed(0)}℃ 开始析出初生 α 固溶体，呈枝晶状长大。液、固两相成分分别沿液相线与固相线变化，先结晶部分富高熔点组元，形成枝晶偏析。`,
  };
  return {
    stage: '凝固完成', name: 'α固溶体（单相）',
    formation: `冷至固相线 ${solidus.toFixed(0)}℃ 液相耗尽，全部转变为单相 α 置换固溶体。铸态下保留枝晶偏析，需扩散退火消除。`,
  };
}

// ── Pb–Sn 共晶 ────────────────────────────────────────────────
function eutectic(diagram: PhaseDiagramDefinition, c: number, T: number, state: PhaseState): Microstructure {
  const inv = diagram.invariants[0];
  const { left: cAlpha, middle: cE, right: cBeta } = inv.points;
  const reacting = state.kind === 'invariant' && state.invariant?.id === inv.id;
  const left = c < cE;
  const liquidus = at(diagram, left ? 'liquidus-left' : 'liquidus-right', c) ?? diagram.temperatureAxis.max;
  const solvus = at(diagram, left ? 'alpha-solvus' : 'beta-solvus', c);
  const primary = left ? 'α' : 'β';
  const secondary = left ? 'βⅡ' : 'αⅡ';
  const singlePhase = left ? c < cAlpha : c > cBeta;

  if (state.regionId === 'liquid') return { stage: '液态', name: '液相 L', formation: `合金完全熔融，冷却到液相线 ${liquidus.toFixed(0)}℃ 才开始结晶。` };

  // 单相固溶体成分：不经历共晶反应
  if (singlePhase) {
    const solidus = at(diagram, left ? 'alpha-solidus' : 'beta-solidus', c) ?? inv.temperature;
    const liquidSolidRegion = left ? 'liquid-alpha' : 'liquid-beta';
    const solidRegion = left ? 'alpha' : 'beta';
    if (state.regionId === liquidSolidRegion) return {
      stage: '结晶进行中', name: `L + 初生${primary}相`,
      formation: `液相中析出初生 ${primary} 固溶体枝晶，剩余液相成分沿液相线向共晶点富集。`,
    };
    if (state.regionId === solidRegion) return {
      stage: '单相固溶体', name: `${primary}固溶体（单相）`,
      formation: `液相在 ${solidus.toFixed(0)}℃ 耗尽，得到单相 ${primary} 固溶体。该成分未达共晶点，不发生共晶反应。`,
    };
    if (state.regionId === 'alpha-beta') return {
      stage: '固态析出', name: `${primary}固溶体 + ${secondary}`,
      formation: `冷至溶解度线${solvus === null ? '' : ` ${solvus.toFixed(0)}℃`}以下，${primary} 相中溶质过饱和，沿晶界析出二次相 ${secondary}。`,
    };
    // 共享相界上的确定性兜底；常规相区均由上面的 PhaseState 分支处理。
    return T > solidus
      ? { stage: '结晶进行中', name: `L + 初生${primary}相`, formation: `液相中析出初生 ${primary} 固溶体枝晶。` }
      : { stage: '单相固溶体', name: `${primary}固溶体（单相）`, formation: `液相耗尽，得到单相 ${primary} 固溶体。` };
  }

  // 共晶成分
  if (Math.abs(c - cE) < 0.6) {
    if (reacting) return {
      stage: '共晶反应阶段', name: '（α+β）共晶组织形成中',
      formation: `${inv.temperature}℃ 恒温下发生 ${inv.equation}：全部液相同时转变为 α 与 β 两相。反应期间三相共存，温度不变。`,
    };
    if (T > inv.temperature) return { stage: '液态（共晶成分）', name: '液相 L', formation: `共晶成分合金冷却时不析出初生相，直到 ${inv.temperature}℃ 才一次性发生共晶反应。` };
    return { stage: '固态冷却', name: '（α+β）共晶组织', formation: `全部组织为共晶体，α 与 β 交替呈层片状（或棒状）排列，是典型的两相混合物。` };
  }

  // 亚共晶 / 过共晶
  const kind = left ? '亚共晶' : '过共晶';
  if (reacting) return {
    stage: '共晶反应阶段', name: `初生${primary}相 + （α+β）共晶组织形成中`,
    formation: `温度降至 ${inv.temperature}℃，剩余液相达到共晶成分 ${cE}%，恒温发生 ${inv.equation}。初生 ${primary} 枝晶保留，其余液相转变为共晶体。`,
  };
  if (T > inv.temperature) return {
    stage: '初生相结晶阶段', name: `L + 初生${primary}相`,
    formation: `${kind}合金。液相冷至 ${liquidus.toFixed(0)}℃ 开始析出初生 ${primary} 枝晶，剩余液相成分沿液相线移向共晶点 ${cE}%。`,
  };
  return {
    stage: '固态析出', name: `初生${primary}相 + （α+β）共晶组织 + ${secondary}`,
    formation: `共晶反应结束后继续冷却，初生 ${primary} 相因溶解度沿溶解度线下降而过饱和，析出二次相 ${secondary}。最终组织为初生 ${primary} 枝晶分布在共晶基体上。`,
  };
}

// ── Pt–Ag 包晶 ────────────────────────────────────────────────

const PT_AG_COMPOSITION_EPSILON = 1e-6;

function nameFromConstituents(items: MicrostructureFraction[]): string {
  return items.map((item) => item.name).join(' + ');
}

function ptAgTwoPhaseSnapshot(
  diagram: PhaseDiagramDefinition,
  c: number,
  state: PhaseState,
): MicrostructureSnapshot {
  const inv = diagram.invariants[0];
  const { left: cA, middle: cB, right: cL } = inv.points;
  const alphaFraction = state.equilibrium.find((item) => item.phase === 'α')?.fraction ?? 0;
  const betaFraction = state.equilibrium.find((item) => item.phase === 'β')?.fraction ?? 0;
  let stage: string;
  let formation: string;
  let rawItems: MicrostructureFraction[];
  let note: string;

  if (c <= cA + PT_AG_COMPOSITION_EPSILON) {
    stage = '固态脱溶（二次相析出）';
    rawItems = [
      { name: 'α固溶体基体', fraction: alphaFraction },
      { name: '二次固溶体（βⅡ）', fraction: betaFraction },
    ];
    formation = '合金完全凝固为单相 α 固溶体。降温穿过 α 固溶度线时，α 固溶体发生过饱和脱溶，在晶界或晶内析出二次固溶体 βⅡ。';
    note = 'α 固溶体基体含量对应当前杠杆计算的 α 相含量；二次固溶体 βⅡ 含量对应当前杠杆计算的 β 相含量。';
  } else if (c < cB - PT_AG_COMPOSITION_EPSILON) {
    stage = '包晶及固态转变完成';
    rawItems = [
      { name: '残余初生α相（含脱溶物）', fraction: alphaFraction },
      { name: '包晶β相（含脱溶物）', fraction: betaFraction },
    ];
    formation = `合金在 ${inv.temperature}℃ 发生包晶反应 ${inv.equation}，液相消耗完毕，保留部分初生 α。继续降温至 α+β 固态两相区，α 和 β 固溶体各自发生固态脱溶，组织最终由初生 α、包晶 β 及其脱溶产物组成。`;
    note = '残余初生 α 相（含脱溶物）对应当前 α 相平衡含量；包晶 β 相（含脱溶物）对应当前 β 相平衡含量。';
  } else {
    const directBeta = c >= cL - PT_AG_COMPOSITION_EPSILON;
    const peritecticPoint = Math.abs(c - cB) <= PT_AG_COMPOSITION_EPSILON;
    const betaName = directBeta ? 'β固溶体基体' : 'β基体组织';
    stage = '固态脱溶（二次相析出）';
    rawItems = [
      { name: betaName, fraction: betaFraction },
      { name: '二次固溶体（αⅡ）', fraction: alphaFraction },
    ];
    formation = directBeta
      ? '液相直接凝固为单相 β 固溶体。随温度降低进入 α+β 两相区后，β 固溶体中的 Pt 发生脱溶，析出二次固溶体 αⅡ。'
      : peritecticPoint
        ? `在 ${inv.temperature}℃ 发生包晶反应 ${inv.equation}，合金刚好全部转变为包晶 β 固溶体。降温进入 α+β 两相区后，β 固溶体过饱和脱溶，析出二次固溶体 αⅡ。`
        : '包晶反应中初生 α 全部消耗，剩余液相降温继续结晶为 β 固溶体。完全凝固后为单相 β；降温进入 α+β 两相区后发生固态脱溶，析出二次固溶体 αⅡ。';
    note = `${betaName}含量对应当前杠杆计算的 β 相含量；二次固溶体 αⅡ 含量对应当前杠杆计算的 α 相含量。`;
  }

  const normalizedFractions = normalized(rawItems, note);
  const missingConstituent = rawItems.find((item) => item.fraction < MIN_VISIBLE_FRACTION)?.name ?? '二次相';
  const missingConstituentLabel = missingConstituent.match(/[（(]([^（）()]+)[）)]/u)?.[1] ?? missingConstituent;
  const fractions = normalizedFractions.items.length === 1
    ? {
        ...normalizedFractions,
        items: normalizedFractions.items.map((item) => ({
          ...item,
          name: `${item.name}（${missingConstituentLabel}尚未析出）`,
        })),
      }
    : normalizedFractions;
  const critical = state.kind === 'boundary' || fractions.items.length === 1;
  const microstructure: Microstructure = {
    stage: critical ? '固溶度线临界状态' : stage,
    name: nameFromConstituents(fractions.items),
    formation: critical
      ? `${formation} 当前点位于固溶度线临界位置，二次相的平衡含量趋近于 0。`
      : formation,
  };
  return { microstructure, fractions };
}

function ptAgMicrostructureSnapshot(
  diagram: PhaseDiagramDefinition,
  c: number,
  state: PhaseState,
): MicrostructureSnapshot {
  const inv = diagram.invariants[0];
  const { left: cA, middle: cB, right: cL } = inv.points;
  const liquidus = at(diagram, c < cL ? 'liquidus-left' : 'liquidus-right', c) ?? diagram.temperatureAxis.max;

  if (state.kind === 'invariant' && state.invariant?.id === inv.id) {
    return {
      microstructure: {
        stage: '包晶反应阶段',
        name: 'L + α + β（三相共存）',
        formation: `${inv.temperature}℃ 恒温发生 ${inv.equation}。在平衡条件下，液相 L 与 α 相持续反应生成 β 相；三相组成固定，三相比例随反应进度变化。`,
      },
      fractions: { items: [], note: '三相反应进行中，组织比例随反应进度变化，不存在唯一值。' },
    };
  }

  const onSolvusBoundary = state.kind === 'boundary' &&
    (state.boundaryId === 'alpha-solvus' || state.boundaryId === 'beta-solvus');
  if (state.regionId === 'alpha-beta' || onSolvusBoundary) {
    return ptAgTwoPhaseSnapshot(diagram, c, state);
  }

  let microstructure: Microstructure;
  if (state.regionId === 'liquid') {
    microstructure = { stage: '液态', name: '液相 L', formation: `合金完全熔融，冷却到液相线 ${liquidus.toFixed(0)}℃ 才开始结晶。` };
  } else if (state.regionId === 'liquid-alpha') {
    microstructure = c < cA
      ? { stage: '结晶进行中', name: 'L + 初生α相', formation: '液相中析出初生 α 固溶体枝晶。该成分位于包晶点左侧，不发生包晶反应。' }
      : { stage: '包晶反应前', name: 'L + 初生α相', formation: `液相冷至 ${liquidus.toFixed(0)}℃ 开始析出初生 α 枝晶。继续冷却时液相成分沿液相线移向 C 点 ${cL}%、α 成分移向 D 点 ${cA}%，为 ${inv.temperature}℃ 的包晶反应做准备。` };
  } else if (state.regionId === 'liquid-beta') {
    microstructure = c < cL
      ? { stage: '包晶反应后继续结晶', name: 'L + β相', formation: `成分位于 P（${cB}%）与 C（${cL}%）之间，包晶反应后剩余液相继续析出 β，直至凝固完毕。` }
      : { stage: '结晶进行中', name: 'L + 初生β相', formation: '该成分从液相直接析出初生 β 固溶体，并随降温继续结晶直至液相耗尽。' };
  } else if (state.regionId === 'alpha') {
    const solidus = at(diagram, 'alpha-solidus', c) ?? inv.temperature;
    microstructure = { stage: '单相固溶体', name: 'α固溶体（单相）', formation: `液相在 ${solidus.toFixed(0)}℃ 耗尽，得到单相 α 固溶体。` };
  } else if (state.regionId === 'beta') {
    if (c >= cL - PT_AG_COMPOSITION_EPSILON) {
      microstructure = { stage: '单相固溶体', name: 'β固溶体（单相）', formation: '液相直接结晶并完全凝固为单相 β 固溶体。' };
    } else if (Math.abs(c - cB) <= PT_AG_COMPOSITION_EPSILON) {
      microstructure = { stage: '单相固溶体', name: 'β固溶体（单相）', formation: `P 点成分在 ${inv.temperature}℃ 完成包晶反应后刚好全部转变为单相 β 固溶体。` };
    } else {
      microstructure = { stage: '单相固溶体', name: 'β固溶体（单相）', formation: '包晶反应后剩余液相继续结晶并全部转变为 β，凝固完成后得到单相 β 固溶体。' };
    }
  } else {
    microstructure = { stage: '相界临界状态', name: state.regionLabel, formation: '当前点位于相界附近，组织随温度或成分的微小变化发生转变。' };
  }

  const fractions = equilibriumFractions(
    diagram,
    state,
    microstructure,
    '当前未形成独立的固态脱溶组织，比例按此温度下的平衡相含量显示。',
  );
  return {
    microstructure: fractions.items.length > 0
      ? { ...microstructure, name: nameFromConstituents(fractions.items) }
      : microstructure,
    fractions,
  };
}

// ── Fe–Fe₃C ──────────────────────────────────────────────────
function ironCarbon(diagram: PhaseDiagramDefinition, c: number, T: number, state: PhaseState): Microstructure {
  const [peri, eut, eutd] = diagram.invariants;          // 1495 / 1148 / 727
  const activeReactionId = state.kind === 'invariant' ? state.invariant?.id : null;
  const cP = 0.0218, cS = 0.77, cE = 2.11, cC = 4.3;
  const liquidusId = c <= 0.53 ? 'liquidus-delta' : c <= cC ? 'liquidus-gamma' : 'liquidus-cementite';
  const liquidus = at(diagram, liquidusId, c) ?? diagram.temperatureAxis.max;
  const a3 = at(diagram, 'a3', c);
  const acm = at(diagram, 'acm', c);

  if (T > liquidus) return { stage: '液态', name: '液相 L', formation: `合金完全熔融，冷却到液相线 ${liquidus.toFixed(0)}℃ 才开始结晶。` };

  // Fe₃C 化学计量端点在熔点以下只含渗碳体；不能保留 0% 的莱氏体组织。
  if (Math.abs(c - diagram.compositionAxis.max) <= 1e-6 && activeReactionId === null) return {
    stage: '渗碳体固相',
    name: '渗碳体（Fe₃C，单相）',
    formation: `Fe₃C 化学计量成分在 ${liquidus.toFixed(0)}℃ 以下完全凝固为渗碳体，不含莱氏体组织组成物。`,
  };

  // —— 铸铁侧（wC > 2.11）——
  if (c > cE) {
    const hypo = c < cC - 0.05, hyper = c > cC + 0.05;
    const kind = hypo ? '亚共晶白口铸铁' : hyper ? '过共晶白口铸铁' : '共晶白口铸铁';
    if (activeReactionId === eut.id) return {
      stage: '共晶反应阶段', name: hypo ? '初生奥氏体 + 莱氏体（Ld）形成中' : hyper ? '一次渗碳体 + 莱氏体（Ld）形成中' : '莱氏体（Ld）形成中',
      formation: `${eut.temperature}℃ 恒温发生 ${eut.equation}。剩余液相转变为奥氏体与渗碳体的机械混合物——高温莱氏体 Ld。`,
    };
    if (T > eut.temperature) {
      if (hypo) return { stage: '初生奥氏体结晶', name: 'L + 初生奥氏体', formation: `${kind}。液相冷至 ${liquidus.toFixed(0)}℃ 析出初生奥氏体枝晶，剩余液相成分沿液相线移向共晶点 ${cC}%。` };
      if (hyper) return { stage: '一次渗碳体结晶', name: 'L + 一次渗碳体（Fe₃CⅠ）', formation: `${kind}。液相中直接析出粗大板条状一次渗碳体 Fe₃CⅠ，剩余液相成分沿液相线移向共晶点 ${cC}%。` };
      return { stage: '液态（共晶成分）', name: '液相 L', formation: `${kind}。不析出初生相，直到 ${eut.temperature}℃ 一次性发生共晶反应。` };
    }
    if (activeReactionId === eutd.id) return {
      stage: '共析反应阶段', name: '莱氏体中奥氏体正转变为珠光体',
      formation: `${eutd.temperature}℃ 恒温发生 ${eutd.equation}。所有奥氏体（含莱氏体内的奥氏体）转变为珠光体，高温莱氏体 Ld 随之变为低温莱氏体 Ld′。`,
    };
    if (T > eutd.temperature) return {
      stage: '二次渗碳体析出', name: hypo ? '初生奥氏体 + 二次渗碳体（Fe₃CⅡ）+ 莱氏体（Ld）' : hyper ? '一次渗碳体（Fe₃CⅠ）+ 莱氏体（Ld）' : '莱氏体（Ld）',
      formation: `共晶反应结束后继续冷却，奥氏体含碳量沿 Acm 线下降，沿晶界析出二次渗碳体 Fe₃CⅡ。莱氏体中的奥氏体同样在析出 Fe₃CⅡ。`,
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
  if (activeReactionId === peri.id) return {
    stage: '包晶反应阶段', name: 'L + δ + A（三相共存）',
    formation: `${peri.temperature}℃ 恒温发生 ${peri.equation}。液相与 δ 铁素体在界面处反应生成奥氏体。`,
  };
  if (state.regionId === 'liquid-delta') return {
    stage: '初生δ铁素体结晶', name: 'L + 初生δ铁素体',
    formation: `液相冷至 ${liquidus.toFixed(0)}℃ 开始析出高温 δ 铁素体枝晶（体心立方），继续冷却将接近 ${peri.temperature}℃ 包晶反应温度。`,
  };
  if (state.regionId === 'delta') return {
    stage: '高温固溶阶段', name: 'δ铁素体（单相）',
    formation: '当前处于高温 δ 铁素体单相区；继续冷却将通过 δ→γ 同素异构转变进入奥氏体区。',
  };
  if (state.regionId === 'delta-gamma') return {
    stage: 'δ→γ 同素异构转变', name: 'δ铁素体 + 奥氏体',
    formation: '当前位于 δ+γ 两相区，高温 δ 铁素体正逐步转变为 γ 奥氏体；两相含量由当前等温线杠杆定律确定。',
  };
  if (state.regionId === 'liquid-gamma') return {
    stage: '奥氏体结晶阶段', name: 'L + 初生奥氏体',
    formation: '液相中析出奥氏体枝晶，剩余液相成分沿液相线变化。',
  };
  if (deltaZone && T > peri.temperature) {
    // δ 固相线只覆盖 0–0.09%（H 点）。成分超出时 δ 始终与液相共存，直到 1495℃ 包晶反应，
    // 不会出现单相 δ；此处返回 null 不能当作「已凝固」。
    const deltaSolidus = at(diagram, 'delta-solidus', c);
    if (deltaSolidus === null || T > deltaSolidus) return {
      stage: '初生δ铁素体结晶', name: 'L + 初生δ铁素体',
      formation: `液相冷至 ${liquidus.toFixed(0)}℃ 开始析出高温 δ 铁素体枝晶（体心立方）。继续冷却时液相成分沿液相线移向 B 点 0.53%、δ 成分移向 H 点 0.09%，为 ${peri.temperature}℃ 的包晶反应做准备。`,
    };
    return { stage: '高温固溶阶段', name: 'δ铁素体（单相）', formation: `液相在 ${deltaSolidus.toFixed(0)}℃ 耗尽，得到单相高温 δ 铁素体。含碳量低于 H 点 0.09%，继续冷却将通过同素异构转变为奥氏体。` };
  }
  const gammaSolidus = at(diagram, 'gamma-solidus', c);
  if (gammaSolidus !== null && T > gammaSolidus && T < liquidus) return {
    stage: '奥氏体结晶阶段', name: 'L + 初生奥氏体', formation: '液相中析出奥氏体枝晶，剩余液相成分沿液相线变化。',
  };

  const hypoEutectoid = c < cS - 0.01, hyperEutectoid = c > cS + 0.01;
  const steelKind = c < cP ? '工业纯铁' : hypoEutectoid ? '亚共析钢' : hyperEutectoid ? '过共析钢' : '共析钢';

  if (activeReactionId === eutd.id) return {
    stage: '共析反应阶段', name: '珠光体形成中',
    formation: `${eutd.temperature}℃ 恒温发生 ${eutd.equation}。含碳量已达 ${cS}% 的奥氏体转变为铁素体与渗碳体的层片状机械混合物——珠光体。`,
  };

  if (T > eutd.temperature) {
    // 极低碳 α 单相区必须服从相区判定；否则纯铁会被误写为“奥氏体 + 先共析铁素体”。
    if (state.regionId === 'alpha') return {
      stage: '单相铁素体', name: '铁素体（F，单相）',
      formation: `${steelKind}。当前位于 α 单相区，组织为铁素体，不含奥氏体。`,
    };
    if (state.regionId === 'alpha-gamma') return {
      stage: '先共析铁素体析出', name: '奥氏体 + 先共析铁素体',
      formation: `${steelKind}。冷至 A₃ 线${a3 === null ? '' : ` ${a3.toFixed(0)}℃`}以下，先共析铁素体沿奥氏体晶界形核长大，剩余奥氏体含碳量沿 GS 线升高，趋向共析成分 ${cS}%。`,
    };
    if (state.regionId === 'gamma-cementite') return {
      stage: '二次渗碳体析出', name: '奥氏体 + 二次渗碳体（Fe₃CⅡ）',
      formation: `${steelKind}。冷至 Acm 线${acm === null ? '' : ` ${acm.toFixed(0)}℃`}以下，二次渗碳体沿奥氏体晶界呈网状析出，剩余奥氏体含碳量沿 ES 线降低，趋向共析成分 ${cS}%。`,
    };
    return { stage: '单相奥氏体', name: '奥氏体（A）', formation: `${steelKind}。此时为单相奥氏体，面心立方，晶粒呈多边形等轴状，常见退火孪晶。` };
  }

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

function describeBaseMicrostructure(
  diagram: PhaseDiagramDefinition,
  c: number,
  T: number,
  state: PhaseState,
): Microstructure {
  switch (diagram.id) {
    case 'cu-ni': return isomorphous(diagram, c, state);
    case 'pb-sn': return eutectic(diagram, c, T, state);
    case 'pt-ag': return ptAgMicrostructureSnapshot(diagram, c, state).microstructure;
    case 'fe-c': return ironCarbon(diagram, c, T, state);
  }
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));
function normalized(items: MicrostructureFraction[], note: string): MicrostructureFractions {
  const valid = items
    .filter((item) => isVisibleFraction(item.fraction))
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
  state: PhaseState,
  microstructure: Microstructure,
  note = '当前未跨越形成独立组织组成物的不变量反应，比例按此温度下的平衡相含量显示。',
): MicrostructureFractions {
  const constituentOrder = splitMicrostructureName(microstructure.name);
  const items = state.equilibrium.map((item) => ({
    name: currentNameForPhase(diagram, item.phase, microstructure),
    fraction: item.fraction,
  })).sort((left, right) => {
    const leftIndex = constituentOrder.indexOf(left.name);
    const rightIndex = constituentOrder.indexOf(right.name);
    return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) -
      (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
  });
  return normalized(
    items,
    note,
  );
}

/**
 * 计算当前冷却路径上的组织组成物比例。
 *
 * 液/固两相区直接沿用实时杠杆定律；共晶、共析和铸铁凝固后的比例，
 * 则在对应不变量温度处按组织组成物重新应用杠杆定律。三相反应状态下
 * 三相比例取决于反应进度，因此明确返回空数组，禁止显示虚假的唯一值。
 */
function describeMicrostructureFractionsForState(
  diagram: PhaseDiagramDefinition,
  c: number,
  T: number,
  state: PhaseState,
  microstructure: Microstructure,
): MicrostructureFractions {
  if (state.kind === 'invariant') {
    return { items: [], note: '三相反应进行中，组织比例随反应进度变化，不存在唯一值。' };
  }
  if (diagram.id === 'fe-c' && Math.abs(c - diagram.compositionAxis.max) <= 1e-6) {
    if (microstructure.stage === '渗碳体固相') {
      return {
        items: [{ name: microstructure.name, fraction: 100 }],
        note: 'Fe₃C 化学计量端点在熔点以下为单一渗碳体组织。',
      };
    }
  }

  if (diagram.id === 'pb-sn') {
    const reaction = diagram.invariants[0];
    const { left, middle, right } = reaction.points;
    if (T < reaction.temperature && c >= left && c <= right) {
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
    const belowEutectoid = T < eutectoidReaction.temperature;
    const belowEutectic = T < eutecticReaction.temperature;

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

  return equilibriumFractions(diagram, state, microstructure);
}

/**
 * 单次求值同时生成组织描述与组织含量，保证标题、进度条和 PhaseState 使用同一状态快照。
 */
export function describeMicrostructureSnapshot(
  diagram: PhaseDiagramDefinition,
  composition: number,
  temperature: number,
  resolvedState?: PhaseState,
): MicrostructureSnapshot {
  const fallbackComposition = diagram.defaultState.composition;
  const fallbackTemperature = diagram.defaultState.temperature;
  const requestedComposition = Number.isFinite(composition) ? composition : fallbackComposition;
  const requestedTemperature = Number.isFinite(temperature) ? temperature : fallbackTemperature;
  const c = Math.min(diagram.compositionAxis.max, Math.max(diagram.compositionAxis.min, requestedComposition));
  const T = Math.min(diagram.temperatureAxis.max, Math.max(diagram.temperatureAxis.min, requestedTemperature));
  const state = resolvedState ?? evaluatePhaseState(diagram, c, T);

  if (diagram.id === 'pt-ag') return ptAgMicrostructureSnapshot(diagram, c, state);

  const microstructure = describeBaseMicrostructure(diagram, c, T, state);
  const fractions = describeMicrostructureFractionsForState(diagram, c, T, state, microstructure);
  const alignedMicrostructure = state.kind === 'invariant' || fractions.items.length === 0
    ? microstructure
    : { ...microstructure, name: nameFromConstituents(fractions.items) };
  return { microstructure: alignedMicrostructure, fractions };
}
