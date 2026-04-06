// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSignInWithPassword = vi.fn()
const mockSignInWithOAuth = vi.fn()
const mockSignInWithOtp = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/ensure-profile', () => ({
  ensureProfileRow: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
      signInWithOtp: mockSignInWithOtp,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getUser: mockGetUser,
    },
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({
    data: { user: { id: '00000000-0000-4000-8000-000000000001', email: 'test@example.com', user_metadata: {}, app_metadata: {} } },
  })
})

describe('signInWithEmail', () => {
  it('calls supabase signInWithPassword with correct args', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    const { signInWithEmail } = await import('@/actions/auth')
    await signInWithEmail({ email: 'test@example.com', password: 'password123' })
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('returns error message on failure', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    const { signInWithEmail } = await import('@/actions/auth')
    const result = await signInWithEmail({ email: 'test@example.com', password: 'wrongpass1' })
    expect(result?.error).toBe('Invalid credentials')
  })
})

describe('sendOtp', () => {
  it('calls supabase signInWithOtp with email', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null })
    const { sendOtp } = await import('@/actions/auth')
    await sendOtp({ email: 'test@example.com' })
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: { emailRedirectTo: expect.stringContaining('/auth/callback') },
    })
  })
})

describe('signOut', () => {
  it('calls supabase signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    const { signOut } = await import('@/actions/auth')
    await signOut()
    expect(mockSignOut).toHaveBeenCalled()
  })
})
