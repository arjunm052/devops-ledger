'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/actions/notifications'

export async function toggleFollow(authorId: string, path: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Must be signed in to follow' }
  if (user.id === authorId) return { error: 'Cannot follow yourself' }

  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', authorId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', authorId)
    revalidatePath(path)
    return { following: false }
  } else {
    await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: authorId })
    await createNotification(authorId, user.id, 'follow')
    revalidatePath(path)
    return { following: true }
  }
}

export async function getFollowStatus(authorId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', authorId)
    .maybeSingle()

  return !!data
}

export async function getFollowerCount(authorId: string): Promise<number> {
  const supabase = await createServerSupabaseClient()

  const { count } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', authorId)

  return count ?? 0
}
