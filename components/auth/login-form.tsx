'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { signInWithEmail } from '@/actions/auth'

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    setServerError(null)
    const result = await signInWithEmail(data)
    if (result?.error) setServerError(result.error)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          {/* Email floating label */}
          <div className="relative">
            <input
              id="email"
              type="email"
              placeholder=" "
              {...register('email')}
              className="peer w-full bg-transparent border-0 border-b-2 border-[var(--color-border-subtle)] py-3 px-0 focus:outline-none focus:ring-0 focus:border-[#1a5dd5] transition-colors text-[var(--color-heading)]"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
            <label
              htmlFor="email"
              className="absolute left-0 -top-3.5 text-[var(--color-muted-text)] text-xs transition-all
                peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5
                peer-focus:-top-3.5 peer-focus:text-[#b2c5ff] peer-focus:text-xs cursor-text"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Email address
            </label>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500" style={{ fontFamily: 'var(--font-inter)' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password floating label */}
          <div className="relative">
            <input
              id="password"
              type="password"
              placeholder=" "
              {...register('password')}
              className="peer w-full bg-transparent border-0 border-b-2 border-[var(--color-border-subtle)] py-3 px-0 focus:outline-none focus:ring-0 focus:border-[#1a5dd5] transition-colors text-[var(--color-heading)]"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
            <label
              htmlFor="password"
              className="absolute left-0 -top-3.5 text-[var(--color-muted-text)] text-xs transition-all
                peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5
                peer-focus:-top-3.5 peer-focus:text-[#b2c5ff] peer-focus:text-xs cursor-text"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Password
            </label>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500" style={{ fontFamily: 'var(--font-inter)' }}>
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        {serverError && (
          <p className="text-sm text-red-500" style={{ fontFamily: 'var(--font-inter)' }}>
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] text-white py-4 rounded-full font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#0045ad]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {loading ? 'Signing in…' : 'Continue to DevOps Ledger'}
        </button>
      </form>

      {/* Sign up link */}
      <div className="text-center">
        <p
          className="italic text-[var(--color-muted-text)]"
          style={{ fontFamily: 'var(--font-newsreader)' }}
        >
          No account?{' '}
          <Link
            href="/auth/login"
            className="text-[var(--color-link)] font-bold not-italic hover:underline underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
