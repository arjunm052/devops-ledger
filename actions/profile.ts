'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface UpdateProfileData {
  fullName: string
  username: string
  bio: string
  website: string
  avatarUrl: string
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  // Check if username is taken by another user
  if (data.username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', data.username)
      .neq('id', user.id)
      .maybeSingle()

    if (existing) {
      return { error: 'That username is already taken.' }
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName || null,
      username: data.username,
      bio: data.bio || null,
      website: data.website || null,
      avatar_url: data.avatarUrl || null,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  revalidatePath('/about')

  return { success: true }
}
