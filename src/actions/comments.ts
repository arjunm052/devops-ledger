'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createNotification } from '@/actions/notifications'
import { rateLimit } from '@/lib/rate-limit'

const commentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
})

export async function createComment(input: z.infer<typeof commentSchema>, slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Must be signed in to comment' }

  const rl = rateLimit(`comment:${user.id}`, { maxRequests: 10, windowMs: 60_000 })
  if (!rl.success) return { error: 'You are commenting too fast. Please wait a moment.' }

  const parsed = commentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('comments').insert({
    post_id: parsed.data.postId,
    author_id: user.id,
    body: parsed.data.body,
    parent_id: parsed.data.parentId ?? null,
  })

  if (error) return { error: error.message }

  const { data: postData } = await supabase.from('posts').select('author_id').eq('id', parsed.data.postId).single()
  if (postData) {
    await createNotification(postData.author_id, user.id, 'comment', parsed.data.postId)
  }

  revalidatePath(`/${slug}`)
  return { success: true }
}

export async function deleteComment(commentId: string, slug: string) {
  if (!z.string().uuid().safeParse(commentId).success) return { error: 'Invalid comment' }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Must be signed in' }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/${slug}`)
  return { success: true }
}
