# dsh-warm-theme

DSH 护眼配色主题包 —— 5 套低蓝光配色，通过官方 `ctx.theme.overrideTokens()` 扩展点覆盖语义 token。

**零布局改动 · 热生效 · 卸载即可还原。**

## 配色

| id | 名称 | 底色 | 特点 |
|---|---|---|---|
| `paper` | 暖纸 Warm Paper | `#f6f1e7` | 纸质书感，降蓝光最多 |
| `sepia` | 柔褐书页 Old Book | `#f2e8d5` | 旧书页黄，层次分明 |
| `tea` | 茶褐 Tea Brown | `#f1e9e4` | 偏红暖棕，最浓郁 |
| `olive` | 橄榄静绿 Quiet Olive | `#eff2e6` | 最低存在感，最专注 |
| `mist` | 雾蓝 Mist Blue | `#eef1f4` | 唯一冷调，最清醒 |

每套覆盖 31 个 `--dsw-alias-*` 语义 token（浅/深各一组值），其余 token 沿用 DSH 内置值。

其中 22 个是手工调校的基础色（画布、层次、文字、边框、链接、代码块），
另 9 个由基础色**派生**（见 `lib/palettes.js` 末尾的派生层），专门处理两类
容易被忽略、但一旦不同调就很显眼的地方：

| 派生 token | 用途 | 为什么必须派生 |
|---|---|---|
| `interactive-bg-hover` / `-active` / `-hover-accent` | 悬停、选中的叠加底色 | 内置是冷蓝灰 `#263148`，叠在暖底上会发灰（实测色相差最高 9°）；改用本套文字色做叠加源后归零 |
| `interactive-bg-hover-solid` | 不透明的悬停底 | 需与浅色第三层同调 |
| `interactive-bg-hover-danger` | 危险操作的悬停态 | 保留红调但压暗，避免在暖底上刺眼 |
| `toast-bg` / `toast-label` | 右下角通知浮层 | 内置是冷灰 `#353638`，与暖色主题割裂 |
| `tooltip-bg` / `tooltip-key-bg` | 悬停提示气泡 | 同上，内置冷灰 `#2c2c2e` |

### 对比度

全部 10 种组合（5 套 × 浅/深）的 5 个角色均 ≥ 4.5:1（WCAG AA），正文 ≥ 10.6:1（AAA）：

| 方案 | 模式 | 正文 | 次要 | 三级 | 强调 | 链接 |
|---|---|---|---|---|---|---|
| 暖纸 | 浅 / 深 | 11.06 / 13.47 | 5.39 / 7.54 | 5.11 / 4.87 | 5.12 / 7.27 | 4.55 / 7.27 |
| 柔褐书页 | 浅 / 深 | 11.72 / 13.37 | 6.03 / 7.37 | 5.09 / 4.69 | 4.81 / 7.15 | 4.86 / 7.15 |
| 橄榄静绿 | 浅 / 深 | 11.36 / 13.85 | 5.48 / 8.13 | 4.62 / 5.18 | 4.84 / 8.06 | 5.61 / 8.06 |
| 茶褐 | 浅 / 深 | 10.67 / 13.41 | 6.21 / 7.26 | 4.59 / 4.61 | 5.33 / 6.11 | 5.16 / 6.11 |
| 雾蓝 | 浅 / 深 | 11.28 / 13.91 | 6.59 / 8.43 | 4.86 / 5.58 | 6.11 / 7.31 | 6.11 / 7.31 |

## 使用

安装后进入 **设置 → 通用 → 配色主题**，点选即可，立即生效并跨重启保留。
选「跟随内置」即恢复 DSH 原生配色。

## 工作原理

DSH 的主题系统把「第三方主题」设计成一个扩展点：

```
ctx.theme.overrideTokens(source, { '--dsw-alias-bg-base': { light, dark }, ... })
```

- 覆盖层是 **token 级**的，按注册顺序折入活动主题；**不修改内置主题**。
- 返回 disposer：本包在切换时会先撤销旧层再叠新层，保证任何时刻最多只贡献一层。
- 插件卸载时自动移除覆盖层，不会留下污染。

本包因此不需要重建前端、不需要 fork、也不受 DSH 升级影响。

## 开发

```sh
node build.mjs      # 把 palettes.js 与 styles.css 内联进 lib/client.js
node test/smoke.mjs # 冒烟测试：mock DSH 运行时，验证注入层与卸载行为
```

`lib/client.src.js` 是源码模板（含 `__PALETTES__` / `__CSS__` 占位符），
`lib/client.js` 是构建产物，即 DSH 实际加载的文件。

## 已知限制

- **不改变布局**：只覆盖颜色与材质 token。侧边栏位置、composer 结构等需 fork
  `dsh-web-frontend` 重建，不在本包范围内。
  （唯一例外是 macOS 侧栏底色，见下。）
- **不做完整性校验**：按官方说明，注册主题意味着覆盖同名别名变量，运行时不会
  校验一组覆盖是否完整。本包覆盖 41 个 token：22 个手调 + 19 个派生
  （含 10 个 `--dsw-specific-*`）。
- **持久化用 localStorage**：未走 Host settings API，因此不参与 DSH 的设置同步；
  无痕模式下降级为仅当前进程生效。

### macOS 侧边栏底色（唯一的非 token 例外）

ui-sidebar 的根容器本来写了 `background: var(--dsw-specific-sidebar-fill)`，
但紧接着有一条平台覆盖把它置空：

```css
[data-platform=darwin] .<hash>_root { background: 0 0 }
```

于是 macOS 上侧栏透明，透出 ui-layout 的 `._<hash>_frame`
（`background: var(--dsw-alias-bg-base)`）—— 与正文区同色。
这是 DSH 在 macOS 上的原生设计：侧栏与正文同底，靠边框分隔。
Windows 则走另一条分支（frame 用 sidebar-fill），天然两段式。

本包用一条 CSS 规则给 macOS 补上同类效果：

```css
div:has(> [data-window-drag]):not([data-window-drag]) {
  background: var(--dsw-specific-sidebar-fill);
}
```

两个包都用 CSS Modules、类名带构建哈希，无法直接引用；因此改用 ui-sidebar
在侧栏根容器内渲染的稳定标记 `data-window-drag`（macOS 标题栏拖拽区，**仅在
macOS 渲染**，且是侧栏根的直接子元素）反查父容器。

**失效行为**：若 DSH 升级后该属性改名，本规则静默失效，侧栏回落到原生同色 ——
不报错、不影响任何其它样式。

## 许可

MIT
