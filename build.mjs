/**
 * Build both halves of the dsh-always-timestamp package with esbuild.
 *
 * - `lib/index.js`  — the node half (ESM): a no-op Cordis plugin the host
 *   Loader imports for the bundle's patch row.
 * - `lib/client.js` — the browser half: a classic script registering the
 *   lazy factory with `window.__ModuleLoader__`, wrapped in the same
 *   banner/footer handoff shape as DSH's own client bundles (see
 *   `packages/client/tsdown.client.ts` in the DSH checkout). The stylesheet
 *   is inlined as a text constant, so no CSS pipeline is needed.
 *
 * The built artifacts are committed, so path/tarball installs need no build
 * step; `prepare` re-runs this build after a git install.
 */
import { build } from 'esbuild'

const PACKAGE_ID = 'dsh-always-timestamp'

const clientBanner = [
  `window.__ModuleLoader__.load({`,
  `  id: ${JSON.stringify(PACKAGE_ID)},`,
  `  factory: (require) => {`,
  `    var module = { exports: {} };`,
  `    var exports = module.exports;`,
].join('\n')

const clientFooter = [
  `    return module.exports;`,
  `  },`,
  `});`,
].join('\n')

await Promise.all([
  build({
    entryPoints: ['src/index.ts'],
    outfile: 'lib/index.js',
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    logLevel: 'info',
  }),
  build({
    entryPoints: ['src/client/index.ts'],
    outfile: 'lib/client.js',
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: 'es2018',
    loader: { '.css': 'text' },
    banner: { js: clientBanner },
    footer: { js: clientFooter },
    // `lib/client.js` is a browser classic script, never a Node module:
    // silence the advisory CJS-in-ESM warning the package.json "type" trips.
    logOverride: { 'commonjs-variable-in-esm': 'silent' },
    logLevel: 'info',
  }),
])
