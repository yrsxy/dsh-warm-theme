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
    const PALETTES = [
      {
        "id": "paper",
        "name": "暖纸 Warm Paper",
        "desc": "最接近纸质书。米黄底 + 赭石强调，降蓝光最多，适合长时间读 Markdown。",
        "swatch": "#f6f1e7",
        "light": {
          "--dsw-alias-bg-base": "#f6f1e7",
          "--dsw-alias-bg-layer-1": "#faf6ee",
          "--dsw-alias-bg-layer-2": "#f1ebdf",
          "--dsw-alias-bg-layer-3": "#eae2d3",
          "--dsw-alias-bg-module-platform": "#f1ebdf",
          "--dsw-alias-bg-overlay": "#e6ddcb",
          "--dsw-alias-label-primary": "#3a332a",
          "--dsw-alias-label-secondary": "#6b6154",
          "--dsw-alias-label-tertiary": "#655d4c",
          "--dsw-alias-label-caption": "#655d4c",
          "--dsw-alias-label-dimmed": "#a89e8e",
          "--dsw-alias-brand-primary": "#8f5932",
          "--dsw-alias-border-l1": "#3a332a12",
          "--dsw-alias-border-l2": "#3a332a22",
          "--dsw-alias-border-l3": "#3a332a33",
          "--dsw-alias-link": "#8e562e",
          "--dsw-alias-markdown-inline-code": "#efe7d7",
          "--dsw-alias-markdown-code-block": "#efe9dc",
          "--dsw-alias-state-business-primary": "#8f5932",
          "--dsw-alias-menu-surface-fill": "#faf6eef2",
          "--dsw-alias-scrollbar-bg-l2": "#3a332a1f",
          "--dsw-alias-scrollbar-hover-l2": "#3a332a38",
          "--dsw-alias-interactive-bg-hover": "#3a332a0f",
          "--dsw-alias-interactive-bg-active": "#3a332a1a",
          "--dsw-alias-interactive-bg-hover-accent": "#3a332a24",
          "--dsw-alias-interactive-bg-hover-solid": "#eae2d3",
          "--dsw-alias-interactive-bg-hover-danger": "#c0392b0f",
          "--dsw-alias-toast-bg": "#332d29",
          "--dsw-alias-toast-label": "#ffffff",
          "--dsw-alias-tooltip-bg": "#2a2522",
          "--dsw-alias-tooltip-key-bg": "#ffffff2e",
          "--dsw-specific-sidebar-fill": "#f1ebdf",
          "--dsw-specific-sidebar-nav-item-active": "#eae2d3",
          "--dsw-specific-sidebar-nav-item-active-accent": "#eae2d3",
          "--dsw-specific-sidebar-nav-item-hover": "#eae2d3",
          "--dsw-specific-input-major": "#faf6ee",
          "--dsw-specific-selector": "#f1ebdf",
          "--dsw-specific-tip": "#f1ebdf",
          "--dsw-specific-login-input": "#f1ebdf",
          "--dsw-specific-bubble": "#eae2d3",
          "--dsw-specific-bubble-highlight": "#eae2d3",
          "--dsw-alias-switch-thumb": "#faf6ee",
          "--dsw-alias-border-l4": "#3a332a2e",
          "--dsw-alias-menu-icon": "#6b6154",
          "--dsw-alias-menu-group-header-fill": "#f1ebdff0",
          "--dsw-alias-markdown-code-block-banner": "#f1ebdf",
          "--dsw-alias-markdown-code-segment-selected": "#faf6ee",
          "--dsw-alias-markdown-code-segment-unselected": "#f1ebdf",
          "--dsw-shadow-lv1": "0 2px 4px 0 #3a332a0d",
          "--dsw-shadow-lv1-blur": "0 4px 12px 0 #3a332a05",
          "--dsw-shadow-lv2": "0 4px 12px 0 #3a332a05, 0 2px 8px 0 #3a332a0a",
          "--dsw-shadow-lv3": "0 0 1px 0 #3a332a33, 0 0 4px 0 #3a332a05, 0 12px 32px 0 #3a332a14",
          "--dsw-elevation-stroke-color": "#3a332a2e",
          "--dsw-elevation-panel": "var(--dsw-elevation-stroke), 0 3px 8px 0 #3a332a08, 0 0 16px 0 #3a332a05",
          "--dsw-elevation-prominent": "var(--dsw-elevation-stroke), 0 3px 8px 0 #3a332a0a, 0 0 20px 0 #3a332a0d",
          "--dsw-elevation-soft": "var(--dsw-elevation-stroke), 0 4px 16px 0 #3a332a08, 0 0 24px 0 #3a332a08",
          "--dsw-radius-xs": "5px",
          "--dsw-radius-sm": "9px",
          "--dsw-radius-md": "14px",
          "--dsw-radius-lg": "18px",
          "--dsw-radius-xl": "22px",
          "--dsw-radius-panel": "32px",
          "--ds-transition-duration-fast": "0.12s",
          "--ds-transition-duration": "0.24s",
          "--ds-transition-duration-slow": "0.34s",
          "--dsh-scrollbar-width": "8px"
        },
        "dark": {
          "--dsw-alias-bg-base": "#1c1917",
          "--dsw-alias-bg-layer-1": "#231f1c",
          "--dsw-alias-bg-layer-2": "#2a2522",
          "--dsw-alias-bg-layer-3": "#332d29",
          "--dsw-alias-bg-module-platform": "#231f1c",
          "--dsw-alias-bg-overlay": "#0f0d0c",
          "--dsw-alias-label-primary": "#e8e1d6",
          "--dsw-alias-label-secondary": "#b3a99a",
          "--dsw-alias-label-tertiary": "#ada290",
          "--dsw-alias-label-caption": "#ada290",
          "--dsw-alias-label-dimmed": "#6f675b",
          "--dsw-alias-brand-primary": "#d99a5e",
          "--dsw-alias-border-l1": "#e8e1d614",
          "--dsw-alias-border-l2": "#e8e1d624",
          "--dsw-alias-border-l3": "#e8e1d636",
          "--dsw-alias-link": "#d99a5e",
          "--dsw-alias-markdown-inline-code": "#2a2522",
          "--dsw-alias-markdown-code-block": "#221e1b",
          "--dsw-alias-state-business-primary": "#d99a5e",
          "--dsw-alias-menu-surface-fill": "#231f1cf2",
          "--dsw-alias-scrollbar-bg-l2": "#e8e1d621",
          "--dsw-alias-scrollbar-hover-l2": "#e8e1d63d",
          "--dsw-alias-interactive-bg-hover": "#e8e1d614",
          "--dsw-alias-interactive-bg-active": "#e8e1d624",
          "--dsw-alias-interactive-bg-hover-accent": "#e8e1d63d",
          "--dsw-alias-interactive-bg-hover-solid": "#332d29",
          "--dsw-alias-interactive-bg-hover-danger": "#e07a6a1f",
          "--dsw-alias-toast-bg": "#231f1c",
          "--dsw-alias-toast-label": "#ffffff",
          "--dsw-alias-tooltip-bg": "#332d29",
          "--dsw-alias-tooltip-key-bg": "#ffffff2e",
          "--dsw-specific-sidebar-fill": "#231f1c",
          "--dsw-specific-sidebar-nav-item-active": "#332d29",
          "--dsw-specific-sidebar-nav-item-active-accent": "#332d29",
          "--dsw-specific-sidebar-nav-item-hover": "#2a2522",
          "--dsw-specific-input-major": "#2a2522",
          "--dsw-specific-selector": "#2a2522",
          "--dsw-specific-tip": "#2a2522",
          "--dsw-specific-login-input": "#231f1c",
          "--dsw-specific-bubble": "#2a2522",
          "--dsw-specific-bubble-highlight": "#332d29",
          "--dsw-alias-switch-thumb": "#332d29",
          "--dsw-alias-border-l4": "#e8e1d63d",
          "--dsw-alias-menu-icon": "#b3a99a",
          "--dsw-alias-menu-group-header-fill": "#2a2522f0",
          "--dsw-alias-markdown-code-block-banner": "#2a2522",
          "--dsw-alias-markdown-code-segment-selected": "#332d29",
          "--dsw-alias-markdown-code-segment-unselected": "#2a2522",
          "--dsw-shadow-lv1": "0 2px 4px 0 #0a080612",
          "--dsw-shadow-lv1-blur": "0 4px 12px 0 #0a080607",
          "--dsw-shadow-lv2": "0 4px 12px 0 #0a080607, 0 2px 8px 0 #0a08060e",
          "--dsw-shadow-lv3": "0 0 1px 0 #0a080645, 0 0 4px 0 #0a080607, 0 12px 32px 0 #0a08061b",
          "--dsw-elevation-stroke-color": "#e8e1d63d",
          "--dsw-elevation-panel": "var(--dsw-elevation-stroke), 0 3px 8px 0 #0a08060b, 0 0 16px 0 #0a080607",
          "--dsw-elevation-prominent": "var(--dsw-elevation-stroke), 0 3px 8px 0 #0a08060e, 0 0 20px 0 #0a080612",
          "--dsw-elevation-soft": "var(--dsw-elevation-stroke), 0 4px 16px 0 #0a08060b, 0 0 24px 0 #0a08060b",
          "--dsw-radius-xs": "5px",
          "--dsw-radius-sm": "9px",
          "--dsw-radius-md": "14px",
          "--dsw-radius-lg": "18px",
          "--dsw-radius-xl": "22px",
          "--dsw-radius-panel": "32px",
          "--ds-transition-duration-fast": "0.12s",
          "--ds-transition-duration": "0.24s",
          "--ds-transition-duration-slow": "0.34s",
          "--dsh-scrollbar-width": "8px"
        }
      },
      {
        "id": "sepia",
        "name": "柔褐书页 Old Book",
        "desc": "比暖纸更饱和一点，偏旧书页黄。对比略强，层次更分明。",
        "swatch": "#f2e8d5",
        "light": {
          "--dsw-alias-bg-base": "#f2e8d5",
          "--dsw-alias-bg-layer-1": "#f7efe0",
          "--dsw-alias-bg-layer-2": "#ece0c9",
          "--dsw-alias-bg-layer-3": "#e3d4b8",
          "--dsw-alias-bg-module-platform": "#ece0c9",
          "--dsw-alias-bg-overlay": "#ddcaa9",
          "--dsw-alias-label-primary": "#33291b",
          "--dsw-alias-label-secondary": "#63543d",
          "--dsw-alias-label-tertiary": "#625847",
          "--dsw-alias-label-caption": "#625847",
          "--dsw-alias-label-dimmed": "#a39270",
          "--dsw-alias-brand-primary": "#855d29",
          "--dsw-alias-border-l1": "#33291b12",
          "--dsw-alias-border-l2": "#33291b24",
          "--dsw-alias-border-l3": "#33291b36",
          "--dsw-alias-link": "#7a5523",
          "--dsw-alias-markdown-inline-code": "#e9dcc2",
          "--dsw-alias-markdown-code-block": "#ebdfc8",
          "--dsw-alias-state-business-primary": "#855d29",
          "--dsw-alias-menu-surface-fill": "#f7efe0f2",
          "--dsw-alias-scrollbar-bg-l2": "#33291b1f",
          "--dsw-alias-scrollbar-hover-l2": "#33291b38",
          "--dsw-alias-interactive-bg-hover": "#33291b0f",
          "--dsw-alias-interactive-bg-active": "#33291b1a",
          "--dsw-alias-interactive-bg-hover-accent": "#33291b24",
          "--dsw-alias-interactive-bg-hover-solid": "#e3d4b8",
          "--dsw-alias-interactive-bg-hover-danger": "#c0392b0f",
          "--dsw-alias-toast-bg": "#392f24",
          "--dsw-alias-toast-label": "#ffffff",
          "--dsw-alias-tooltip-bg": "#2e261d",
          "--dsw-alias-tooltip-key-bg": "#ffffff2e",
          "--dsw-specific-sidebar-fill": "#ece0c9",
          "--dsw-specific-sidebar-nav-item-active": "#e3d4b8",
          "--dsw-specific-sidebar-nav-item-active-accent": "#e3d4b8",
          "--dsw-specific-sidebar-nav-item-hover": "#e3d4b8",
          "--dsw-specific-input-major": "#f7efe0",
          "--dsw-specific-selector": "#ece0c9",
          "--dsw-specific-tip": "#ece0c9",
          "--dsw-specific-login-input": "#ece0c9",
          "--dsw-specific-bubble": "#e3d4b8",
          "--dsw-specific-bubble-highlight": "#e3d4b8",
          "--dsw-alias-switch-thumb": "#f7efe0",
          "--dsw-alias-border-l4": "#33291b2e",
          "--dsw-alias-menu-icon": "#63543d",
          "--dsw-alias-menu-group-header-fill": "#ece0c9f0",
          "--dsw-alias-markdown-code-block-banner": "#ece0c9",
          "--dsw-alias-markdown-code-segment-selected": "#f7efe0",
          "--dsw-alias-markdown-code-segment-unselected": "#ece0c9",
          "--dsw-shadow-lv1": "0 2px 4px 0 #33291b0d",
          "--dsw-shadow-lv1-blur": "0 4px 12px 0 #33291b05",
          "--dsw-shadow-lv2": "0 4px 12px 0 #33291b05, 0 2px 8px 0 #33291b0a",
          "--dsw-shadow-lv3": "0 0 1px 0 #33291b33, 0 0 4px 0 #33291b05, 0 12px 32px 0 #33291b14",
          "--dsw-elevation-stroke-color": "#33291b2e",
          "--dsw-elevation-panel": "var(--dsw-elevation-stroke), 0 3px 8px 0 #33291b08, 0 0 16px 0 #33291b05",
          "--dsw-elevation-prominent": "var(--dsw-elevation-stroke), 0 3px 8px 0 #33291b0a, 0 0 20px 0 #33291b0d",
          "--dsw-elevation-soft": "var(--dsw-elevation-stroke), 0 4px 16px 0 #33291b08, 0 0 24px 0 #33291b08",
          "--dsw-radius-xs": "5px",
          "--dsw-radius-sm": "9px",
          "--dsw-radius-md": "14px",
          "--dsw-radius-lg": "18px",
          "--dsw-radius-xl": "22px",
          "--dsw-radius-panel": "32px",
          "--ds-transition-duration-fast": "0.12s",
          "--ds-transition-duration": "0.24s",
          "--ds-transition-duration-slow": "0.34s",
          "--dsh-scrollbar-width": "8px"
        },
        "dark": {
          "--dsw-alias-bg-base": "#1e1913",
          "--dsw-alias-bg-layer-1": "#261f18",
          "--dsw-alias-bg-layer-2": "#2e261d",
          "--dsw-alias-bg-layer-3": "#392f24",
          "--dsw-alias-bg-module-platform": "#261f18",
          "--dsw-alias-bg-overlay": "#12100c",
          "--dsw-alias-label-primary": "#ece0cb",
          "--dsw-alias-label-secondary": "#b8a68b",
          "--dsw-alias-label-tertiary": "#b29d80",
          "--dsw-alias-label-caption": "#b29d80",
          "--dsw-alias-label-dimmed": "#6e6152",
          "--dsw-alias-brand-primary": "#cf9d54",
          "--dsw-alias-border-l1": "#ece0cb14",
          "--dsw-alias-border-l2": "#ece0cb26",
          "--dsw-alias-border-l3": "#ece0cb38",
          "--dsw-alias-link": "#cf9d54",
          "--dsw-alias-markdown-inline-code": "#2e261d",
          "--dsw-alias-markdown-code-block": "#251f18",
          "--dsw-alias-state-business-primary": "#cf9d54",
          "--dsw-alias-menu-surface-fill": "#261f18f2",
          "--dsw-alias-scrollbar-bg-l2": "#ece0cb21",
          "--dsw-alias-scrollbar-hover-l2": "#ece0cb3d",
          "--dsw-alias-interactive-bg-hover": "#ece0cb14",
          "--dsw-alias-interactive-bg-active": "#ece0cb24",
          "--dsw-alias-interactive-bg-hover-accent": "#ece0cb3d",
          "--dsw-alias-interactive-bg-hover-solid": "#392f24",
          "--dsw-alias-interactive-bg-hover-danger": "#e07a6a1f",
          "--dsw-alias-toast-bg": "#261f18",
          "--dsw-alias-toast-label": "#ffffff",
          "--dsw-alias-tooltip-bg": "#392f24",
          "--dsw-alias-tooltip-key-bg": "#ffffff2e",
          "--dsw-specific-sidebar-fill": "#261f18",
          "--dsw-specific-sidebar-nav-item-active": "#392f24",
          "--dsw-specific-sidebar-nav-item-active-accent": "#392f24",
          "--dsw-specific-sidebar-nav-item-hover": "#2e261d",
          "--dsw-specific-input-major": "#2e261d",
          "--dsw-specific-selector": "#2e261d",
          "--dsw-specific-tip": "#2e261d",
          "--dsw-specific-login-input": "#261f18",
          "--dsw-specific-bubble": "#2e261d",
          "--dsw-specific-bubble-highlight": "#392f24",
          "--dsw-alias-switch-thumb": "#392f24",
          "--dsw-alias-border-l4": "#ece0cb3d",
          "--dsw-alias-menu-icon": "#b8a68b",
          "--dsw-alias-menu-group-header-fill": "#2e261df0",
          "--dsw-alias-markdown-code-block-banner": "#2e261d",
          "--dsw-alias-markdown-code-segment-selected": "#392f24",
          "--dsw-alias-markdown-code-segment-unselected": "#2e261d",
          "--dsw-shadow-lv1": "0 2px 4px 0 #0a080612",
          "--dsw-shadow-lv1-blur": "0 4px 12px 0 #0a080607",
          "--dsw-shadow-lv2": "0 4px 12px 0 #0a080607, 0 2px 8px 0 #0a08060e",
          "--dsw-shadow-lv3": "0 0 1px 0 #0a080645, 0 0 4px 0 #0a080607, 0 12px 32px 0 #0a08061b",
          "--dsw-elevation-stroke-color": "#ece0cb3d",
          "--dsw-elevation-panel": "var(--dsw-elevation-stroke), 0 3px 8px 0 #0a08060b, 0 0 16px 0 #0a080607",
          "--dsw-elevation-prominent": "var(--dsw-elevation-stroke), 0 3px 8px 0 #0a08060e, 0 0 20px 0 #0a080612",
          "--dsw-elevation-soft": "var(--dsw-elevation-stroke), 0 4px 16px 0 #0a08060b, 0 0 24px 0 #0a08060b",
          "--dsw-radius-xs": "5px",
          "--dsw-radius-sm": "9px",
          "--dsw-radius-md": "14px",
          "--dsw-radius-lg": "18px",
          "--dsw-radius-xl": "22px",
          "--dsw-radius-panel": "32px",
          "--ds-transition-duration-fast": "0.12s",
          "--ds-transition-duration": "0.24s",
          "--ds-transition-duration-slow": "0.34s",
          "--dsh-scrollbar-width": "8px"
        }
      },
      {
        "id": "olive",
        "name": "橄榄静绿 Quiet Olive",
        "desc": "米白底 + 橄榄绿强调。最\"低存在感\"，几乎没有颜色倾向，专注度最高。",
        "swatch": "#eff2e6",
        "light": {
          "--dsw-alias-bg-base": "#eff2e6",
          "--dsw-alias-bg-layer-1": "#f5f7ef",
          "--dsw-alias-bg-layer-2": "#e8ecdd",
          "--dsw-alias-bg-layer-3": "#dee3cf",
          "--dsw-alias-bg-module-platform": "#e8ecdd",
          "--dsw-alias-bg-overlay": "#d7ddc5",
          "--dsw-alias-label-primary": "#2f332b",
          "--dsw-alias-label-secondary": "#5d6355",
          "--dsw-alias-label-tertiary": "#575e4f",
          "--dsw-alias-label-caption": "#575e4f",
          "--dsw-alias-label-dimmed": "#8d9483",
          "--dsw-alias-brand-primary": "#577138",
          "--dsw-alias-border-l1": "#2f332b12",
          "--dsw-alias-border-l2": "#2f332b24",
          "--dsw-alias-border-l3": "#2f332b36",
          "--dsw-alias-link": "#4d6732",
          "--dsw-alias-markdown-inline-code": "#e5e9d7",
          "--dsw-alias-markdown-code-block": "#e7ebdb",
          "--dsw-alias-state-business-primary": "#577138",
          "--dsw-alias-menu-surface-fill": "#f5f7eff2",
          "--dsw-alias-scrollbar-bg-l2": "#2f332b1f",
          "--dsw-alias-scrollbar-hover-l2": "#2f332b38",
          "--dsw-alias-interactive-bg-hover": "#2f332b0f",
          "--dsw-alias-interactive-bg-active": "#2f332b1a",
          "--dsw-alias-interactive-bg-hover-accent": "#2f332b24",
          "--dsw-alias-interactive-bg-hover-solid": "#dee3cf",
          "--dsw-alias-interactive-bg-hover-danger": "#c0392b0f",
          "--dsw-alias-toast-bg": "#31362b",
          "--dsw-alias-toast-label": "#ffffff",
          "--dsw-alias-tooltip-bg": "#272b22",
          "--dsw-alias-tooltip-key-bg": "#ffffff2e",
          "--dsw-specific-sidebar-fill": "#e8ecdd",
          "--dsw-specific-sidebar-nav-item-active": "#dee3cf",
          "--dsw-specific-sidebar-nav-item-active-accent": "#dee3cf",
          "--dsw-specific-sidebar-nav-item-hover": "#dee3cf",
          "--dsw-specific-input-major": "#f5f7ef",
          "--dsw-specific-selector": "#e8ecdd",
          "--dsw-specific-tip": "#e8ecdd",
          "--dsw-specific-login-input": "#e8ecdd",
          "--dsw-specific-bubble": "#dee3cf",
          "--dsw-specific-bubble-highlight": "#dee3cf",
          "--dsw-alias-switch-thumb": "#f5f7ef",
          "--dsw-alias-border-l4": "#2f332b2e",
          "--dsw-alias-menu-icon": "#5d6355",
          "--dsw-alias-menu-group-header-fill": "#e8ecddf0",
          "--dsw-alias-markdown-code-block-banner": "#e8ecdd",
          "--dsw-alias-markdown-code-segment-selected": "#f5f7ef",
          "--dsw-alias-markdown-code-segment-unselected": "#e8ecdd",
          "--dsw-shadow-lv1": "0 2px 4px 0 #2f332b0d",
          "--dsw-shadow-lv1-blur": "0 4px 12px 0 #2f332b05",
          "--dsw-shadow-lv2": "0 4px 12px 0 #2f332b05, 0 2px 8px 0 #2f332b0a",
          "--dsw-shadow-lv3": "0 0 1px 0 #2f332b33, 0 0 4px 0 #2f332b05, 0 12px 32px 0 #2f332b14",
          "--dsw-elevation-stroke-color": "#2f332b2e",
          "--dsw-elevation-panel": "var(--dsw-elevation-stroke), 0 3px 8px 0 #2f332b08, 0 0 16px 0 #2f332b05",
          "--dsw-elevation-prominent": "var(--dsw-elevation-stroke), 0 3px 8px 0 #2f332b0a, 0 0 20px 0 #2f332b0d",
          "--dsw-elevation-soft": "var(--dsw-elevation-stroke), 0 4px 16px 0 #2f332b08, 0 0 24px 0 #2f332b08",
          "--dsw-radius-xs": "5px",
          "--dsw-radius-sm": "9px",
          "--dsw-radius-md": "14px",
          "--dsw-radius-lg": "18px",
          "--dsw-radius-xl": "22px",
          "--dsw-radius-panel": "32px",
          "--ds-transition-duration-fast": "0.12s",
          "--ds-transition-duration": "0.24s",
          "--ds-transition-duration-slow": "0.34s",
          "--dsh-scrollbar-width": "8px"
        },
        "dark": {
          "--dsw-alias-bg-base": "#191b16",
          "--dsw-alias-bg-layer-1": "#20231c",
          "--dsw-alias-bg-layer-2": "#272b22",
          "--dsw-alias-bg-layer-3": "#31362b",
          "--dsw-alias-bg-module-platform": "#20231c",
          "--dsw-alias-bg-overlay": "#0e100c",
          "--dsw-alias-label-primary": "#e4e7db",
          "--dsw-alias-label-secondary": "#aeb4a0",
          "--dsw-alias-label-tertiary": "#a5ad95",
          "--dsw-alias-label-caption": "#a5ad95",
          "--dsw-alias-label-dimmed": "#666c5c",
          "--dsw-alias-brand-primary": "#9dbb6a",
          "--dsw-alias-border-l1": "#e4e7db14",
          "--dsw-alias-border-l2": "#e4e7db26",
          "--dsw-alias-border-l3": "#e4e7db38",
          "--dsw-alias-link": "#9dbb6a",
          "--dsw-alias-markdown-inline-code": "#272b22",
          "--dsw-alias-markdown-code-block": "#1f2219",
          "--dsw-alias-state-business-primary": "#9dbb6a",
          "--dsw-alias-menu-surface-fill": "#20231cf2",
          "--dsw-alias-scrollbar-bg-l2": "#e4e7db21",
          "--dsw-alias-scrollbar-hover-l2": "#e4e7db3d",
          "--dsw-alias-interactive-bg-hover": "#e4e7db14",
          "--dsw-alias-interactive-bg-active": "#e4e7db24",
          "--dsw-alias-interactive-bg-hover-accent": "#e4e7db3d",
          "--dsw-alias-interactive-bg-hover-solid": "#31362b",
          "--dsw-alias-interactive-bg-hover-danger": "#e07a6a1f",
          "--dsw-alias-toast-bg": "#20231c",
          "--dsw-alias-toast-label": "#ffffff",
          "--dsw-alias-tooltip-bg": "#31362b",
          "--dsw-alias-tooltip-key-bg": "#ffffff2e",
          "--dsw-specific-sidebar-fill": "#20231c",
          "--dsw-specific-sidebar-nav-item-active": "#31362b",
          "--dsw-specific-sidebar-nav-item-active-accent": "#31362b",
          "--dsw-specific-sidebar-nav-item-hover": "#272b22",
          "--dsw-specific-input-major": "#272b22",
          "--dsw-specific-selector": "#272b22",
          "--dsw-specific-tip": "#272b22",
          "--dsw-specific-login-input": "#20231c",
          "--dsw-specific-bubble": "#272b22",
          "--dsw-specific-bubble-highlight": "#31362b",
          "--dsw-alias-switch-thumb": "#31362b",
          "--dsw-alias-border-l4": "#e4e7db3d",
          "--dsw-alias-menu-icon": "#aeb4a0",
          "--dsw-alias-menu-group-header-fill": "#272b22f0",
          "--dsw-alias-markdown-code-block-banner": "#272b22",
          "--dsw-alias-markdown-code-segment-selected": "#31362b",
          "--dsw-alias-markdown-code-segment-unselected": "#272b22",
          "--dsw-shadow-lv1": "0 2px 4px 0 #0a080612",
          "--dsw-shadow-lv1-blur": "0 4px 12px 0 #0a080607",
          "--dsw-shadow-lv2": "0 4px 12px 0 #0a080607, 0 2px 8px 0 #0a08060e",
          "--dsw-shadow-lv3": "0 0 1px 0 #0a080645, 0 0 4px 0 #0a080607, 0 12px 32px 0 #0a08061b",
          "--dsw-elevation-stroke-color": "#e4e7db3d",
          "--dsw-elevation-panel": "var(--dsw-elevation-stroke), 0 3px 8px 0 #0a08060b, 0 0 16px 0 #0a080607",
          "--dsw-elevation-prominent": "var(--dsw-elevation-stroke), 0 3px 8px 0 #0a08060e, 0 0 20px 0 #0a080612",
          "--dsw-elevation-soft": "var(--dsw-elevation-stroke), 0 4px 16px 0 #0a08060b, 0 0 24px 0 #0a08060b",
          "--dsw-radius-xs": "5px",
          "--dsw-radius-sm": "9px",
          "--dsw-radius-md": "14px",
          "--dsw-radius-lg": "18px",
          "--dsw-radius-xl": "22px",
          "--dsw-radius-panel": "32px",
          "--ds-transition-duration-fast": "0.12s",
          "--ds-transition-duration": "0.24s",
          "--ds-transition-duration-slow": "0.34s",
          "--dsh-scrollbar-width": "8px"
        }
      },
      {
        "id": "tea",
        "name": "茶褐 Tea Brown",
        "desc": "偏红的暖棕调，比暖纸更沉一点。带红茶/红木的暖意，适合夜间灯光下看。",
        "swatch": "#f1e9e4",
        "light": {
          "--dsw-alias-bg-base": "#f1e9e4",
          "--dsw-alias-bg-layer-1": "#f7f1ee",
          "--dsw-alias-bg-layer-2": "#ebe0db",
          "--dsw-alias-bg-layer-3": "#e0d3cc",
          "--dsw-alias-bg-module-platform": "#ebe0db",
          "--dsw-alias-bg-overlay": "#d8c8c0",
          "--dsw-alias-label-primary": "#3e2f28",
          "--dsw-alias-label-secondary": "#685045",
          "--dsw-alias-label-tertiary": "#6b544a",
          "--dsw-alias-label-caption": "#6b544a",
          "--dsw-alias-label-dimmed": "#9c8377",
          "--dsw-alias-brand-primary": "#88513a",
          "--dsw-alias-border-l1": "#3e2f2812",
          "--dsw-alias-border-l2": "#3e2f2824",
          "--dsw-alias-border-l3": "#3e2f2836",
          "--dsw-alias-link": "#71564c",
          "--dsw-alias-markdown-inline-code": "#e7dbd5",
          "--dsw-alias-markdown-code-block": "#e9ded8",
          "--dsw-alias-state-business-primary": "#88513a",
          "--dsw-alias-menu-surface-fill": "#f7f1eef2",
          "--dsw-alias-scrollbar-bg-l2": "#3e2f281f",
          "--dsw-alias-scrollbar-hover-l2": "#3e2f2838",
          "--dsw-alias-interactive-bg-hover": "#3e2f280f",
          "--dsw-alias-interactive-bg-active": "#3e2f281a",
          "--dsw-alias-interactive-bg-hover-accent": "#3e2f2824",
          "--dsw-alias-interactive-bg-hover-solid": "#e0d3cc",
          "--dsw-alias-interactive-bg-hover-danger": "#c0392b0f",
          "--dsw-alias-toast-bg": "#342c27",
          "--dsw-alias-toast-label": "#ffffff",
          "--dsw-alias-tooltip-bg": "#2b2420",
          "--dsw-alias-tooltip-key-bg": "#ffffff2e",
          "--dsw-specific-sidebar-fill": "#ebe0db",
          "--dsw-specific-sidebar-nav-item-active": "#e0d3cc",
          "--dsw-specific-sidebar-nav-item-active-accent": "#e0d3cc",
          "--dsw-specific-sidebar-nav-item-hover": "#e0d3cc",
          "--dsw-specific-input-major": "#f7f1ee",
          "--dsw-specific-selector": "#ebe0db",
          "--dsw-specific-tip": "#ebe0db",
          "--dsw-specific-login-input": "#ebe0db",
          "--dsw-specific-bubble": "#e0d3cc",
          "--dsw-specific-bubble-highlight": "#e0d3cc",
          "--dsw-alias-switch-thumb": "#f7f1ee",
          "--dsw-alias-border-l4": "#3e2f282e",
          "--dsw-alias-menu-icon": "#685045",
          "--dsw-alias-menu-group-header-fill": "#ebe0dbf0",
          "--dsw-alias-markdown-code-block-banner": "#ebe0db",
          "--dsw-alias-markdown-code-segment-selected": "#f7f1ee",
          "--dsw-alias-markdown-code-segment-unselected": "#ebe0db",
          "--dsw-shadow-lv1": "0 2px 4px 0 #3e2f280d",
          "--dsw-shadow-lv1-blur": "0 4px 12px 0 #3e2f2805",
          "--dsw-shadow-lv2": "0 4px 12px 0 #3e2f2805, 0 2px 8px 0 #3e2f280a",
          "--dsw-shadow-lv3": "0 0 1px 0 #3e2f2833, 0 0 4px 0 #3e2f2805, 0 12px 32px 0 #3e2f2814",
          "--dsw-elevation-stroke-color": "#3e2f282e",
          "--dsw-elevation-panel": "var(--dsw-elevation-stroke), 0 3px 8px 0 #3e2f2808, 0 0 16px 0 #3e2f2805",
          "--dsw-elevation-prominent": "var(--dsw-elevation-stroke), 0 3px 8px 0 #3e2f280a, 0 0 20px 0 #3e2f280d",
          "--dsw-elevation-soft": "var(--dsw-elevation-stroke), 0 4px 16px 0 #3e2f2808, 0 0 24px 0 #3e2f2808",
          "--dsw-radius-xs": "5px",
          "--dsw-radius-sm": "9px",
          "--dsw-radius-md": "14px",
          "--dsw-radius-lg": "18px",
          "--dsw-radius-xl": "22px",
          "--dsw-radius-panel": "32px",
          "--ds-transition-duration-fast": "0.12s",
          "--ds-transition-duration": "0.24s",
          "--ds-transition-duration-slow": "0.34s",
          "--dsh-scrollbar-width": "8px"
        },
        "dark": {
          "--dsw-alias-bg-base": "#1d1815",
          "--dsw-alias-bg-layer-1": "#241e1a",
          "--dsw-alias-bg-layer-2": "#2b2420",
          "--dsw-alias-bg-layer-3": "#342c27",
          "--dsw-alias-bg-module-platform": "#2b2420",
          "--dsw-alias-bg-overlay": "#12100e",
          "--dsw-alias-label-primary": "#e9dfd8",
          "--dsw-alias-label-secondary": "#b6a396",
          "--dsw-alias-label-tertiary": "#ae9b86",
          "--dsw-alias-label-caption": "#ae9b86",
          "--dsw-alias-label-dimmed": "#6f6257",
          "--dsw-alias-brand-primary": "#c98a63",
          "--dsw-alias-border-l1": "#e9dfd814",
          "--dsw-alias-border-l2": "#e9dfd826",
          "--dsw-alias-border-l3": "#e9dfd838",
          "--dsw-alias-link": "#c98a63",
          "--dsw-alias-markdown-inline-code": "#2a231f",
          "--dsw-alias-markdown-code-block": "#29221d",
          "--dsw-alias-state-business-primary": "#c98a63",
          "--dsw-alias-menu-surface-fill": "#241e1af2",
          "--dsw-alias-scrollbar-bg-l2": "#e9dfd821",
          "--dsw-alias-scrollbar-hover-l2": "#e9dfd83d",
          "--dsw-alias-interactive-bg-hover": "#e9dfd814",
          "--dsw-alias-interactive-bg-active": "#e9dfd824",
          "--dsw-alias-interactive-bg-hover-accent": "#e9dfd83d",
          "--dsw-alias-interactive-bg-hover-solid": "#342c27",
          "--dsw-alias-interactive-bg-hover-danger": "#e07a6a1f",
          "--dsw-alias-toast-bg": "#241e1a",
          "--dsw-alias-toast-label": "#ffffff",
          "--dsw-alias-tooltip-bg": "#342c27",
          "--dsw-alias-tooltip-key-bg": "#ffffff2e",
          "--dsw-specific-sidebar-fill": "#241e1a",
          "--dsw-specific-sidebar-nav-item-active": "#342c27",
          "--dsw-specific-sidebar-nav-item-active-accent": "#342c27",
          "--dsw-specific-sidebar-nav-item-hover": "#2b2420",
          "--dsw-specific-input-major": "#2b2420",
          "--dsw-specific-selector": "#2b2420",
          "--dsw-specific-tip": "#2b2420",
          "--dsw-specific-login-input": "#241e1a",
          "--dsw-specific-bubble": "#2b2420",
          "--dsw-specific-bubble-highlight": "#342c27",
          "--dsw-alias-switch-thumb": "#342c27",
          "--dsw-alias-border-l4": "#e9dfd83d",
          "--dsw-alias-menu-icon": "#b6a396",
          "--dsw-alias-menu-group-header-fill": "#2b2420f0",
          "--dsw-alias-markdown-code-block-banner": "#2b2420",
          "--dsw-alias-markdown-code-segment-selected": "#342c27",
          "--dsw-alias-markdown-code-segment-unselected": "#2b2420",
          "--dsw-shadow-lv1": "0 2px 4px 0 #0a080612",
          "--dsw-shadow-lv1-blur": "0 4px 12px 0 #0a080607",
          "--dsw-shadow-lv2": "0 4px 12px 0 #0a080607, 0 2px 8px 0 #0a08060e",
          "--dsw-shadow-lv3": "0 0 1px 0 #0a080645, 0 0 4px 0 #0a080607, 0 12px 32px 0 #0a08061b",
          "--dsw-elevation-stroke-color": "#e9dfd83d",
          "--dsw-elevation-panel": "var(--dsw-elevation-stroke), 0 3px 8px 0 #0a08060b, 0 0 16px 0 #0a080607",
          "--dsw-elevation-prominent": "var(--dsw-elevation-stroke), 0 3px 8px 0 #0a08060e, 0 0 20px 0 #0a080612",
          "--dsw-elevation-soft": "var(--dsw-elevation-stroke), 0 4px 16px 0 #0a08060b, 0 0 24px 0 #0a08060b",
          "--dsw-radius-xs": "5px",
          "--dsw-radius-sm": "9px",
          "--dsw-radius-md": "14px",
          "--dsw-radius-lg": "18px",
          "--dsw-radius-xl": "22px",
          "--dsw-radius-panel": "32px",
          "--ds-transition-duration-fast": "0.12s",
          "--ds-transition-duration": "0.24s",
          "--ds-transition-duration-slow": "0.34s",
          "--dsh-scrollbar-width": "8px"
        }
      },
      {
        "id": "mist",
        "name": "雾蓝 Mist Blue",
        "desc": "唯一的冷调方案。极浅雾蓝灰底 + 沉稳蓝强调，清醒克制，适合白天高强度工作。",
        "swatch": "#eef1f4",
        "light": {
          "--dsw-alias-bg-base": "#eef1f4",
          "--dsw-alias-bg-layer-1": "#f4f6f8",
          "--dsw-alias-bg-layer-2": "#e4e8ec",
          "--dsw-alias-bg-layer-3": "#d6dbe1",
          "--dsw-alias-bg-module-platform": "#e4e8ec",
          "--dsw-alias-bg-overlay": "#ccd3da",
          "--dsw-alias-label-primary": "#2c333a",
          "--dsw-alias-label-secondary": "#4c5661",
          "--dsw-alias-label-tertiary": "#57606b",
          "--dsw-alias-label-caption": "#57606b",
          "--dsw-alias-label-dimmed": "#82909e",
          "--dsw-alias-brand-primary": "#355b8d",
          "--dsw-alias-border-l1": "#2c333a12",
          "--dsw-alias-border-l2": "#2c333a24",
          "--dsw-alias-border-l3": "#2c333a36",
          "--dsw-alias-link": "#355b8d",
          "--dsw-alias-markdown-inline-code": "#e2e7eb",
          "--dsw-alias-markdown-code-block": "#e4e9ee",
          "--dsw-alias-state-business-primary": "#355b8d",
          "--dsw-alias-menu-surface-fill": "#f4f6f8f2",
          "--dsw-alias-scrollbar-bg-l2": "#2c333a1f",
          "--dsw-alias-scrollbar-hover-l2": "#2c333a38",
          "--dsw-alias-interactive-bg-hover": "#2c333a0f",
          "--dsw-alias-interactive-bg-active": "#2c333a1a",
          "--dsw-alias-interactive-bg-hover-accent": "#2c333a24",
          "--dsw-alias-interactive-bg-hover-solid": "#d6dbe1",
          "--dsw-alias-interactive-bg-hover-danger": "#c0392b0f",
          "--dsw-alias-toast-bg": "#2b3137",
          "--dsw-alias-toast-label": "#ffffff",
          "--dsw-alias-tooltip-bg": "#22272c",
          "--dsw-alias-tooltip-key-bg": "#ffffff2e",
          "--dsw-specific-sidebar-fill": "#e4e8ec",
          "--dsw-specific-sidebar-nav-item-active": "#d6dbe1",
          "--dsw-specific-sidebar-nav-item-active-accent": "#d6dbe1",
          "--dsw-specific-sidebar-nav-item-hover": "#d6dbe1",
          "--dsw-specific-input-major": "#f4f6f8",
          "--dsw-specific-selector": "#e4e8ec",
          "--dsw-specific-tip": "#e4e8ec",
          "--dsw-specific-login-input": "#e4e8ec",
          "--dsw-specific-bubble": "#d6dbe1",
          "--dsw-specific-bubble-highlight": "#d6dbe1",
          "--dsw-alias-switch-thumb": "#f4f6f8",
          "--dsw-alias-border-l4": "#2c333a2e",
          "--dsw-alias-menu-icon": "#4c5661",
          "--dsw-alias-menu-group-header-fill": "#e4e8ecf0",
          "--dsw-alias-markdown-code-block-banner": "#e4e8ec",
          "--dsw-alias-markdown-code-segment-selected": "#f4f6f8",
          "--dsw-alias-markdown-code-segment-unselected": "#e4e8ec",
          "--dsw-shadow-lv1": "0 2px 4px 0 #2c333a0d",
          "--dsw-shadow-lv1-blur": "0 4px 12px 0 #2c333a05",
          "--dsw-shadow-lv2": "0 4px 12px 0 #2c333a05, 0 2px 8px 0 #2c333a0a",
          "--dsw-shadow-lv3": "0 0 1px 0 #2c333a33, 0 0 4px 0 #2c333a05, 0 12px 32px 0 #2c333a14",
          "--dsw-elevation-stroke-color": "#2c333a2e",
          "--dsw-elevation-panel": "var(--dsw-elevation-stroke), 0 3px 8px 0 #2c333a08, 0 0 16px 0 #2c333a05",
          "--dsw-elevation-prominent": "var(--dsw-elevation-stroke), 0 3px 8px 0 #2c333a0a, 0 0 20px 0 #2c333a0d",
          "--dsw-elevation-soft": "var(--dsw-elevation-stroke), 0 4px 16px 0 #2c333a08, 0 0 24px 0 #2c333a08",
          "--dsw-radius-xs": "5px",
          "--dsw-radius-sm": "9px",
          "--dsw-radius-md": "14px",
          "--dsw-radius-lg": "18px",
          "--dsw-radius-xl": "22px",
          "--dsw-radius-panel": "32px",
          "--ds-transition-duration-fast": "0.12s",
          "--ds-transition-duration": "0.24s",
          "--ds-transition-duration-slow": "0.34s",
          "--dsh-scrollbar-width": "8px"
        },
        "dark": {
          "--dsw-alias-bg-base": "#14171a",
          "--dsw-alias-bg-layer-1": "#1b1f23",
          "--dsw-alias-bg-layer-2": "#22272c",
          "--dsw-alias-bg-layer-3": "#2b3137",
          "--dsw-alias-bg-module-platform": "#22272c",
          "--dsw-alias-bg-overlay": "#0d0f11",
          "--dsw-alias-label-primary": "#dde3e9",
          "--dsw-alias-label-secondary": "#a7b3bf",
          "--dsw-alias-label-tertiary": "#90a0af",
          "--dsw-alias-label-caption": "#90a0af",
          "--dsw-alias-label-dimmed": "#64707c",
          "--dsw-alias-brand-primary": "#7fa8dc",
          "--dsw-alias-border-l1": "#dde3e914",
          "--dsw-alias-border-l2": "#dde3e926",
          "--dsw-alias-border-l3": "#dde3e938",
          "--dsw-alias-link": "#7fa8dc",
          "--dsw-alias-markdown-inline-code": "#242a2f",
          "--dsw-alias-markdown-code-block": "#23282d",
          "--dsw-alias-state-business-primary": "#7fa8dc",
          "--dsw-alias-menu-surface-fill": "#1b1f23f2",
          "--dsw-alias-scrollbar-bg-l2": "#dde3e921",
          "--dsw-alias-scrollbar-hover-l2": "#dde3e93d",
          "--dsw-alias-interactive-bg-hover": "#dde3e914",
          "--dsw-alias-interactive-bg-active": "#dde3e924",
          "--dsw-alias-interactive-bg-hover-accent": "#dde3e93d",
          "--dsw-alias-interactive-bg-hover-solid": "#2b3137",
          "--dsw-alias-interactive-bg-hover-danger": "#e07a6a1f",
          "--dsw-alias-toast-bg": "#1b1f23",
          "--dsw-alias-toast-label": "#ffffff",
          "--dsw-alias-tooltip-bg": "#2b3137",
          "--dsw-alias-tooltip-key-bg": "#ffffff2e",
          "--dsw-specific-sidebar-fill": "#1b1f23",
          "--dsw-specific-sidebar-nav-item-active": "#2b3137",
          "--dsw-specific-sidebar-nav-item-active-accent": "#2b3137",
          "--dsw-specific-sidebar-nav-item-hover": "#22272c",
          "--dsw-specific-input-major": "#22272c",
          "--dsw-specific-selector": "#22272c",
          "--dsw-specific-tip": "#22272c",
          "--dsw-specific-login-input": "#1b1f23",
          "--dsw-specific-bubble": "#22272c",
          "--dsw-specific-bubble-highlight": "#2b3137",
          "--dsw-alias-switch-thumb": "#2b3137",
          "--dsw-alias-border-l4": "#dde3e93d",
          "--dsw-alias-menu-icon": "#a7b3bf",
          "--dsw-alias-menu-group-header-fill": "#22272cf0",
          "--dsw-alias-markdown-code-block-banner": "#22272c",
          "--dsw-alias-markdown-code-segment-selected": "#2b3137",
          "--dsw-alias-markdown-code-segment-unselected": "#22272c",
          "--dsw-shadow-lv1": "0 2px 4px 0 #0a080612",
          "--dsw-shadow-lv1-blur": "0 4px 12px 0 #0a080607",
          "--dsw-shadow-lv2": "0 4px 12px 0 #0a080607, 0 2px 8px 0 #0a08060e",
          "--dsw-shadow-lv3": "0 0 1px 0 #0a080645, 0 0 4px 0 #0a080607, 0 12px 32px 0 #0a08061b",
          "--dsw-elevation-stroke-color": "#dde3e93d",
          "--dsw-elevation-panel": "var(--dsw-elevation-stroke), 0 3px 8px 0 #0a08060b, 0 0 16px 0 #0a080607",
          "--dsw-elevation-prominent": "var(--dsw-elevation-stroke), 0 3px 8px 0 #0a08060e, 0 0 20px 0 #0a080612",
          "--dsw-elevation-soft": "var(--dsw-elevation-stroke), 0 4px 16px 0 #0a08060b, 0 0 24px 0 #0a08060b",
          "--dsw-radius-xs": "5px",
          "--dsw-radius-sm": "9px",
          "--dsw-radius-md": "14px",
          "--dsw-radius-lg": "18px",
          "--dsw-radius-xl": "22px",
          "--dsw-radius-panel": "32px",
          "--ds-transition-duration-fast": "0.12s",
          "--ds-transition-duration": "0.24s",
          "--ds-transition-duration-slow": "0.34s",
          "--dsh-scrollbar-width": "8px"
        }
      }
    ];

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
    const CSS = "/* ============================================================\n   dsh-warm-theme — 样式表\n\n   分两部分：\n   1. 设置行自身样式（.wt_*）—— 纯 token\n   2. macOS 侧边栏底色修正（见文件末尾）—— 唯一的非 token 例外\n   ============================================================ */\n\n/* ---------- 1. 设置行 ---------- */\n\n.wt_row {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  padding: 16px 4px;\n  border-bottom: 1px solid var(--dsw-alias-border-l1);\n}\n\n.wt_head {\n  display: flex;\n  align-items: baseline;\n  gap: 10px;\n  flex-wrap: wrap;\n}\n\n.wt_title {\n  font-size: var(--dsw-font-xs-13, 13px);\n  font-weight: 600;\n  color: var(--dsw-alias-label-primary);\n}\n\n.wt_hint {\n  font-size: 12px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.wt_grid {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n\n.wt_opt {\n  display: inline-flex;\n  align-items: center;\n  gap: 7px;\n  padding: 7px 12px;\n  font: inherit;\n  font-size: 12.5px;\n  cursor: pointer;\n  border-radius: var(--dsw-radius-md, 8px);\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-secondary);\n  transition: border-color .15s, background .15s, color .15s;\n}\n\n.wt_opt:hover {\n  border-color: var(--dsw-alias-border-l4, var(--dsw-alias-border-l3));\n  background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));\n  color: var(--dsw-alias-label-primary);\n}\n\n.wt_opt[data-active='true'] {\n  border-color: var(--dsw-alias-brand-primary);\n  color: var(--dsw-alias-label-primary);\n  font-weight: 600;\n  background: var(--dsw-alias-interactive-bg-active, var(--dsw-alias-bg-layer-2));\n}\n\n.wt_opt:focus-visible {\n  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));\n  outline-offset: 2px;\n}\n\n.wt_dot {\n  width: 15px;\n  height: 15px;\n  flex: 0 0 15px;\n  border-radius: 50%;\n  border: 1px solid var(--dsw-alias-border-l2);\n}\n\n/* 「跟随内置」没有色块，用虚线圈示意 */\n.wt_dot_none {\n  background: transparent;\n  border-style: dashed;\n  border-color: var(--dsw-alias-label-tertiary);\n}\n\n.wt_name {\n  white-space: nowrap;\n}\n\n.wt_desc {\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.6;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n/* ---------- 2. macOS 侧边栏底色 ----------\n *\n * 背景：ui-sidebar 的根容器写了 background: var(--dsw-specific-sidebar-fill)，\n * 但紧接着有一条平台覆盖把它置空：\n *\n *     [data-platform=darwin] .<hash>_root { background: 0 0 }\n *\n * 于是 macOS 上侧栏透明，透出 ui-layout 的 .<hash>_frame\n * （background: var(--dsw-alias-bg-base)）—— 与正文区同色。\n * 这是 DSH 在 macOS 上的原生设计：侧栏与正文同底，靠边框分隔。\n * Windows 走另一条分支（frame 用 sidebar-fill），天然两段式；\n * 这里给 macOS 补上同类效果。\n *\n * 选择器：两个包都用 CSS Modules —— 类名形如 `_6Qf49G_sidebarCol`，\n * 前面的哈希每次构建都会变，但 **local 名 `sidebarCol` 是稳定的**。\n * 所以主锚点用属性子串匹配 `[class*=\"_sidebarCol\"]`：不依赖 DOM 层级，\n * 也不怕哈希变化。\n *\n * 保留 `:has()` 那条作为备用锚点：万一 DSH 改掉类名，还能按结构反查\n * （data-window-drag 是 macOS 标题栏拖拽区，为侧栏根的直接子元素）。\n * 两条命中同一元素时取值相同，重复失效也无害。\n *\n * 为什么必须压掉原生值：macOS 那条规则不是纯 token ——\n *   `color-mix(..., var(--dsw-specific-sidebar-fill) 97%, #7a9bf0)`\n * 里混了硬编码的蓝色 #7a9bf0，顶部还有 `#7a9bf01a` 的渐变起手。\n * 只覆盖 token 会留下蓝色调，必须整条 background 覆盖。\n *\n * 注意：不用 [data-sidebar-collapsed]——那是 frame 上的可选属性，\n * 仅在折叠时存在（值为 undefined 时 React 不输出该属性），\n * 展开时应为不存在，不能当常驻锚点。\n *\n * 失效行为：若 DSH 升级后类名与属性都改名，本规则静默失效，侧栏回落\n * 到原生同色，不报错、不影响任何其它样式。test/smoke.mjs 里有断言盯着。\n */\n[data-platform='darwin'] div[class*='_sidebarCol'],\ndiv:has(> [data-window-drag]):not([data-window-drag]) {\n  background: var(--dsw-specific-sidebar-fill);\n}\n";
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
