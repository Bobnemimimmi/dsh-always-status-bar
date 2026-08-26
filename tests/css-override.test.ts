/**
 * Static conformance test for the override sheet.
 *
 * SPEC §7/§13: the plugin may change exactly one thing — the visibility of
 * the native clock labels. This test guards that contract mechanically: the
 * sheet contains a single rule, it targets only the clock spans inside the
 * stable `data-time-hover-root` anchor, and its only declaration is
 * `opacity: 1 !important`.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/client/always-status-bar.css', import.meta.url), 'utf8')

/** Comment-free, trimmed sheet body. */
const body = css.replace(/\/\*[\s\S]*?\*\//g, '').trim()

function parseRules(sheet: string): Array<{ selector: string; declarations: string[] }> {
  return sheet
    .split('}')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map((part) => {
      const [selector, block] = part.split('{')
      return {
        selector: selector.trim(),
        declarations: block
          .split(';')
          .map(decl => decl.trim())
          .filter(decl => decl.length > 0),
      }
    })
}

describe('always-status-bar.css override contract', () => {
  const rules = parseRules(body)

  it('is exactly one rule', () => {
    expect(rules).toHaveLength(1)
  })

  it('anchors on the stable native scope and only the clock class substrings', () => {
    const { selector } = rules[0]!
    expect(selector).toContain('[data-time-hover-root]')
    expect(selector).toContain('[class*="timeStart"]')
    expect(selector).toContain('[class*="timeEnd"]')
    // Never targets the action buttons that share the row (hashed `.action`,
    // Tooltip anchors, third-party buttons) or anything outside the scope.
    expect(selector).not.toContain('button')
    expect(selector).not.toMatch(/\[class\*="action"\]/)
    // Scoped under the anchor: no unscoped wildcard.
    expect(selector.startsWith('[data-time-hover-root]')).toBe(true)
  })

  it('changes only opacity, and only to fully visible', () => {
    const { declarations } = rules[0]!
    expect(declarations).toHaveLength(1)
    const [property, value] = declarations[0]!.split(':')
    expect(property!.trim()).toBe('opacity')
    expect(value!.trim()).toBe('1 !important')
  })

  it('touches no layout, typography, or color properties anywhere in the sheet', () => {
    const forbidden = ['display', 'visibility', 'position', 'font', 'color', 'margin', 'padding', 'width', 'height', 'content', 'transform', 'transition']
    for (const property of forbidden) {
      expect(body).not.toMatch(new RegExp(`(^|[;{])${property}\\s*:`))
    }
  })
})
