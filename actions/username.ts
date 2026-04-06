'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureProfileRow } from '@/lib/supabase/ensure-profile'
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

  await ensureProfileRow(supabase, user)

  // Check if user already has a username (can't change it)
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

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

  // Backfill avatar_url and full_name from OAuth provider metadata so the
  // profile picture and display name show up immediately after first sign-in.
  const metaAvatarUrl: string | null =
    user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null
  const metaFullName: string | null =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? null

  const updatePayload: Record<string, string | null> = { username: parsed.data }
  if (metaAvatarUrl) updatePayload.avatar_url = metaAvatarUrl
  if (metaFullName) updatePayload.full_name = metaFullName

  if (!profile) {
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      username: parsed.data,
      full_name: metaFullName,
      avatar_url: metaAvatarUrl,
    })
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)
    if (error) return { error: error.message }
  }

  redirect('/')
}
