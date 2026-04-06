'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema, otpSchema } from '@/lib/validations/auth'
import type { LoginInput, SignupInput, OtpInput } from '@/lib/validations/auth'

export async function signInWithEmail(input: LoginInput) {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signUpWithEmail(input: SignupInput) {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { user_name: parsed.data.username },
    },
  })

  if (error) return { error: error.message }
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
  const parsed = otpSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  return { success: 'Check your email for the login link.' }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
}
