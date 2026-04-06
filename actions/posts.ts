'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function deletePost(postId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Verify the post belongs to this author
  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id')
    .eq('id', postId)
    .single()

  if (!post || post.author_id !== user.id) return

  await supabase.from('posts').delete().eq('id', postId)

  revalidatePath('/dashboard')
  revalidatePath('/')
}
