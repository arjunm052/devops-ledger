'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface UpdateProfileData {
  fullName: string
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

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName || null,
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
  revalidatePath('/', 'layout')

  return { success: true }
}
