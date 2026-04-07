// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { loginSchema, signupSchema, otpSchema } from '@/lib/validations/auth'

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'Password123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'Password123' })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 chars', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'short' })
    expect(result.success).toBe(false)
  })
})

describe('signupSchema', () => {
  it('accepts valid signup data', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'Password123',
      username: 'testuser',
    })
    expect(result.success).toBe(true)
  })

  it('rejects username with spaces', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'Password123',
      username: 'test user',
    })
    expect(result.success).toBe(false)
  })
})

describe('otpSchema', () => {
  it('accepts valid email', () => {
    const result = otpSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = otpSchema.safeParse({ email: 'not-email' })
    expect(result.success).toBe(false)
  })
})
