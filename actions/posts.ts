'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function deletePost(postId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify the post belongs to this author
  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id')
    .eq('id', postId)
    .single()

  if (!post || post.author_id !== user.id) return { error: 'Forbidden' }

  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/')
}
