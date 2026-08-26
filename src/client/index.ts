/**
 * dsh-always-status-bar — Browser half (the `./client` bundle).
 *
 * Classic-script bundle: registers a lazy factory with
 * `window.__ModuleLoader__` (the DSH client module system). The factory
 * returns the Cordis plugin shape the boot Loader imports; `apply` injects
 * one `<style data-plugin>` tag whose single rule keeps the native message
 * status line visible.
 *
 * Facts located in the current DSH checkout this plugin targets:
 * - User messages: `packages/client/ui-conversation/src/client/chat/
 *   MessageItem.tsx` renders the clock inside a `[data-time-hover-root]` row
 *   (`MessageIconActions`, `clock="start"`, CSS module class `timeStart`).
 * - Assistant messages: `chat/TurnTailNodeView.tsx` renders the clock inside
 *   the turn tail's `[data-time-hover-root]` scope (`clock="end"`, class
 *   `timeEnd`).
 * - Hide mechanism: `chat/MessageIconActions.module.css` hides the labels
 *   with `opacity: 0` inside `@media (hover: hover)` and reveals them on
 *   `:hover` / `:focus-within`. The clock spans are always in the DOM — no
 *   conditional rendering — so a pure CSS visibility override is the whole
 *   feature. No DOM scanning, no observers, no polling.
 * - The client tsdown pipeline builds CSS modules with
 *   `cssModules.pattern = '[hash]_[local]'`, so the built class names
 *   preserve the local names (`[hash]_timeStart` / `[hash]_timeEnd`); the
 *   override targets the stable `data-time-hover-root` anchor plus those
 *   preserved class substrings (see `always-status-bar.css`).
 */
import css from './always-status-bar.css'

// The bundle is a classic script wrapped by build.mjs in the same handoff
// shape as DSH's own client bundles: `var module = { exports: {} }` is
// declared in the banner before this body runs. Everything is exported via
// `module.exports` at the end — no ES export syntax, so the emitted file is
// a plain classic script with no module semantics.
declare const module: { exports: { name: string; apply: typeof apply } }

/** Cordis plugin name; must equal the package name (the graph row id). */
const name = 'dsh-always-status-bar'

/** Stable style tag id, mirroring the native `data-plugin-css` naming (`<id>/<file>`). */
const STYLE_TAG_ID = 'dsh-always-status-bar/always-status-bar.css'

/** Minimal structural view of the Cordis context this plugin uses. */
interface StatusBarPluginContext {
  effect(execute: () => () => void, label: string): unknown
}

/**
 * Inject the always-visible override, scoped to this plugin's fiber: the
 * effect disposer removes the style tag when the plugin unloads, restoring
 * native hover-only behavior with no page reload and no leftover CSS.
 * Re-application is idempotent (the native pipeline uses the same
 * `data-plugin-css` uniqueness guard).
 * @param ctx - the client plugin context.
 */
function apply(ctx: StatusBarPluginContext): void {
  const existing = document.querySelector<HTMLStyleElement>(`style[data-plugin-css=${JSON.stringify(STYLE_TAG_ID)}]`)
  const style: HTMLStyleElement = existing ?? document.createElement('style')
  if (existing === null) {
    style.dataset.plugin = name
    style.dataset.pluginCss = STYLE_TAG_ID
    style.textContent = css
    document.head.appendChild(style)
  }
  ctx.effect(() => () => {
    style.remove()
  }, `${name}: always-visible status bar style`)
}

module.exports = { name, apply }
