// ============================================================
// dsh-warm-theme 构建脚本
// 把 lib/palettes.js 的数据内联进 lib/client.src.js 的 __PALETTES__ 占位，
// 产出可直接被 DSH 客户端加载的 lib/client.js。
// 不依赖任何打包器 —— 客户端入口本身是 IIFE 形态的 window.__ModuleLoader__ 调用。
// ============================================================

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
const here = join(root, 'lib')
const src = readFileSync(join(here, 'client.src.js'), 'utf8')
const css = readFileSync(join(here, 'styles.css'), 'utf8')

// 内联配色：import 模块本身，而不是抠数组字面量 ——
// palettes.js 末尾有派生层（悬停态 / 浮层）会原地扩展每套配色，
// 只抽字面量会静默漏掉那 9 个 token。
const { PALETTES } = await import('./lib/palettes.js')
const literal = JSON.stringify(PALETTES, null, 2)
  .split('\n')
  .map((l, i) => (i === 0 ? l : '    ' + l))
  .join('\n')

let out = src.replace('__PALETTES__', literal)
if (out === src) throw new Error('client.src.js: 找不到 __PALETTES__ 占位符')

// CSS 以 JSON 字符串字面量内联，避免反引号/转义问题
if (!out.includes('__CSS__')) throw new Error('client.src.js: 找不到 __CSS__ 占位符')
out = out.replace('__CSS__', JSON.stringify(css))

writeFileSync(join(here, 'client.js'), out)

// 校验产出：直接从产物里定位 `const PALETTES = [` 并做括号配对
const outStart = out.indexOf('const PALETTES = [')
if (outStart < 0) throw new Error('构建产物结构异常：找不到 const PALETTES = [')
const oArr = out.indexOf('[', outStart)
let d2 = 0
let oEnd = -1
for (let i = oArr; i < out.length; i++) {
  const c = out[i]
  if (c === '[') d2++
  else if (c === ']') {
    d2--
    if (d2 === 0) { oEnd = i + 1; break }
  }
}
if (oEnd < 0) throw new Error('构建产物结构异常：PALETTES 未闭合')
const parsed = Function(`return ${out.slice(oArr, oEnd)}`)()
if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('内联的 PALETTES 为空')
for (const p of parsed) {
  if (!p.id || !p.name || !p.light || !p.dark) throw new Error(`配色 ${p.id} 结构不完整`)
  if (Object.keys(p.light).length !== Object.keys(p.dark).length) {
    throw new Error(`配色 ${p.id} 的 light/dark token 数不一致`)
  }
}

console.log(`built lib/client.js — 内联 ${parsed.length} 套配色: ${parsed.map((p) => p.id).join(', ')}`)
