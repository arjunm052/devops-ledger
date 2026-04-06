import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAllTags() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug, description')
    .order('name')

  if (error) throw error
  return data
}

export async function getTagStats(tagId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: postTags } = await supabase
    .from('post_tags')
    .select('post_id, post:posts!post_tags_post_id_fkey ( status, author_id )')
    .eq('tag_id', tagId)

  const publishedPostTags = (postTags ?? []).filter(
    (pt) => (pt.post as { status: string } | null)?.status === 'published'
  )

  const uniqueAuthors = new Set(
    publishedPostTags.map((pt) => (pt.post as { author_id: string } | null)?.author_id).filter(Boolean)
  )

  return { postCount: publishedPostTags.length, authorCount: uniqueAuthors.size }
}

export async function getRelatedTags(tagId: string, limit = 6) {
  const supabase = await createServerSupabaseClient()

  const { data: postIds } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tagId)

  if (!postIds || postIds.length === 0) return []

  const ids = postIds.map((p) => p.post_id)

  const { data: coTags } = await supabase
    .from('post_tags')
    .select('tag:tags ( id, name, slug )')
    .in('post_id', ids)
    .neq('tag_id', tagId)

  const tagCounts = new Map<string, { id: string; name: string; slug: string; count: number }>()
  for (const row of coTags ?? []) {
    const tag = row.tag as { id: string; name: string; slug: string } | null
    if (!tag) continue
    const existing = tagCounts.get(tag.id)
    if (existing) existing.count++
    else tagCounts.set(tag.id, { ...tag, count: 1 })
  }

  return Array.from(tagCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export async function getTopWritersForTag(tagId: string, limit = 5) {
  const supabase = await createServerSupabaseClient()

  const { data: postTags } = await supabase
    .from('post_tags')
    .select('post:posts!post_tags_post_id_fkey ( author_id, status, author:profiles!posts_author_id_fkey ( id, full_name, username, avatar_url ) )')
    .eq('tag_id', tagId)

  const authorCounts = new Map<string, { id: string; full_name: string | null; username: string; avatar_url: string | null; count: number }>()

  for (const row of postTags ?? []) {
    const post = row.post as { author_id: string; status: string; author: { id: string; full_name: string | null; username: string; avatar_url: string | null } } | null
    if (!post || post.status !== 'published') continue
    const a = post.author
    const existing = authorCounts.get(a.id)
    if (existing) existing.count++
    else authorCounts.set(a.id, { ...a, count: 1 })
  }

  return Array.from(authorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
