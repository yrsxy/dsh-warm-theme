// ============================================================
// dsh-warm-theme — Browser Client Half
// 通过 exports["./client"] + dsh.client { immediately: true } 加载。
//
// 职责极小：把本包的 5 套护眼配色，经官方扩展点 ctx.theme.overrideTokens()
// 叠到活动主题上。覆盖层是 token 级的，不碰布局、不改内置主题、
// 移除后自动还原 —— 这正是 ui-theme 文档里为第三方主题设计的路径。
//
// Slot: settings.general.item（设置 → 通用 → 配色主题），排在官方
//       appearance(order 10) / font-size(order 11) 之后，即 order 12。
// ============================================================

window.__ModuleLoader__.load({
  id: 'dsh-warm-theme',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    const React = require('react');
    const h = React.createElement;
    // 与官方外观行同源的 store 实现；仅用于设置行的状态推送与 actions 写回。
    const { defineStore } = require('@deepseek-ai/dsh-client-store');

    const NS = 'settings.warmTheme';
    const LAYER_SOURCE = 'dsh-warm-theme';
    const STORAGE_KEY = 'dsh-warm-theme:active';

    const ZH = {
      title: '配色主题',
      desc: '护眼暖色主题包。覆盖语义 token，不改变布局。',
      none: '跟随内置',
      applied: '已应用',
      hint: '选择后立即生效，重启后保留。',
    };
    const EN = {
      title: 'Color theme',
      desc: 'Eye-comfort theme pack. Overrides semantic tokens only; layout untouched.',
      none: 'Built-in',
      applied: 'Active',
      hint: 'Applies immediately and persists across restarts.',
    };

    /* ---- 配色数据（与 lib/palettes.js 同源，构建期内联以便零依赖加载） ---- */
    const PALETTES = __PALETTES__;

    /* ---------------------------------------------------------------
     * 持久化：优先用 localStorage（简单、够用、跨重启）。
     * 不做 Host settings 写入 —— 那需要本包注册 settings schema，
     * 属于另一个量级的改动，且当前需求不需要。
     * ------------------------------------------------------------- */
    function readActive() {
      try {
        const v = window.localStorage.getItem(STORAGE_KEY);
        return PALETTES.some((p) => p.id === v) ? v : null;
      } catch (_) {
        return null;
      }
    }
    function writeActive(id) {
      try {
        if (id) window.localStorage.setItem(STORAGE_KEY, id);
        else window.localStorage.removeItem(STORAGE_KEY);
      } catch (_) {
        /* 无痕模式等场景下静默降级为仅进程内生效 */
      }
    }

    const inject = ['slots', 'locale', 'theme'];

    /* 样式注入：挂一个 <style>，卸载时一并移除，避免污染宿主页面。 */
    const CSS = __CSS__;
    function installStyles() {
      const el = document.createElement('style');
      el.setAttribute('data-dsh-warm-theme', '');
      el.textContent = CSS;
      document.head.appendChild(el);
      return () => {
        if (el.parentNode) el.parentNode.removeChild(el);
      };
    }

    function apply(ctx) {
      ctx.effect(() => installStyles(), 'warm-theme: styles');

      ctx.effect(
        () => ctx.locale.register(NS, { zh: ZH, en: EN }),
        'warm-theme: settings row dictionaries',
      );

      // 当前选择存进程内，配合 localStorage 做持久化。
      let activeId = readActive();

      // overrideTokens 返回 disposer；切换时先撤掉旧层再叠新层，
      // 保证任何时候本包最多只贡献一层覆盖。
      let disposeLayer = null;

      const applyLayer = (id) => {
        if (disposeLayer) {
          disposeLayer();
          disposeLayer = null;
        }
        if (!id) return;
        const pal = PALETTES.find((p) => p.id === id);
        if (!pal) return;
        // 浅/深两套值一起交给运行时，active 配色由它按当前模式挑。
        const tokens = {};
        for (const name of Object.keys(pal.light)) {
          tokens[name] = { light: pal.light[name], dark: pal.dark[name] };
        }
        disposeLayer = ctx.theme.overrideTokens(LAYER_SOURCE, tokens);
      };

      applyLayer(activeId);

      // 插件卸载时移除覆盖层，避免污染内置主题。
      ctx.effect(
        () => () => {
          if (disposeLayer) {
            disposeLayer();
            disposeLayer = null;
          }
        },
        'warm-theme: override layer teardown',
      );

      /* ---- 设置行 ---- */
      // 存储沿用官方外观行的 defineStore({ init, actions }) 契约；
      // 组件经 props.actions 写回，不在组件内自持跨渲染状态。
      const store = defineStore({
        init: () => ({ active: activeId }),
        actions: {
          set: (d, id) => {
            d.active = id;
          },
        },
      });

      const Row = (props) => {
        const t = (k) => {
          const d = props.locale === 'en' ? EN : ZH;
          return d[k] != null ? d[k] : k;
        };
        // 以 store 推送的值优先，回落到插件内状态
        const cur = props.active !== undefined ? props.active : activeId;

        const pick = (id) => {
          activeId = id;
          writeActive(id);
          applyLayer(id);
          props.actions?.set?.(id);
        };

        const items = [
          { id: null, name: t('none'), swatch: null },
          ...PALETTES.map((p) => ({ id: p.id, name: p.name, swatch: p.swatch })),
        ];

        return h(
          'div',
          { className: 'wt_row' },
          h(
            'div',
            { className: 'wt_head' },
            h('span', { className: 'wt_title' }, t('title')),
            h('span', { className: 'wt_hint' }, t('hint')),
          ),
          h(
            'div',
            { className: 'wt_grid' },
            items.map((it) =>
              h(
                'button',
                {
                  key: it.id || '__none__',
                  type: 'button',
                  className: 'wt_opt',
                  'data-active': cur === it.id ? 'true' : undefined,
                  'aria-pressed': cur === it.id ? 'true' : 'false',
                  onClick: () => pick(it.id),
                },
                it.swatch
                  ? h('span', { className: 'wt_dot', style: { background: it.swatch } })
                  : h('span', { className: 'wt_dot wt_dot_none' }),
                h('span', { className: 'wt_name' }, it.name),
              ),
            ),
          ),
          h('p', { className: 'wt_desc' }, t('desc')),
        );
      };

      ctx.slots.inject('settings.general.item', () =>
        ctx.slots.register(
          {
            name: 'settings.general.item',
            id: 'warm-theme',
            order: 12,
            store,
            locale: NS,
          },
          Row,
        ),
      );
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.NS = NS;
    return module.exports;
  },
});
