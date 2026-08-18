# 材科基实验室界面主控参数

本文档是二元相图实验室与晶体结构、三元相图实验室保持视觉一致时的主控格式说明。运行时数值集中定义在 `src/styles.css` 末尾的 `:root` 主控变量中；本文档负责说明各参数的用途、标准值和响应式规则。

## 1. 基准与适用范围

- 视觉基准：`材科基晶体结构部分/crystal-structure-lab/src/styles.css`。
- 适用区域：页面外框、顶部品牌栏、顶部操作区、三栏工作区、中央内容标题栏、左右两侧面板标题栏，以及面板内部的通用文字层级。
- 二元相图专属的相图绘制、相区颜色、坐标轴和数据面板不受本文档控制。
- 禁止通过 `zoom` 或对页面根节点使用 `transform: scale()` 调整整体大小；页面缩放只依靠浏览器缩放和响应式断点。

## 2. 页面外框与顶部品牌栏

| 主控变量 | 标准值 | 用途 |
|---|---:|---|
| `--lab-shell-padding` | `10px` | 页面四周留白 |
| `--lab-shell-gap` | `12px` | 顶栏与工作区间距 |
| `--lab-topbar-height` | `96px` | 桌面端顶部品牌栏高度 |
| `--lab-topbar-column-gap` | `28px` | 品牌区与操作区间距 |
| `--lab-topbar-padding-y` | `12px` | 顶栏上下内边距 |
| `--lab-topbar-padding-x` | `24px` | 顶栏左右内边距 |
| `--lab-brand-gap` | `14px` | 品牌 Logo 与文字间距 |
| `--lab-brand-logo-size` | `54px` | 品牌 Logo 布局尺寸；图片内部继续使用 `scale(1.55)` |
| `--lab-brand-title-size` | `25px` | 顶部主标题字号 |
| `--lab-brand-title-weight` | `700` | 顶部主标题字重 |
| `--lab-brand-subtitle-size` | `13px` | 交流群副标题字号 |
| `--lab-brand-subtitle-weight` | `600` | 交流群副标题字重 |

顶部主标题统一使用 `line-height: 1.1`、`letter-spacing: 0`。副标题与主标题之间的上间距固定为 `7px`。

## 3. 顶部操作区

| 主控变量 | 标准值 | 用途 |
|---|---:|---|
| `--lab-action-gap` | `14px` | 操作按钮之间的间距 |
| `--lab-action-height` | `48px` | 操作按钮最小高度 |
| `--lab-action-icon-size` | `28px` | 操作图标尺寸 |
| `--lab-action-text-size` | `16px` | 操作文字字号 |

操作文字字重固定为 `700`，图标与文字间距固定为 `10px`，按钮左右内边距固定为 `15px`。

## 4. 三栏工作区比例

桌面端统一使用：

```css
grid-template-columns:
  clamp(290px, 20vw, 400px)
  minmax(520px, 1fr)
  clamp(340px, 24vw, 470px);
gap: 12px;
```

对应主控变量：

| 主控变量 | 标准值 | 用途 |
|---|---:|---|
| `--lab-left-column` | `clamp(290px, 20vw, 400px)` | 左侧控制栏 |
| 中央栏 | `minmax(520px, 1fr)` | 主实验视区，吸收剩余宽度 |
| `--lab-right-column` | `clamp(340px, 24vw, 470px)` | 右侧信息栏 |
| `--lab-workspace-gap` | `12px` | 三栏间距 |

## 5. 中央内容标题栏

| 主控变量 | 标准值 | 用途 |
|---|---:|---|
| `--lab-stage-heading-height` | `68px` | 中央标题栏高度 |
| `--lab-stage-heading-padding-x` | `26px` | 标题栏左右内边距 |
| `--lab-stage-heading-gap` | `13px` | Logo 与标题间距 |
| `--lab-stage-logo-size` | `34px` | 标题栏 Logo 布局尺寸；图片内部使用 `scale(1.45)` |
| `--lab-stage-title-size` | `18px` | 中央标题字号 |
| `--lab-stage-title-weight` | `800` | 中央标题字重 |

标题栏底部分隔线从左右各缩进 `24px`，颜色由 `rgba(139, 164, 194, 0.16)` 向透明渐变。标题栏不显示副标题。

## 6. 左右面板标题栏

`.panel-heading` 和 `.card-title` 必须共用同一组主控参数，分别覆盖左侧控制面板标题和右侧信息卡标题，禁止只调整单个面板。

| 主控变量 | 标准值 | 用途 |
|---|---:|---|
| `--lab-panel-heading-height` | `54px` | 面板标题栏最小高度 |
| `--lab-panel-heading-padding-x` | `20px` | 面板标题栏左右内边距 |
| `--lab-panel-heading-gap` | `8px` | 标题图标与文字间距 |
| `--lab-panel-heading-icon-size` | `18px` | 标题图标宽高 |
| `--lab-panel-heading-font-size` | `17px` | 面板标题字号 |
| `--lab-panel-heading-font-weight` | `800` | 面板标题字重 |
| `--lab-module-heading-font-size` | `17px` | “功能模块”标题字号；严格对齐晶体结构侧栏标题 |

标题内容垂直居中，标题栏宽度为 `100%`，底部分隔线沿用全局 `--line`，背景保持透明。所有侧栏标题统一采用晶体结构的 `17px / 800 / 54px` 标准。“相图类型”“功能模块”“实验参数”“辅助显示”，以及右栏“当前信息”“相平衡”“反应信息”“教学解析”标题均不显示前置图标。

## 7. 面板内容字体层级

面板内部文字以晶体结构实验室为主要基准；晶体结构中没有对应控件时，采用三元相图实验室的同级参数文字。业务数据、化学式和反应式的强调色不在本节调整范围内。

| 主控变量 | 标准值 | 用途与基准 |
|---|---:|---|
| `--lab-selector-title-size` | `14px` | 相图选择卡片标题；对齐晶体结构与三元相图的一级选项 |
| `--lab-selector-title-weight` | `780` | 相图选择卡片标题字重 |
| `--lab-selector-icon-size` | `23px` | 相图选择卡片图标宽高；对齐晶体结构选择图标 |
| `--lab-selector-icon-color` | `#fff` | 相图选择图标颜色；普通与选中状态统一为纯白色 |
| `--lab-selector-gap` | `10px` | 选择图标与相图名称之间的间距 |
| `--lab-selector-panel-padding-bottom` | `13px` | 相图选择面板底部留白；对齐晶体结构选择面板 |
| `--lab-selector-list-padding` | `12px 14px 0` | 相图列表内边距；对齐晶体结构类别列表 |
| `--lab-selector-list-gap` | `8px` | 相图选择卡片纵向间距 |
| `--lab-selector-card-height` | `56px` | 相图选择卡片实际高度 |
| `--lab-selector-card-padding` | `6px 8px` | 相图选择卡片内边距 |
| `--lab-selector-card-radius` | `7px` | 相图选择卡片圆角 |
| `--lab-module-text-size` | `16px` | 功能模块主文字；对齐晶体结构模块文字 |
| `--lab-module-list-padding` | `8px 12px 10px` | 功能模块列表内边距 |
| `--lab-module-row-height` | `54px` | 功能模块单行高度 |
| `--lab-module-row-columns` | `28px minmax(0, 1fr)` | 功能模块图标列与文字列 |
| `--lab-module-row-gap` | `12px` | 功能模块图标与文字间距 |
| `--lab-module-row-padding-x` | `12px` | 功能模块单行左右内边距 |
| `--lab-module-row-radius` | `6px` | 功能模块选中背景圆角 |
| `--lab-module-icon-size` | `22px` | 功能模块图标宽高 |
| `--lab-control-label-size` | `13px` | 实验参数名称与当前值；对齐三元相图控制标签 |
| `--lab-control-helper-size` | `11px` | 参数单位、范围和成分方向说明 |
| `--lab-toggle-text-size` | `14px` | 辅助显示开关；对齐晶体结构开关文字 |
| `--lab-info-text-size` | `15px` | 右栏当前信息名称、数值和相区；对齐晶体结构信息表 |
| `--lab-info-grid-columns` | `minmax(138px, 45%) minmax(0, 1fr)` | 当前信息标签列与数值列比例 |
| `--lab-info-grid-padding` | `18px 24px 25px` | 当前信息内容区内边距 |
| `--lab-info-row-height` | `53px` | 当前信息每行最小高度 |
| `--lab-info-label-color` | `#c7d3e1` | 当前信息标签文字颜色 |
| `--lab-info-value-color` | `#f1f6ff` | 当前信息数值文字颜色 |
| `--lab-info-label-weight` | `650` | 当前信息标签字重 |
| `--lab-info-value-weight` | `700` | 当前信息数值字重 |
| `--lab-balance-meta-size` | `13px` | 相平衡卡中的平衡成分说明与百分比 |
| `--lab-balance-value-size` | `15px` | 相平衡卡中的相名称 |
| `--lab-reaction-title-size` | `15px` | 非激活状态的反应信息首行；对齐晶体结构教学正文 |
| `--lab-reaction-detail-size` | `15px` | 反应说明和三相提示正文；对齐晶体结构教学正文 |
| `--lab-teaching-text-size` | `15px` | 教学解析正文；对齐晶体结构教学正文 |

补充规则：相图选择卡片只显示小型相图图标与相图名称，不显示体系说明或右侧箭头。四种相图分别使用不同的 Lucide 白色线性图标：Cu–Ni 使用 `ChartSpline`、Pt–Ag 使用 `GitMerge`、Pb–Sn 使用 `ChartNoAxesCombined`、Fe–Fe₃C 使用 `Network`；普通与选中状态均保持纯白色。选择卡片和功能模块的高度、内边距、图标尺寸、文字间距、圆角与列表留白均严格采用晶体结构侧栏的计算值。卡片标题统一使用 `line-height: 1.35`。当前信息标题不显示前置图标，标题栏、两列比例、内容内边距、每行高度、字号、字重、颜色与标点均严格采用晶体结构当前信息卡标准；相区值的蓝色属于业务强调，继续保留。反应信息与教学解析内容区统一采用晶体结构教学卡的 `22px 24px 0` 内边距、`22px` 卡片底部留白、`15px / 1.9` 正文字号与行高及 `#d8e4f2` 文字色。三相反应被激活时的 `18px` 公式属于业务强调状态，继续保留，不降为普通正文字号。

## 8. 响应式与缩放规则

| 断点 | 布局规则 |
|---:|---|
| `> 1280px` | 三栏布局，顶栏单行，采用全部桌面主控值 |
| `≤ 1280px` | 左栏 `270px` + 中央栏，右栏移到下一行并分为两列 |
| `≤ 820px` | 单列布局；顶部操作区三等分；右栏改为单列 |
| `≤ 520px` | 品牌 Logo 缩为 `34px`；顶部操作图标缩为 `18px`，文字缩为 `12px` |

浏览器应以 `100%` 缩放作为视觉验收基准。同一台设备对比三个实验室时，需要确认各本地地址没有保存不同的站点缩放倍率。

## 9. 修改约束

1. 需要统一修改尺寸时，优先修改 `src/styles.css` 中的主控变量，不要在组件选择器中新增重复数值。
2. 修改主控变量后，同步更新本文档，并在相同浏览器、相同视口、`100%` 缩放下对照晶体结构实验室。
3. 不得为了适配单个截图改变三栏比例；响应式变化必须通过上述断点完成。
4. 通用文字层级必须引用第 7 节的主控变量；只影响二元相图自身的相图标注、坐标文字或反应强调状态应继续保留在对应组件样式中，不应加入共享主控区。
