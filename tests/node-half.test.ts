import { describe, expect, it } from 'vitest'
import { apply, name } from '../src/index'

describe('node half', () => {
  it('exports the plugin display name (the Loader row id)', () => {
    expect(name).toBe('dsh-always-timestamp')
  })

  it('apply is a silent no-op: no host services, no side effects, never throws', () => {
    expect(typeof apply).toBe('function')
    expect(() => { apply({} as never) }).not.toThrow()
    expect(apply({} as never)).toBeUndefined()
  })
})
