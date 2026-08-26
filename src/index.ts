/**
 * dsh-always-timestamp — Host (Node) half.
 *
 * The plugin's entire function lives in the browser half (`./client`): one
 * scoped CSS override that keeps DSH's native message clock labels visible.
 * This host half exists only so the package can be a Loader row: the
 * client-modules node half scans loader entries for packages that declare
 * `dsh.client`, and an entry must import and activate to be scanned into the
 * `window.__DSH_BOOT__` graph.
 *
 * No host behavior lives here on purpose — keep it that way.
 */

/** Cordis plugin display name (the Loader row resolves this module by package name). */
export const name = 'dsh-always-timestamp'

/**
 * Host-side apply: intentionally a no-op. All behavior is browser-side CSS.
 * @param ctx - the host plugin context (unused).
 */
export function apply(_ctx: unknown): void {}
