// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getProfileByUsername', () => {
  it('queries profiles table with the given username', async () => {
    const mockProfile = {
      id: 'user-123',
      full_name: 'Test User',
      username: 'testuser',
      avatar_url: null,
      bio: 'A test bio',
      website: null,
      role: 'author',
      created_at: '2024-01-01T00:00:00Z',
    }
    mockSingle.mockResolvedValue({ data: mockProfile, error: null })

    const { getProfileByUsername } = await import('@/lib/queries/profiles')
    const result = await getProfileByUsername('testuser')

    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockSelect).toHaveBeenCalledWith(
      'id, full_name, username, avatar_url, bio, website, role, created_at'
    )
    expect(mockEq).toHaveBeenCalledWith('username', 'testuser')
    expect(mockSingle).toHaveBeenCalled()
    expect(result).toEqual(mockProfile)
  })

  it('throws when supabase returns an error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error('Not found') })

    const { getProfileByUsername } = await import('@/lib/queries/profiles')
    await expect(getProfileByUsername('nonexistent')).rejects.toThrow('Not found')
  })
})
