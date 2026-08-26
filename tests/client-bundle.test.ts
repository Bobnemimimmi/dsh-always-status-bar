// @vitest-environment jsdom
/**
 * Lifecycle test over the BUILT browser bundle (`lib/client.js`, produced by
 * build.mjs before `pnpm test`). Evaluates the classic script exactly the
 * way the DSH shell does (a same-origin `<script>` whose globals are the
 * page window/document) and drives the cordis handoff:
 *
 * 1. the bundle registers one `__ModuleLoader__` handoff with the package id;
 * 2. the factory materializes with zero `require` edges (no cross-package
 *    coupling — the whole feature is self-contained);
 * 3. `apply` injects exactly one `<style data-plugin>` tag carrying the
 *    override, idempotently under double application;
 * 4. the effect disposer removes the tag — unload restores native behavior
 *    with no leftover CSS.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

// jsdom rewrites import.meta.url to a served http URL, so read the built
// artifact relative to the project root (the cwd `pnpm test` runs from).
const bundle = readFileSync(resolve(process.cwd(), 'lib/client.js'), 'utf8')

interface Handoff {
  id: string
  factory: (require: (spec: string) => unknown) => Record<string, unknown>
}

interface FakeContext {
  effect(execute: () => () => void, label: string): unknown
}

interface LoadResult {
  handoffs: Handoff[]
  plugin: Record<string, unknown>
  ctx: FakeContext
  disposers: Array<{ run: () => void; label: string }>
}

const styleTags = (): NodeListOf<HTMLStyleElement> =>
  document.querySelectorAll('style[data-plugin="dsh-always-timestamp"]')

function loadBundleInWindow(): LoadResult {
  const handoffs: Handoff[] = []
  const win = window as Window & { __ModuleLoader__?: { load(handoff: Handoff): void } }
  win.__ModuleLoader__ = {
    load(handoff) { handoffs.push(handoff) },
  }
  // The bundle is a classic script (no import/export at top level); it
  // reaches `window` and `document` as globals, passed in explicitly here.
  new Function('window', 'document', bundle)(win, document)

  const disposers: LoadResult['disposers'] = []
  const ctx: FakeContext = {
    effect(execute, label) {
      disposers.push({ run: execute(), label })
    },
  }
  const plugin = handoffs[0]!.factory((spec) => {
    throw new Error(`unexpected require("${spec}") — the bundle must be self-contained`)
  })
  return { handoffs, plugin, ctx, disposers }
}

describe('built client bundle', () => {
  beforeEach(() => {
    for (const tag of styleTags()) tag.remove()
  })

  it('registers exactly one module-loader handoff under the package id', () => {
    const { handoffs } = loadBundleInWindow()
    expect(handoffs).toHaveLength(1)
    expect(handoffs[0]!.id).toBe('dsh-always-timestamp')
  })

  it('materializes the cordis plugin shape with zero require edges', () => {
    const { plugin } = loadBundleInWindow()
    expect(plugin.name).toBe('dsh-always-timestamp')
    expect(typeof plugin.apply).toBe('function')
  })

  it('apply injects one tagged style carrying the override', () => {
    const { plugin, ctx } = loadBundleInWindow()
    ;(plugin.apply as (ctx: FakeContext) => void)(ctx)
    const tags = styleTags()
    expect(tags).toHaveLength(1)
    expect(tags[0]!.getAttribute('data-plugin-css')).toBe('dsh-always-timestamp/always-timestamp.css')
    expect(tags[0]!.textContent).toContain('[data-time-hover-root]')
    expect(tags[0]!.textContent).toContain('opacity: 1 !important')
  })

  it('registers one effect per apply; the disposer removes the style tag', () => {
    const { plugin, ctx, disposers } = loadBundleInWindow()
    ;(plugin.apply as (ctx: FakeContext) => void)(ctx)
    expect(disposers).toHaveLength(1)
    expect(disposers[0]!.label).toBe('dsh-always-timestamp: always-visible timestamp style')
    disposers[0]!.run()
    expect(styleTags()).toHaveLength(0)
  })

  it('double apply stays idempotent (one tag) and re-injects after teardown', () => {
    const { plugin, ctx, disposers } = loadBundleInWindow()
    const apply = plugin.apply as (ctx: FakeContext) => void
    apply(ctx)
    apply(ctx)
    expect(styleTags()).toHaveLength(1)
    // Tear both fibers down: removal is a no-op the second time.
    for (const disposer of disposers) disposer.run()
    expect(styleTags()).toHaveLength(0)
    // A later activation re-injects the sheet.
    apply(ctx)
    expect(styleTags()).toHaveLength(1)
  })
})
