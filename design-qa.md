# 共享界面视觉一致性 QA

## 对照信息

- source visual truth:
  - `docs/design-qa-stage-heading-reference.png`
  - `docs/design-qa-panel-heading-reference.png`
  - `docs/design-qa-diagram-selector-request.png`
  - `docs/design-qa-typography-reference.png`
  - `docs/design-qa-selector-content-removal-request.png`
  - `docs/design-qa-selector-icon-reference.png`
  - `docs/design-qa-module-heading-request.png`
  - `docs/design-qa-selector-white-icons-request.png`
  - `docs/design-qa-sidebar-parity-reference.png`
  - `docs/design-qa-sidebar-parity-reference-full.png`
  - `docs/design-qa-current-info-reference.png`
  - `docs/design-qa-current-info-reference-full.png`
  - `docs/design-qa-heading-icons-removal-request.png`
  - `docs/design-qa-right-panel-typography-reference.png`
  - `docs/design-qa-cu-ni-solidus-reference.png`
  - `docs/design-qa-legend-removal-reference.png`
  - `docs/design-qa-invariant-solid-line-reference.png`
  - `docs/design-qa-topbar-actions-reference.png`
  - `docs/design-qa-teaching-card-removal-reference.png`
- implementation screenshots:
  - `docs/design-qa-stage-heading.png`
  - `docs/design-qa-panel-heading.png`
  - `docs/design-qa-diagram-selector.png`
  - `docs/design-qa-typography.png`
  - `docs/design-qa-typography-wide.png`
  - `docs/design-qa-selector-content-removal.png`
  - `docs/design-qa-selector-content-removal-full.png`
  - `docs/design-qa-selector-icon.png`
  - `docs/design-qa-selector-icon-full.png`
  - `docs/design-qa-module-heading.png`
  - `docs/design-qa-module-heading-full.png`
  - `docs/design-qa-selector-white-icons-full.png`
  - `docs/design-qa-sidebar-parity-implementation.png`
  - `docs/design-qa-sidebar-parity-implementation-full.png`
  - `docs/design-qa-current-info-implementation.png`
  - `docs/design-qa-current-info-implementation-full.png`
  - `docs/design-qa-heading-icons-removed.png`
  - `docs/design-qa-heading-icons-removed-full.png`
  - `docs/design-qa-right-panel-typography.png`
  - `docs/design-qa-right-panel-typography-full.png`
  - `docs/design-qa-cu-ni-solidus-implementation.jpg`
  - `docs/design-qa-legend-removal-implementation.jpg`
  - `docs/design-qa-invariant-solid-line-implementation.jpg`
  - `docs/design-qa-topbar-actions-implementation.jpg`
  - `docs/design-qa-teaching-card-removal-implementation.jpg`
- normalized comparison:
  - `docs/design-qa-typography-comparison.png`
  - `docs/design-qa-selector-content-removal-comparison.png`
  - `docs/design-qa-selector-icon-comparison.png`
  - `docs/design-qa-module-heading-comparison.png`
  - `docs/design-qa-sidebar-parity-comparison.png`
  - `docs/design-qa-current-info-comparison.png`
  - `docs/design-qa-heading-icons-removal-comparison.png`
  - `docs/design-qa-right-panel-typography-comparison.png`
  - `docs/design-qa-cu-ni-solidus-comparison.png`
  - `docs/design-qa-legend-removal-comparison.png`
  - `docs/design-qa-invariant-solid-line-comparison.png`
  - `docs/design-qa-topbar-actions-comparison.png`
  - `docs/design-qa-teaching-card-removal-comparison.png`
- source project: `材科基晶体结构部分/crystal-structure-lab`
- implementation project: `材科基二元相图部分/binary-phase-lab`
- viewport: `1280px` 宽；浏览器设备像素比为 `2`
- focused captures:
  - 中央标题栏：`976 × 68` 像素
  - 面板标题栏：`270 × 54` 像素
  - 相图选择区：产品标注截图为 `418 × 1085` 像素，实现区域裁切为 `270 × 281` 像素
  - 字体全景对照：晶体结构与二元相图均为 `1280 × 720` 输出图，对应 `1280 × 720` CSS 视口；源页 DPR 为 `1`、实现页 DPR 为 `2`，浏览器输出已归一为相同像素尺寸
  - 三栏字体复核：二元相图为 `1440 × 900` 输出图，对应 `1440 × 900` CSS 视口、DPR `1`
  - 相图卡片内容精简：实现区域为 `270 × 281` 像素；全页实现图为 `1280 × 720` 像素
  - 相图卡片图标对照：晶体结构基准区域为 `270 × 201` 像素，二元相图实现区域为 `270 × 281` 像素；两者均在 `1280 × 720` CSS 视口下截取
  - 功能模块标题复核：产品截图为 `406 × 55` 像素，实现标题栏为 `268 × 54` 像素；实现来自 `1280 × 720` CSS 视口
  - 四类白色图标复核：产品截图为窄幅图标列；实现使用 `1280 × 720` CSS 视口全页截图，并在浏览器中逐个读取 SVG 路径与计算颜色
  - 侧栏严格一致性复核：晶体结构与二元相图均在 `1280 × 720` CSS 视口、DPR `1` 下截取；对照图将两个 `290 × 710` 侧栏裁切并排放置
  - 当前信息卡复核：晶体结构与二元相图均在 `1280 × 720` CSS 视口下截取；浏览器截图输出已归一为 CSS 像素，两个 `624px` 宽卡片并排对照
  - 实验参数与辅助显示标题复核：产品标注截图按宽度归一到 `290px`，与 `1280 × 720` CSS 视口下的二元相图左栏裁切并排对照
- state: 晶体结构与二元相图的默认页面；二元相图另测试了切换至“Pt–Ag 包晶相图”

## Full-view comparison evidence

完整页面对照确认两项目在 `1280px` 宽度下均使用 `270px + 978px` 两栏布局，栏间距均为 `12px`。顶部品牌标题计算值均为 `25px / 700`。两项目的教学内容与控件数量不同属于预期，不作为视觉偏差。

字体统一复核使用 `docs/design-qa-typography-comparison.png` 将相同视口的晶体结构基准和二元相图实现放在同一张对照图中。选择卡片、功能模块和面板标题的层级一致；`docs/design-qa-typography-wide.png` 进一步确认桌面三栏状态下右侧信息卡没有文字溢出或横向滚动。

## Focused region comparison evidence

中央标题栏计算值一致：

| 项目 | 晶体结构基准 | 二元相图实现 |
|---|---:|---:|
| 标题栏高度 | `68px` | `68px` |
| 左右内边距 | `26px` | `26px` |
| Logo 与文字间距 | `13px` | `13px` |
| Logo 布局尺寸 | `34px` | `34px` |
| Logo 缩放 | `1.45` | `1.45` |
| 标题字号 | `18px` | `18px` |
| 标题字重 | `800` | `800` |

左右面板标题栏计算值一致：

| 项目 | 晶体结构基准 | 二元相图实现 |
|---|---:|---:|
| 标题栏高度 | `54px` | `54px` |
| 左右内边距 | `20px` | `20px` |
| 图标与文字间距 | `8px` | `8px` |
| 图标尺寸 | `18px` | `18px` |
| 标题字号 | `17px` | `17px` |
| 标题字重 | `800` | `800` |

二元相图左栏 4 个 `.panel-heading` 与右栏 4 个 `.card-title` 已逐一读取计算值，全部命中上述标准。

相图卡片内容精简使用 `docs/design-qa-selector-content-removal-comparison.png` 对照产品红框和实现结果：四行体系说明与四个右侧箭头均已删除，四个相图名称和完整卡片点击区域继续保留。

后续图标补充使用 `docs/design-qa-selector-icon-comparison.png` 与晶体结构选择区并排复核。图标尺寸均为 `23px × 23px`，图标与名称间距均为 `10px`；二元相图共有 4 个前置相图图标、4 个标题、0 个说明文字和 0 个额外箭头图标。

最新白色图标复核以 `docs/design-qa-selector-white-icons-request.png` 为产品标注、`docs/design-qa-selector-white-icons-full.png` 为浏览器实现证据。四个 Lucide SVG 的计算颜色在普通和选中状态下均为 `rgb(255, 255, 255)`，并分别使用 `ChartSpline`、`GitMerge`、`ChartNoAxesCombined`、`Network` 四种不同图形。切换至 Pb–Sn 后重新读取，选中项与另外三个未选中项仍全部为白色，页面无横向溢出。

功能模块标题最初使用 `docs/design-qa-module-heading-comparison.png` 复核为 `18px / 800`；本轮按照“全部与晶体结构一致”的最新要求，已进一步归一为晶体结构的 `17px / 800 / 54px`，标题前图标仍保持移除。

最新侧栏严格一致性使用 `docs/design-qa-sidebar-parity-comparison.png` 并排复核。浏览器逐项读取后的计算值如下：

| 项目 | 晶体结构基准 | 二元相图实现 |
|---|---:|---:|
| 侧栏标题 | `17px / 800 / 54px` | `17px / 800 / 54px` |
| 标题左右内边距 | `20px` | `20px` |
| 选择项文字 | `14px / 780` | `14px / 780` |
| 选择项图标 / 图文间距 | `23px / 10px` | `23px / 10px` |
| 选择卡片高度 / 内边距 / 圆角 | `56px / 6px 8px / 7px` | `56px / 6px 8px / 7px` |
| 选择列表内边距 / 行间距 | `12px 14px 0 / 8px` | `12px 14px 0 / 8px` |
| 功能模块文字 | `16px` | `16px` |
| 功能模块行高 / 图标 | `54px / 22px` | `54px / 22px` |
| 模块图文间距 / 左右内边距 | `12px / 12px` | `12px / 12px` |
| 模块列表内边距 / 行圆角 | `8px 12px 10px / 6px` | `8px 12px 10px / 6px` |
| 面板纵向间距 | `12px` | `12px` |

当前信息卡使用 `docs/design-qa-current-info-comparison.png` 并排复核。两套页面的标题栏均为 `17px / 800 / 54px`、左右内边距 `20px`，标题前 SVG 数量均为 `0`。内容区均采用 `minmax(138px, 45%) minmax(0, 1fr)` 两列、`18px 24px 25px` 内边距、`53px` 行高、`15px / 1.45` 字体；标签为 `#c7d3e1 / 650`，数值为 `#f1f6ff / 700`。二元相图比晶体结构少一行数据，因此卡片总高度更短，属于内容数量差异而非样式偏差。相区值继续使用业务蓝色强调。

标题图标移除使用 `docs/design-qa-heading-icons-removal-comparison.png` 对照产品红框与实现结果。浏览器检查确认 `.parameter-panel .panel-heading svg` 和 `.display-panel .panel-heading svg` 均为 `0`；两个标题仍保持 `17px / 800 / 54px`、`0 20px` 内边距，下方滑块、数值输入和三个辅助开关未发生结构变化。

面板内容字体计算值：

| 内容层级 | 晶体/三元基准 | 二元相图实现 |
|---|---:|---:|
| 选择卡片标题 | `14px / 780` | `14px / 780` |
| 选择卡片图标 | 晶体结构 `23px / 10px gap` | `23px / 10px gap` |
| 选择卡片辅助说明 | 产品要求移除 | 已移除 |
| 功能模块文字 | `16px` | `16px` |
| 参数标签 | 三元相图 `13px` | `13px` |
| 参数辅助说明 | 三元相图 `11px` | `11px / 1.45` |
| 辅助显示开关 | 晶体结构 `14px` | `14px` |
| 当前信息名称与数值 | 晶体结构 `15px / 1.45` | `15px / 1.45` |
| 相平衡说明/相名称 | `13px / 15px` | `13px / 15px` |
| 普通反应首行/说明 | 晶体结构教学正文 `15px / 1.9` | `15px / 1.9` |
| 教学解析正文 | 晶体结构 `15px / 1.9` | `15px / 1.9` |

相图选择区按产品标注移除了两类装饰内容：

- “相图类型”标题前的图标已移除，标题文本和标题栏尺寸保持不变。
- 四个相图卡片左侧的元素缩写与连线已移除，卡片改为“名称与说明 + 右侧箭头”两列布局。
- 浏览器检查确认 `.selection-panel .panel-heading svg` 和 `.diagram-symbol` 的数量均为 `0`，切换至 Pb–Sn 后选中状态与中央相图联动正常。

## Required fidelity surfaces

- Fonts and typography: 顶部品牌、中央标题、选择卡片、功能模块、参数标签、辅助开关、右侧信息与教学正文均已按晶体结构和三元相图的同级文字统一；侧栏所有标题现在统一采用晶体结构的 `17px / 800`。
- Spacing and layout rhythm: 三栏比例、中央标题栏、左右面板标题栏保持一致；相图选择卡片和功能模块的行高、内边距、图标尺寸、图文间距、列表留白、圆角与面板间距均逐项命中晶体结构计算值。
- Colors and visual tokens: 标题前景色、面板背景和底部分隔线继续沿用相同全局变量；相图选择图标由 `--lab-selector-icon-color: #fff` 统一控制，普通与选中状态无色差。
- Image quality and asset fidelity: 两项目使用同一品牌 Logo 资产；布局尺寸、缩放和阴影一致。相图选择卡片使用四种不同的 Lucide 标准线性 SVG 图标，尺寸和间距与晶体结构选择图标一致；按产品要求移除“功能模块”标题前图标，未使用图片贴图或占位资产。
- Copy and content: 二元相图保留相图名称、功能模块和信息卡业务文案；按产品标注明确移除选择卡片的体系说明与右侧箭头，不影响右栏“体系类型”信息。当前信息五个标签已按晶体结构格式补齐中文冒号，标题前装饰图标已移除。
- Cu–Ni 固相线曲率：两端继续固定在 Cu `1085℃` 与 Ni `1455℃`；`50% Ni` 处由 `1235.3℃` 调整为 `1177.5℃`，相对两端连线中点的下凹量由 `34.7℃` 增至 `92.5℃`。`docs/design-qa-cu-ni-solidus-comparison.png` 显示实现曲线已接近产品红线标注的明显下凹走势，且相区闭合、文字、颜色和交互布局未改变。
- 相图顶部图例：按产品红框要求从共享 SVG 中整体删除，Cu–Ni、Pt–Ag、Pb–Sn、Fe–Fe₃C 四套相图浏览器实测 `.phase-legend` 数量均为 `0`；预设编号、坐标轴和相区标签继续保留。
- 相标记上下标：`Ⅰ / Ⅱ / Ⅲ` 统一使用下角标排版。HTML 中为语义化 `<sub>`（计算值 `vertical-align: sub`），SVG 组织标注中为 `<tspan baseline-shift="sub">`；浏览器检查 Fe–Fe₃C 组织视角共命中 7 个 SVG 下角标，二次渗碳体说明中的 `Fe₃CⅡ` 也正确下沉。
- 三相反应线：共享 `.invariant-line` 基础样式由虚线改为实线，高亮态继续保持实线与加粗发光。浏览器逐图计算样式确认 Pt–Ag 的 1 条、Pb–Sn 的 1 条、Fe–Fe₃C 的 3 条反应线均为 `stroke-dasharray: none`；Cu–Ni 没有三相反应，因此无反应线。红色成分垂线与青色等温辅助线继续保留虚线。
- 顶栏操作：因首页尚未完成，暂时移除“返回首页”链接和对应未使用的 `home` 图标；“重置实验”改名为“重置相图”。桌面与移动布局均只保留“重置相图 / 自动凝固”两项操作，没有留下占位或横向溢出。
- 右栏信息架构：教学解析卡已删除；“显微组织及相对含量”从左栏功能入口迁移为右栏常驻卡片，位于“相平衡”下方、“反应信息”上方。卡片同时显示冷却阶段、当前显微组织、组织相对含量条和组织形成过程。
- 功能模块精简：左栏移除“相图结构”“冷却过程”“金相显微组织”三个入口，仅保留“杠杆定律”和“三相反应”。相图结构继续常驻中央画布，自动凝固继续由顶栏按钮启动，因此没有删除底层能力。
- 组织相对含量：Cu–Ni 和反应前状态使用实时相平衡比例；Pb–Sn 在共晶温度处按初生相/共晶组织应用杠杆关系；Fe–Fe₃C 按共析或共晶温度计算先共析组织、珠光体、莱氏体及一次/二次渗碳体。三相反应进行中明确提示比例随反应进度变化，不显示虚假的唯一比例。

## Comparison history

1. 中央标题栏修复前：二元相图为 `16px / 700`、高 `62px`、内边距 `18px`、间距 `10px`、Logo `31px`。
2. 中央标题栏修复后：已同步为 `18px / 800`、高 `68px`、内边距 `26px`、间距 `13px`、Logo `34px`。
3. 面板标题栏修复前：二元相图为 `14px / 800`、高 `45px`、内边距 `15px`、图标 `17px`。
4. 面板标题栏修复后：已同步为 `17px / 800`、高 `54px`、内边距 `20px`、图标 `18px`，并统一应用到左右两栏。
5. 交互复核：切换到“Pt–Ag 包晶相图”后，4 个左栏标题仍保持 `54px / 17px`；重新载入无控制台错误。
6. 相图选择区收尾：移除标题图标和四行元素缩写/连线，卡片文本自动扩展；切换 Pb–Sn 后选中状态、标题联动和控制台均正常。
7. 内容字体统一：选择卡片从 `13px/10px` 调整为 `14px/11px`，参数标签从 `12px` 调整为 `13px`，辅助开关从 `12px` 调整为 `14px`，右栏信息与教学正文从 `12px` 调整为 `15px`；相同视口对照后无文字截断，切换 Pt–Ag 后标题联动正常，控制台无错误。
8. 相图卡片内容精简：删除四行体系说明与右侧箭头，只保留 `14px / 780` 的相图名称；切换 Pb–Sn 后选中状态与中央标题正确联动，控制台无错误、页面无横向溢出。
9. 相图卡片图标补充：按最新要求在四个相图名称前加入现有 `diagram` 图标，统一为 `23px`、间距 `10px`，仍不恢复体系说明与右侧箭头；切换 Pb–Sn 后联动正常，控制台无错误。
10. 功能模块标题收尾：删除标题前图标，并将该标题从通用 `17px` 调整为三元相图专项标准 `18px / 800`；浏览器计算值命中，标题栏无溢出，控制台无错误。
11. 相图图标颜色与语义收尾：将四个重复的青色 `diagram` 图标拆为四种不同的 Lucide 标准图标，并用主控变量统一为纯白色；默认状态和切换 Pb–Sn 后均确认四项颜色为 `rgb(255, 255, 255)`，图形互不相同，控制台无 error/warning，页面无横向溢出。
12. 侧栏密度严格统一：将选择卡片由 `49px` 调整为 `56px`、卡片间距由 `5px` 调整为 `8px`；将功能模块标题由 `18px` 调整为 `17px`、模块行由 `40px` 调整为 `54px`、图标由 `18px` 调整为 `22px`，并同步列表内边距、图文间距、行内边距、圆角与阴影。`1280 × 720` 同视口计算值逐项一致；切换 Pb–Sn 与“冷却过程”正常，控制台无 error/warning、页面无横向溢出。
13. 当前信息卡严格统一：删除标题前 `info` 图标，内容区由 `38% / 9px 17px 13px / 35px` 调整为晶体结构的 `45% / 18px 24px 25px / 53px`，同步标签与数值颜色、字重和中文冒号。默认 Cu–Ni 与最长文案 Fe–Fe₃C 状态均无截断、无横向溢出，控制台无 error/warning。
14. 左侧标题图标收尾：按产品标注删除“实验参数”前的 `settings` 图标和“辅助显示”前的 `info` 图标；标题文字、`17px / 800 / 54px` 层级、标题栏内边距与下方控件保持不变。
15. 右栏业务卡片收尾：删除“相平衡”“反应信息”“教学解析”标题前的 SVG 图标；浏览器确认右栏四个 `.card-title` 的 `svgCount` 均为 `0`，标题继续保持 `17px / 800 / 54px / 0 20px`。反应信息与教学解析内容区统一采用晶体结构教学卡的 `22px 24px 0` 内边距、`22px` 卡片底部留白、`#d8e4f2` 文字色与 `15px / 1.9` 正文层级；三相反应激活时的 `18px` 公式强调继续保留。`1440 × 900` 实测无横向溢出，右栏滚动后所有正文完整可见。
16. Cu–Ni 固相线曲率收尾：保持两个纯组元端点不变，重新布置固相线控制点，使曲线温度严格递增、分段斜率严格递增，并将中点下凹量锁定为至少 `90℃`。本地浏览器默认状态与 B30 预设交互均正常，无 error/warning；对照图确认曲线不再接近直线。
17. 图例与相标记收尾：删除共享 `PhaseDiagramSvg` 顶部颜色图例，四套相图逐一切换后均确认图例节点不存在；新增统一相标记渲染器，将 `αⅡ`、`βⅡ`、`Fe₃CⅠ/Ⅱ/Ⅲ` 的罗马数字显示为下角标。Pt–Ag 与 Fe–Fe₃C 实际页面无布局异常，控制台无 error/warning。
18. 三相反应线收尾：按产品红框将非激活状态的包晶、共晶、共析水平线从 `7 5` 虚线改为实线；高亮态样式不变。四套相图逐一切换验证，所有实际存在的反应线计算值均为 `none`，页面控制台无 error/warning。
19. 顶栏操作收尾：删除“返回首页”入口并将重置按钮文案改为“重置相图”。浏览器检查旧链接与旧文案数量均为 `0`、新按钮数量为 `1`；从 B10 白铜预设点击重置后正确恢复到 `40.0% Ni / 1260℃`，控制台无 error/warning。
20. 教学解析卡收尾：从 `InfoPanel` 删除“教学解析”卡片并清理对应 CSS。浏览器确认“教学解析”标题数量为 `0`，“当前信息 / 相平衡 / 反应信息”均各保留 `1` 个；右栏自然收紧且控制台无 error/warning。
21. 显微组织信息架构收尾：左侧“功能模块”浏览器实测只剩“杠杆定律 / 三相反应”，旧“相图结构 / 冷却过程 / 金相显微组织”入口均不再渲染；右栏新增“显微组织及相对含量”常驻卡片。Pb–Sn `80% Sn / 120℃` 显示“初生β相 50.8% +（α+β）共晶组织 49.2%”，Fe–Fe₃C `0.45% C / 650℃` 显示“先共析铁素体 42.8% + 珠光体 57.2%”，两组均合计 `100.0%`。页面无横向溢出，控制台无 error/warning。
22. 反应信息按需显示：普通单相区与两相区不再渲染“当前无三相反应”占位卡；只有状态点同时命中三相反应温度及其适用成分区间时，右栏才插入“反应信息”卡并显示反应式、反应温度和反应类型。离开反应线后卡片即时移除，右栏其余卡片自然上移。
23. 典型合金预设位置调整：预设按钮从“辅助显示”内容区移出，改为独立的“典型合金预设”面板，固定排列在“相图类型”下方、“功能模块”上方。四套相图切换后预设内容随相图同步更新；移动端选中预设后自动收起该面板，成分与温度联动保持不变。
24. Fe–Fe₃C 低碳端组织标注：成分轴改为标明“低碳端局部放大”的分段比例尺，0–0.10% C 区间获得足够显示宽度；新增 `F + Fe₃CⅢ` 引线标注。浏览器实测该标注在绘图区内且与其他组织文字零重叠；H(0.09)、J(0.17)、B(0.53) 的横坐标保持严格递增，高温 δ、L+δ、δ+A 区均由同一真实成分映射绘制。页面无横向溢出，控制台无 error/warning。
25. Cu–Ni 两相区宽度调整：以两端熔点连线为中心，将液相线和固相线的曲率偏移同比缩放至上一版的 70%。50% Ni 处由 `1362.5℃ / 1177.5℃` 调整为 `1334.75℃ / 1205.25℃`，L+α 温差由 `185℃` 精确收窄为 `129.5℃`；Cu/Ni 两端熔点、曲线对称性和全成分范围相界顺序保持不变。
26. 参数控制信息架构：删除独立“实验参数”面板，改名为“合金成分与温度控制”并作为子区块并入“功能模块”。成分滑块、温度滑块、数值输入、范围限制及手动操作暂停冷却的原有逻辑保持不变。
27. Fe–Fe₃C 比例尺回退：按产品决定取消低碳端局部放大，恢复 `0–6.69% C` 全轴线性成分坐标和原刻度。`F + Fe₃CⅢ` 组织标注、区域锚点与引线保留，并针对线性坐标下的窄区将文字略向上调整，避免与 `F + P` 同行挤压。
28. Cu–Ni 相区标签位置：将 `L + α` 标签由 `[53%, 1330℃]` 下移到 `[53%, 1280℃]`，使文字位于透镜两相区的垂直中部。回归测试要求标签与液相线、固相线分别保持超过 `40℃` 的留白。
29. 当前信息精简：从右栏“当前信息”中删除“自由度”名称与数值，卡片恢复为当前相图、体系类型、合金成分、当前温度、当前相区五行。相律纯函数与测试保留，本次仅移除界面展示。
30. Fe–Fe₃C 低碳区相标注：将 `α` 单相区引线文字再向下移 `14px`；将 `α + γ` 标签锚点由 `[0.18% C, 800℃]` 调整至接近该三角相区几何中心的 `[0.27% C, 790℃]`。相界、相区轮廓和计算数据不变。
31. Fe–Fe₃C 组织标注避让：保留 `F + Fe₃CⅢ` 组织标注位置，将 P 点文字从 727℃ 水平线下方移至点位右上方，通过引线与 P 点关联。新增包围盒回归测试，要求 P 点文字与所有组织标注均不重叠。
32. Fe–Fe₃C 组织标注最终收尾：独立浏览器包围盒复核发现 `F + Fe₃CⅢ` 与 `F + P` 尚有约 `18.2 × 3.2px` 的轻微擦碰；保留窄区引线标注，将 `F + P` 由 `628℃` 下移至 `610℃`。回归测试扩展为所有组织标签两两检查，不再只检查 P 点文字。

## Findings

无剩余 P0、P1 或 P2 视觉偏差。

## Follow-up polish

无必须跟进的 P3 项。

final result: passed
