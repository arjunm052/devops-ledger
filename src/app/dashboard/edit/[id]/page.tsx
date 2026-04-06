import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureProfileRow } from '@/lib/supabase/ensure-profile'
import { getAllTags } from '@/lib/queries/tags'
import PostEditor from '@/components/editor/editor-page'

export const metadata: Metadata = { title: 'Edit Article – The DevOps Ledger' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  await ensureProfileRow(supabase, user)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, username, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'author') redirect('/dashboard')

  const { data: post, error } = await supabase
    .from('posts')
    .select(
      'id, title, content, excerpt, cover_image_url, status, post_tags ( tag_id )'
    )
    .eq('id', id)
    .eq('author_id', user.id)
    .maybeSingle()

  if (error || !post) notFound()

  const tagRows = (post.post_tags as { tag_id: string }[] | null) ?? []
  const tagIds = tagRows.map((r) => r.tag_id)

  const allTags = await getAllTags()

  return (
    <PostEditor
      allTags={allTags}
      authorPreview={{
        fullName: profile?.full_name ?? null,
        username: profile?.username ?? '',
        avatarUrl: profile?.avatar_url ?? null,
      }}
      initialData={{
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        cover_image_url: post.cover_image_url,
        status: post.status as 'draft' | 'published',
        tagIds,
      }}
    />
  )
}
