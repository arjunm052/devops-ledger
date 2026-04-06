'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const commentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
})

export async function createComment(input: z.infer<typeof commentSchema>, slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Must be signed in to comment' }

  const parsed = commentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('comments').insert({
    post_id: parsed.data.postId,
    author_id: user.id,
    body: parsed.data.body,
    parent_id: parsed.data.parentId ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath(`/${slug}`)
  return { success: true }
}

export async function deleteComment(commentId: string, slug: string) {
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
