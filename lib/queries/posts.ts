import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getPublishedPosts(limit = 10, offset = 0) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      id, title, slug, excerpt, cover_image_url, reading_time_mins, published_at, created_at,
      author:profiles!posts_author_id_fkey ( id, full_name, username, avatar_url ),
      tags:post_tags ( tag:tags ( id, name, slug ) ),
      claps ( count )
      `
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getPostBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      id, title, slug, excerpt, content, cover_image_url, reading_time_mins, published_at, created_at, updated_at,
      author:profiles!posts_author_id_fkey ( id, full_name, username, avatar_url, bio ),
      tags:post_tags ( tag:tags ( id, name, slug ) ),
      claps ( count ),
      comments ( id, body, created_at, parent_id, author:profiles!comments_author_id_fkey ( id, full_name, username, avatar_url ) )
      `
    )
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

export async function getPostsByTag(tagSlug: string, limit = 10, offset = 0) {
  const supabase = await createServerSupabaseClient()

  // First fetch the tag by slug
  const { data: tag, error: tagError } = await supabase
    .from('tags')
    .select('id, name, slug, description')
    .eq('slug', tagSlug)
    .single()

  if (tagError) throw tagError

  // Then fetch posts that have this tag via post_tags join
  const { data: postTags, error: postTagsError } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tag.id)

  if (postTagsError) throw postTagsError

  const postIds = postTags.map((pt) => pt.post_id)

  if (postIds.length === 0) {
    return { tag, posts: [] }
  }

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(
      `
      id, title, slug, excerpt, cover_image_url, reading_time_mins, published_at, created_at,
      author:profiles!posts_author_id_fkey ( id, full_name, username, avatar_url ),
      tags:post_tags ( tag:tags ( id, name, slug ) ),
      claps ( count )
      `
    )
    .in('id', postIds)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (postsError) throw postsError

  return { tag, posts }
}

export async function searchPosts(query: string, limit = 10) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      id, title, slug, excerpt, cover_image_url, reading_time_mins, published_at, created_at,
      author:profiles!posts_author_id_fkey ( id, full_name, username, avatar_url ),
      tags:post_tags ( tag:tags ( id, name, slug ) ),
      claps ( count )
      `
    )
    .eq('status', 'published')
    .textSearch('fts', query, { type: 'websearch' })
    .limit(limit)

  if (error) throw error
  return data
}
