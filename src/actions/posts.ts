'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function estimateReadingTime(content: unknown): number {
  const text = JSON.stringify(content)
  const words = text.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export interface CreatePostInput {
  title: string
  content: unknown
  excerpt?: string | null
  cover_image_url?: string | null
  tag_ids?: string[]
  status: 'draft' | 'published'
}

export async function createPost(input: CreatePostInput): Promise<{ postId: string; slug: string }> {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'author') redirect('/dashboard')

  const baseSlug = slugify(input.title) || 'untitled'
  const slug = `${baseSlug}-${Date.now()}`

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: input.title,
      content: input.content as never,
      excerpt: input.excerpt ?? null,
      cover_image_url: input.cover_image_url ?? null,
      slug,
      status: input.status,
      author_id: user.id,
      reading_time_mins: estimateReadingTime(input.content),
      published_at: input.status === 'published' ? new Date().toISOString() : null,
    })
    .select('id, slug')
    .single()

  if (error || !post) {
    throw new Error(error?.message ?? 'Failed to create post')
  }

  // Insert post tags
  if (input.tag_ids && input.tag_ids.length > 0) {
    await supabase.from('post_tags').insert(
      input.tag_ids.map((tag_id) => ({ post_id: post.id, tag_id }))
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/')

  return { postId: post.id, slug: post.slug }
}

export interface UpdatePostInput {
  title?: string
  content?: unknown
  excerpt?: string | null
  cover_image_url?: string | null
  tag_ids?: string[]
  status?: 'draft' | 'published'
}

export async function updatePost(postId: string, input: UpdatePostInput): Promise<void> {
  if (!uuidSchema.safeParse(postId).success) return

  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, status')
    .eq('id', postId)
    .single()

  if (!post || post.author_id !== user.id) return

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.title !== undefined) updates.title = input.title
  if (input.content !== undefined) {
    updates.content = input.content
    updates.reading_time_mins = estimateReadingTime(input.content)
  }
  if (input.excerpt !== undefined) updates.excerpt = input.excerpt
  if (input.cover_image_url !== undefined) updates.cover_image_url = input.cover_image_url
  if (input.status !== undefined) {
    updates.status = input.status
    if (input.status === 'published' && post.status !== 'published') {
      updates.published_at = new Date().toISOString()
    }
  }

  await supabase.from('posts').update(updates).eq('id', postId)

  // Update tags: delete all existing, re-insert
  if (input.tag_ids !== undefined) {
    await supabase.from('post_tags').delete().eq('post_id', postId)
    if (input.tag_ids.length > 0) {
      await supabase.from('post_tags').insert(
        input.tag_ids.map((tag_id) => ({ post_id: postId, tag_id }))
      )
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/')
}

export async function deletePost(postId: string): Promise<void> {
  if (!uuidSchema.safeParse(postId).success) return

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
