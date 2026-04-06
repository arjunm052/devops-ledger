import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thedevopsledger.com'

  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const { data: tags } = await supabase
    .from('tags')
    .select('slug')

  const postEntries: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly',
  }))

  const tagEntries: MetadataRoute.Sitemap = (tags ?? []).map((tag) => ({
    url: `${baseUrl}/tag/${tag.slug}`,
    changeFrequency: 'weekly',
  }))

  return [
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly' },
    { url: `${baseUrl}/tags`, changeFrequency: 'weekly' },
    { url: `${baseUrl}/search`, changeFrequency: 'monthly' },
    ...postEntries,
    ...tagEntries,
  ]
}
