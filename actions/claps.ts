'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clapForPost(postId: string, slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Must be signed in to clap' }

  // Check if user already clapped
  const { data: existing } = await supabase
    .from('claps')
    .select('id, count')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    if (existing.count >= 50) return { error: 'Max claps reached' }
    await supabase
      .from('claps')
      .update({ count: existing.count + 1 })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('claps')
      .insert({ post_id: postId, user_id: user.id, count: 1 })
  }

  revalidatePath(`/${slug}`)
  return { success: true }
}
