// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

describe('createBrowserClient', () => {
  it('exports a createBrowserClient function', async () => {
    const { createBrowserClient } = await import('@/lib/supabase/client')
    expect(typeof createBrowserClient).toBe('function')
  })

  it('returns a supabase client with auth property', async () => {
    const { createBrowserClient } = await import('@/lib/supabase/client')
    const client = createBrowserClient()
    expect(client).toHaveProperty('auth')
    expect(client).toHaveProperty('from')
  })
})
