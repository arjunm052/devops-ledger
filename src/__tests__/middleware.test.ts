// @vitest-environment node
import { describe, it, expect } from 'vitest'

describe('middleware config', () => {
  it('exports a config with matcher that includes dashboard routes', async () => {
    const mod = await import('@/middleware')
    expect(mod.config).toBeDefined()
    expect(mod.config.matcher).toBeDefined()
    const matchers = mod.config.matcher as string[]
    expect(matchers.some(m => m.includes('dashboard'))).toBe(true)
  })
})
