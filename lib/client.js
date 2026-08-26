window.__ModuleLoader__.load({
  id: "dsh-always-timestamp",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
"use strict";

// src/client/always-timestamp.css
var always_timestamp_default = '/*\n * dsh-always-timestamp override.\n *\n * DSH renders every message clock (user `timeStart`, assistant `timeEnd`)\n * inside a `data-time-hover-root` scope and hides it with `opacity: 0` inside\n * `@media (hover: hover)`, revealing it on `:hover` / `:focus-within`\n * (ui-conversation `MessageIconActions.module.css`). The clock spans are\n * always present in the DOM \u2014 only their opacity changes \u2014 so the entire\n * feature is this one rule: keep them at full opacity.\n *\n * - `data-time-hover-root` is the stable semantic anchor DSH\'s own tests use.\n * - The CSS-module classes are hashed at build time (`[hash]_timeStart` /\n *   `[hash]_timeEnd`), but the local names are preserved, so the substring\n *   attribute selectors find exactly the clock spans \u2014 never the action\n *   buttons (copy / branch / third-party) that share the same row.\n * - `!important` keeps the override above the native normal declaration\n *   regardless of stylesheet order (plugin bundles materialize concurrently,\n *   so order is not under this plugin\'s control).\n * - No other property changes: font, color, date/time format, spacing,\n *   alignment, and every action-button behavior stay native.\n */\n[data-time-hover-root] :is([class*="timeStart"], [class*="timeEnd"]) {\n  opacity: 1 !important;\n}\n';

// src/client/index.ts
var name = "dsh-always-timestamp";
var STYLE_TAG_ID = "dsh-always-timestamp/always-timestamp.css";
function apply(ctx) {
  const existing = document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_TAG_ID)}]`);
  const style = existing != null ? existing : document.createElement("style");
  if (existing === null) {
    style.dataset.plugin = name;
    style.dataset.pluginCss = STYLE_TAG_ID;
    style.textContent = always_timestamp_default;
    document.head.appendChild(style);
  }
  ctx.effect(() => () => {
    style.remove();
  }, `${name}: always-visible timestamp style`);
}
module.exports = { name, apply };
    return module.exports;
  },
});
