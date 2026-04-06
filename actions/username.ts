'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const usernameSchema = z
  .string()
  .min(3, 'At least 3 characters')
  .max(30, 'Max 30 characters')
  .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, hyphens, underscores only')

export async function setUsername(username: string): Promise<{ error: string } | never> {
  const parsed = usernameSchema.safeParse(username)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if user already has a username (can't change it)
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (profile?.username) {
    return { error: 'Username is already set and cannot be changed.' }
  }

  // Check if username is taken
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', parsed.data)
    .maybeSingle()

  if (existing) {
    return { error: 'That username is already taken.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: parsed.data })
    .eq('id', user.id)

  if (error) return { error: error.message }

  redirect('/dashboard')
}
