import { notFound } from 'next/navigation'
import { getPostsByTag } from '@/lib/queries/posts'
import { getAllTags } from '@/lib/queries/tags'
import ArticleCard from '@/components/article-card'
import { Sidebar } from '@/components/sidebar'

interface TagPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TagPageProps) {
  const { slug } = await params

  try {
    const { tag } = await getPostsByTag(slug)
    return { title: tag.name }
  } catch {
    return { title: 'Tag Not Found' }
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params

  let tag: { id: string; name: string; slug: string; description: string | null }
  let posts: Awaited<ReturnType<typeof getPostsByTag>>['posts']

  try {
    const result = await getPostsByTag(slug)
    tag = result.tag
    posts = result.posts
  } catch {
    notFound()
  }

  const tags = await getAllTags()

  return (
    <div className="min-h-screen">
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold text-[#0045ad]">
          {tag.name}
        </h1>
        {tag.description && (
          <p className="font-[family-name:var(--font-newsreader)] text-[#40484f] mt-2">
            {tag.description}
          </p>
        )}
        <p className="font-[family-name:var(--font-inter)] text-sm text-[#70787f] mt-2">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        </p>
      </div>

      {/* Feed + Sidebar */}
      <div className="flex gap-8">
        <div className="flex-1 space-y-4">
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No posts with this tag yet. Check back soon!
            </p>
          ) : (
            posts.map((post) => (
              <ArticleCard
                key={post.id}
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                coverImageUrl={post.cover_image_url}
                readingTimeMins={post.reading_time_mins}
                publishedAt={post.published_at}
                author={{
                  username: post.author.username,
                  fullName: post.author.full_name,
                  avatarUrl: post.author.avatar_url,
                }}
                tags={post.tags.map((pt) => ({
                  name: pt.tag.name,
                  slug: pt.tag.slug,
                }))}
                clapCount={post.claps.reduce(
                  (sum, c) => sum + (c.count ?? 0),
                  0
                )}
              />
            ))
          )}
        </div>
        <div className="hidden lg:block w-80">
          <Sidebar tags={tags} />
        </div>
      </div>
    </div>
    </div>
  )
}
