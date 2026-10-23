// ============================================================
// dsh-warm-theme 冒烟测试
// 用 mock 的 window.__ModuleLoader__ + ctx 加载真实产物 lib/client.js，
// 断言：注入层正确、切换会替换而非叠加、卸载会还原、持久化生效。
// ============================================================

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const code = readFileSync(join(root, 'lib/client.js'), 'utf8')

// ---- mock 环境 ----
let loaded = null
const storage = new Map()
const headChildren = []

// 最小 DOM：只实现插件真正用到的 createElement/appendChild/removeChild
function makeEl(tag) {
  return {
    tagName: tag,
    attrs: {},
    textContent: '',
    parentNode: null,
    setAttribute(k, v) { this.attrs[k] = v },
    getAttribute(k) { return this.attrs[k] },
    get parentNode() { return this._parent || null },
    set parentNode(p) { this._parent = p },
  }
}
globalThis.document = {
  head: {
    appendChild(el) { el._parent = this; headChildren.push(el); return el },
    removeChild(el) {
      const i = headChildren.indexOf(el)
      if (i >= 0) headChildren.splice(i, 1)
      el._parent = null
      return el
    },
  },
  createElement: makeEl,
}

globalThis.window = {
  __ModuleLoader__: {
    load({ id, factory }) {
      loaded = { id, exports: factory(makeRequire()) }
    },
  },
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  },
}

function makeRequire() {
  return (name) => {
    if (name === 'react') {
      return {
        createElement: (t, p, ...c) => ({ type: t, props: p, children: c }),
        useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
        useEffect: () => {},
      }
    }
    // 极简 defineStore：只要能按契约返回 store 句柄即可
    if (name === '@deepseek-ai/dsh-client-store') {
      return {
        defineStore: ({ init, actions }) => {
          const state = init()
          const bound = {}
          for (const [k, fn] of Object.entries(actions || {})) {
            bound[k] = (...args) => fn(state, ...args)
          }
          return { state, ...bound }
        },
      }
    }
    throw new Error('unexpected require: ' + name)
  }
}

// ---- mock ctx ----
const layers = []            // 记录每次 overrideTokens 的调用与撤销
const registered = []        // 记录 slot 注册
const effects = []           // 记录 ctx.effect 的 disposer
const localeRegs = []

const ctx = {
  theme: {
    overrideTokens(source, tokens) {
      const rec = { source, tokens, disposed: false }
      layers.push(rec)
      return () => { rec.disposed = true }
    },
  },
  slots: {
    inject(slot, fn) { fn() },
    register(def, comp) { registered.push({ def, comp }); return () => {} },
  },
  locale: {
    register(ns, dicts) { localeRegs.push({ ns, dicts }); return () => {} },
  },
  effect(fn, label) {
    const r = fn()
    effects.push({ label, disposer: typeof r === 'function' ? r : null })
    return () => {}
  },
}

// ---- 执行 ----
new Function('window', code)(globalThis.window)

const assert = (cond, msg) => {
  if (!cond) { console.error('✗ ' + msg); process.exitCode = 1 }
  else console.log('✓ ' + msg)
}

assert(loaded !== null, '模块被 __ModuleLoader__ 加载')
assert(loaded.id === 'dsh-warm-theme', '模块 id 正确')
const ex = loaded.exports
assert(typeof ex.apply === 'function', '导出 apply')
assert(Array.isArray(ex.inject), '导出 inject')
assert(
  JSON.stringify(ex.inject) === JSON.stringify(['slots', 'locale', 'theme']),
  "inject 声明为 ['slots','locale','theme']",
)

// 初始无选择 → 不应有覆盖层
ex.apply(ctx)
assert(layers.length === 0, '未选择配色时不注册任何覆盖层')
assert(registered.length === 1, '注册了 1 个设置行')
assert(registered[0].def.name === 'settings.general.item', '注册进 settings.general.item')
assert(registered[0].def.order === 12, 'order=12（排在官方外观10/字号11之后）')
assert(localeRegs.length === 1 && localeRegs[0].ns === 'settings.warmTheme', '注册了 i18n 字典')

// ---- 模拟用户点选 ----
// 通过渲染行组件拿到 onClick，模拟点击某套配色
const Row = registered[0].comp
const tree = Row({ locale: 'zh' })
const grid = tree.children[1]           // <div className="wt_grid">
const opts = grid.children[0]           // 选项按钮数组
assert(Array.isArray(opts) && opts.length === 6, '设置行含 6 个选项（跟随内置 + 5 套配色）')

const clickOption = (idx) => opts[idx].props.onClick()

// 选第 2 个（paper）
clickOption(1)
assert(layers.length === 1, '点选后注册 1 层覆盖')
assert(layers[0].source === 'dsh-warm-theme', '覆盖层 source 固定为 dsh-warm-theme')
assert(
  layers[0].tokens['--dsw-alias-bg-base'].light === '#f6f1e7',
  'paper 的 bg-base 浅色值正确',
)
assert(
  layers[0].tokens['--dsw-alias-bg-base'].dark === '#1c1917',
  'paper 的 bg-base 深色值正确',
)
// 断言覆盖数与 palettes.js 实际 token 数一致（不硬编码，避免派生层被漏掉时测不出来）
const { PALETTES: REF } = await import('../lib/palettes.js')
const expected = Object.keys(REF[0].light).length
assert(
  Object.keys(layers[0].tokens).length === expected,
  `覆盖 ${expected} 个 token（与 palettes.js 一致）`,
)
// 新增的交互态与浮层必须真的进了覆盖层
for (const k of [
  '--dsw-alias-interactive-bg-hover',
  '--dsw-alias-interactive-bg-active',
  '--dsw-alias-toast-bg',
  '--dsw-alias-tooltip-bg',
]) {
  assert(!!layers[0].tokens[k], `覆盖层包含 ${k}`)
}

// 切到第 5 个（tea, index 4）→ 旧层应被撤销，新层建立
const prev = layers[0]
clickOption(4)
assert(layers.length === 2, '切换后注册了新层')
assert(prev.disposed === true, '切换时旧层被撤销（不叠加）')
assert(
  layers[1].tokens['--dsw-alias-bg-base'].light === '#f1e9e4',
  'tea 的 bg-base 浅色值正确',
)

// 切回「跟随内置」→ 应撤销当前层，且不再新建
const cur = layers[1]
clickOption(0)
assert(cur.disposed === true, '选择“跟随内置”时撤销覆盖层')
assert(layers.length === 2, '选择“跟随内置”时不再新建覆盖层')

// 持久化：重新 apply 应恢复上次选择
storage.set('dsh-warm-theme:active', 'mist')
const layers2 = []
const ctx2 = {
  ...ctx,
  theme: { overrideTokens: (s, t) => { const r = { source: s, tokens: t, disposed: false }; layers2.push(r); return () => { r.disposed = true } } },
  slots: { inject: (s, fn) => fn(), register: () => () => {} },
}
ex.apply(ctx2)
assert(layers2.length === 1, '重载后按持久化值恢复覆盖层')
assert(layers2[0].tokens['--dsw-alias-bg-base'].light === '#eef1f4', '恢复的是 mist 配色')

// 卸载清理
const teardown = effects.filter((e) => e.disposer)
assert(teardown.length >= 2, `注册了 ${teardown.length} 个可清理 effect（样式/字典/覆盖层）`)

// ---- 样式注入 ----
assert(headChildren.length >= 1, '向 document.head 注入了 <style>')
const styleEl = headChildren.find((e) => e.getAttribute('data-dsh-warm-theme') !== undefined)
assert(!!styleEl, '<style> 带 data-dsh-warm-theme 标记')
assert(styleEl.textContent.includes('.wt_row'), '样式内容包含 .wt_row 规则')
assert(styleEl.textContent.includes('--dsw-alias-brand-primary'), '样式使用 DSH 语义 token')

// ---- macOS 侧边栏底色修正（唯一的非 token 例外）----
// 剥掉注释再分析：注释里会提到 DSH 的类名与选择器，直接做子串匹配会误判。
const css = styleEl.textContent.replace(/\/\*[\s\S]*?\*\//g, '')

// 主锚点：CSS Modules 的 local 名稳定，只有哈希前缀会变
assert(css.includes("[class*='_sidebarCol']"), '样式含主锚点 [class*="_sidebarCol"]')
// 备用锚点：万一类名改了，还能按 DOM 结构反查
assert(css.includes('div:has(> [data-window-drag])'), '样式含 :has() 备用锚点')
// 必须整条 background 覆盖 —— 原生值里混了硬编码蓝色，覆盖 token 压不住
assert(
  css.includes('background: var(--dsw-specific-sidebar-fill)'),
  '侧边栏规则使用 sidebar-fill token（整条覆盖 background）',
)
// 不能误用只在折叠时存在的属性当锚点
assert(!css.includes('[data-sidebar-collapsed] >'), '未把 data-sidebar-collapsed 当常驻锚点')

// ---- 跨平台安全 ----
// 任何触碰 DSH 布局容器的规则都必须限定在 darwin 下，否则会破坏 Windows
// 原生布局（Windows 的 frame/sidebarCol 本来就用 sidebar-fill，
// centerCol 还带 --dsh-windows-content-radius 圆角）。
// 本包不该碰正文容器与外壳容器 —— 那两个在平台上都由 token 正确驱动。
for (const cls of ['_centerCol', '_frame']) {
  assert(!css.includes(cls), `样式不直接引用 DSH 布局类名 ${cls}`)
}

// 侧栏规则的每个选择器分支都必须带 darwin 限定
// （引号形式不固定：[data-platform="darwin"] 与 [attr=darwin] 都合法）
const DARWIN = /\[data-platform=(["']?)darwin\1\]/
const sidebarRule = css.match(/([^{}]+)\{\s*background:\s*var\(--dsw-specific-sidebar-fill\)/)
assert(!!sidebarRule, '能定位到侧栏规则体')
if (sidebarRule) {
  const selectors = sidebarRule[1].split(',').map((s) => s.trim()).filter(Boolean)
  const unguarded = selectors.filter(
    (s) => !DARWIN.test(s) && !s.includes('[data-window-drag]'),
  )
  assert(
    unguarded.length === 0,
    `侧栏规则各分支都限定在 macOS（未限定: ${unguarded.length} 个）`,
  )
}

// 调用样式 disposer 应移除节点
const styleEffect = effects.find((e) => e.disposer && typeof e.disposer === 'function')
// 找到真正持有样式 disposer 的那条（label 以 styles 结尾）
const stylesEffect = effects.find((e) => e.label && e.label.includes('styles'))
assert(!!stylesEffect && !!stylesEffect.disposer, '样式 effect 提供了 disposer')
stylesEffect.disposer()
assert(styleEl._parent === null, '卸载样式后 <style> 已从 head 移除')

// ============================================================
// 数据完整性：配色 token 的对比度与结构约束
// 这些检查固定在测试里，避免以后加 token / 调色时悄悄退化。
// ============================================================

function lum(hex) {
  const h = hex.replace('#', '').slice(0, 6)
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// 文字色必须在所有会出现的背景上 >= 4.5:1
const TEXT_KEYS = [
  '--dsw-alias-label-primary',
  '--dsw-alias-label-secondary',
  '--dsw-alias-label-tertiary',
  '--dsw-alias-link',
  '--dsw-alias-menu-icon',
]
const BG_KEYS = [
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-bg-layer-3',
  '--dsw-specific-sidebar-fill',
  '--dsw-alias-markdown-code-block',
  '--dsw-alias-markdown-inline-code',
  '--dsw-alias-markdown-code-block-banner',
]
let pairs = 0
const failures = []
for (const p of REF) {
  for (const mode of ['light', 'dark']) {
    for (const t of TEXT_KEYS) {
      for (const b of BG_KEYS) {
        pairs++
        const r = contrast(p[mode][t], p[mode][b])
        if (r < 4.5) failures.push(`${p.id}/${mode} ${t} on ${b} = ${r.toFixed(2)}`)
      }
    }
  }
}
assert(failures.length === 0, `对比度 ${pairs} 组全部 >= 4.5:1${failures.length ? ' — ' + failures.slice(0, 3).join('; ') : ''}`)

// 阴影墨色必须比背景更暗（否则深色模式下阴影会变成发光）
for (const p of REF) {
  const inkD = p.dark['--dsw-shadow-lv1'].match(/#([0-9a-f]{6})/)[1]
  const ok = lum('#' + inkD) < lum(p.dark['--dsw-alias-bg-base'])
  assert(ok, `${p.id} 深色阴影比背景更暗`)
}

// 五套配色必须给出不同的侧边栏底色（回归：曾经五套相同）
const sidebars = new Set(REF.map((p) => p.light['--dsw-specific-sidebar-fill']))
assert(sidebars.size === REF.length, `五套侧边栏底色各不相同（${sidebars.size}/${REF.length}）`)

// 形状类 token 应覆盖内置值（防止被误删）
for (const k of ['--dsw-radius-md', '--dsw-radius-panel', '--ds-transition-duration', '--dsh-scrollbar-width']) {
  assert(!!REF[0].light[k], `覆盖了 ${k}`)
}

console.log(process.exitCode ? '\n有失败项' : '\n全部通过')
