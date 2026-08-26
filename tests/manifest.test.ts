/**
 * Packaging conformance test: the dual-face manifest and the patch layer the
 * DSH loader machinery consumes.
 *
 * - `dsh.bundle.patch` → the `dsh plugin add` flow appends this package to
 *   `dsh.profile.bundles` and composes the patch layer.
 * - `dsh.client.platform: 'web'` + `exports["./client"]` → the client-modules
 *   node half serves the browser bundle at `/plugins/dsh-always-timestamp/
 *   client.js` and rosters it in `window.__DSH_BOOT__`.
 * - The patch inserts exactly one row (id + name = package name) and
 *   overrides nothing from earlier layers.
 */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('..', import.meta.url)
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as Record<string, any>
const patch = readFileSync(new URL('cordis.patch.yml', root), 'utf8')

describe('package manifest', () => {
  it('is version 0.1.0 under the spec name', () => {
    expect(pkg.name).toBe('dsh-always-timestamp')
    expect(pkg.version).toBe('0.1.0')
  })

  it('declares the bundle patch and the web client manifest', () => {
    expect(pkg.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    expect(pkg.dsh?.client?.platform).toBe('web')
  })

  it('exports the node half, the client bundle, and the metadata subpaths', () => {
    expect(pkg.exports?.['.']).toBe('./lib/index.js')
    expect(pkg.exports?.['./client']).toBe('./lib/client.js')
    expect(pkg.exports?.['./cordis.patch.yml']).toBe('./cordis.patch.yml')
    expect(pkg.exports?.['./package.json']).toBe('./package.json')
  })

  it('ships the built artifacts (committed; no user build needed)', () => {
    for (const file of pkg.files as string[]) {
      expect(existsSync(new URL(file, root))).toBe(true)
    }
  })

  it('carries no runtime dependencies (zero-config, browser-only)', () => {
    expect(pkg.dependencies).toBeUndefined()
  })
})

describe('cordis.patch.yml', () => {
  it('inserts exactly one row, id and name equal to the package name', () => {
    expect(patch).toContain('- insert:')
    expect(patch).toContain('id: dsh-always-timestamp')
    expect(patch).toContain('name: dsh-always-timestamp')
    const insertions = patch.match(/^\s*- id:/gm) ?? []
    expect(insertions).toHaveLength(1)
  })
})

describe('built artifacts', () => {
  it('client bundle is a classic script registering the module-loader handoff', () => {
    const client = readFileSync(new URL('lib/client.js', root), 'utf8')
    expect(client).toContain('window.__ModuleLoader__.load(')
    expect(client).toContain(`id: "dsh-always-timestamp"`)
    expect(client).toContain('factory: (require) =>')
    expect(client).toContain('return module.exports')
    expect(client).toContain('[data-time-hover-root]')
    expect(client).not.toMatch(/^\s*(import|export)\s/m)
  })

  it('node half is an ESM module exporting the plugin shape', () => {
    const index = readFileSync(new URL('lib/index.js', root), 'utf8')
    expect(index).toContain('dsh-always-timestamp')
    expect(index).toContain('export')
  })
})
