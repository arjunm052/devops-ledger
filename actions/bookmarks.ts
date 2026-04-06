'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleBookmark(postId: string, path: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Must be signed in to bookmark' }

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)
    revalidatePath(path)
    return { bookmarked: false }
  } else {
    await supabase
      .from('bookmarks')
      .insert({ post_id: postId, user_id: user.id })
    revalidatePath(path)
    return { bookmarked: true }
  }
}

export async function getBookmarkStatus(postId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  return !!data
}

export async function getBookmarkStatuses(postIds: string[]): Promise<Record<string, boolean>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || postIds.length === 0) return {}

  const { data } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('user_id', user.id)
    .in('post_id', postIds)

  const bookmarked: Record<string, boolean> = {}
  for (const id of postIds) bookmarked[id] = false
  for (const row of data ?? []) bookmarked[row.post_id] = true
  return bookmarked
}
