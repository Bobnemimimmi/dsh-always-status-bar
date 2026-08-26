window.__ModuleLoader__.load({
  id: "dsh-always-status-bar",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
"use strict";

// src/client/always-status-bar.css
var always_status_bar_default = '/*\n * dsh-always-status-bar override.\n *\n * DSH renders every message\'s native status line \u2014 the user side\n * (`clock="start"`, CSS module class `timeStart`) and the assistant side\n * (`clock="end"`, class `timeEnd`) \u2014 inside a `data-time-hover-root` scope.\n * That single span carries the date | time and, for assistant messages, the\n * run-time readings (\u7528\u65F6 / \u9996 token / tok/s). DSH hides the whole span with\n * `opacity: 0` inside `@media (hover: hover)`, revealing it on\n * `:hover` / `:focus-within` (ui-conversation `MessageIconActions.module.css`).\n * The span is always present in the DOM \u2014 only its opacity changes \u2014 so the\n * entire feature is this one rule: keep it at full opacity.\n *\n * - `data-time-hover-root` is the stable semantic anchor DSH\'s own tests use.\n * - The CSS-module classes are hashed at build time (`[hash]_timeStart` /\n *   `[hash]_timeEnd`), but the local names are preserved, so the substring\n *   attribute selectors find exactly the status span \u2014 never the action\n *   buttons (copy / branch / third-party) that share the same row.\n * - `!important` keeps the override above the native normal declaration\n *   regardless of stylesheet order (plugin bundles materialize concurrently,\n *   so order is not under this plugin\'s control).\n * - No other property changes: font, color, date/time format, spacing,\n *   alignment, and every action-button behavior stay native.\n */\n[data-time-hover-root] :is([class*="timeStart"], [class*="timeEnd"]) {\n  opacity: 1 !important;\n}\n';

// src/client/index.ts
var name = "dsh-always-status-bar";
var STYLE_TAG_ID = "dsh-always-status-bar/always-status-bar.css";
function apply(ctx) {
  const existing = document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_TAG_ID)}]`);
  const style = existing != null ? existing : document.createElement("style");
  if (existing === null) {
    style.dataset.plugin = name;
    style.dataset.pluginCss = STYLE_TAG_ID;
    style.textContent = always_status_bar_default;
    document.head.appendChild(style);
  }
  ctx.effect(() => () => {
    style.remove();
  }, `${name}: always-visible status bar style`);
}
module.exports = { name, apply };
    return module.exports;
  },
});
