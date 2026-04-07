'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureProfileRow } from '@/lib/supabase/ensure-profile'
import { loginSchema, signupSchema, otpSchema } from '@/lib/validations/auth'
import type { LoginInput, SignupInput, OtpInput } from '@/lib/validations/auth'
import { rateLimit } from '@/lib/rate-limit'

async function getClientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
}

export async function signInWithEmail(input: LoginInput) {
  const ip = await getClientIp()
  const rl = rateLimit(`signin:${ip}`, { maxRequests: 10, windowMs: 60_000 })
  if (!rl.success) return { error: 'Too many sign-in attempts. Please wait a minute and try again.' }

  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) return { error: 'Invalid email or password.' }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) await ensureProfileRow(supabase, user)

  redirect('/dashboard')
}

export async function signUpWithEmail(input: SignupInput) {
  const ip = await getClientIp()
  const rl = rateLimit(`signup:${ip}`, { maxRequests: 5, windowMs: 60_000 })
  if (!rl.success) return { error: 'Too many sign-up attempts. Please wait a minute and try again.' }

  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { user_name: parsed.data.username },
    },
  })

  if (error) return { error: 'Unable to create account. Please try again.' }
  return { success: 'Check your email to confirm your account.' }
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
}

export async function sendOtp(input: OtpInput) {
  const ip = await getClientIp()
  const rl = rateLimit(`otp:${ip}`, { maxRequests: 3, windowMs: 60_000 })
  if (!rl.success) return { error: 'Too many requests. Please wait a minute and try again.' }

  const parsed = otpSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: 'Unable to send login link. Please try again.' }
  return { success: 'Check your email for the login link.' }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
}
