// ============================================================
// dsh-warm-theme — Host（Node 侧）入口
//
// 本插件是纯前端主题包：配色全部通过客户端 ctx.theme 生效，
// 不注册任何模型可见内容，也不占用 Host 服务。
//
// 这里保持一个最小可加载的 apply，让 `dsh plugin add` 能正常挂载本包；
// 真正的逻辑在 exports["./client"]（lib/client.js）。
// ============================================================

export const name = 'dsh-warm-theme'

/** 本插件不依赖任何 Host 服务。 */
export const inject = []

/**
 * Host 侧不做任何事：主题是浏览器端关注点。
 * 保留此函数以满足插件加载契约。
 */
export function apply() {}
