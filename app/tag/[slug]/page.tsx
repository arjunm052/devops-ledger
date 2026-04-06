import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPostsByTag } from '@/lib/queries/posts'
import { getTagStats, getRelatedTags, getTopWritersForTag } from '@/lib/queries/tags'
import { getBookmarkStatuses } from '@/actions/bookmarks'
import ArticleCard from '@/components/article-card'

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

  const [tagStats, relatedTags, topWriters] = await Promise.all([
    getTagStats(tag.id),
    getRelatedTags(tag.id),
    getTopWritersForTag(tag.id),
  ])
  const bookmarks = await getBookmarkStatuses(posts.map((p) => p.id))

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
          {tagStats.postCount} {tagStats.postCount === 1 ? 'Post' : 'Posts'} &middot; {tagStats.authorCount} {tagStats.authorCount === 1 ? 'Writer' : 'Writers'}
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
                  username: post.author.username ?? '',
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
                postId={post.id}
                bookmarked={bookmarks[post.id] ?? false}
              />
            ))
          )}
        </div>
        <div className="hidden lg:block w-80">
          <aside className="sticky top-20 space-y-4">
            {relatedTags.length > 0 && (
              <section className="bg-white rounded-xl p-6 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-3">Related Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {relatedTags.map((t) => (
                    <Link key={t.id} href={`/tag/${t.slug}`} className="bg-[#dae2ff] text-[#001848] text-xs px-3 py-1 rounded-full hover:bg-[#c4d0f5] transition-colors">{t.name}</Link>
                  ))}
                </div>
              </section>
            )}
            {topWriters.length > 0 && (
              <section className="bg-white rounded-xl p-6 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-3">Top Writers</h3>
                <div className="space-y-3">
                  {topWriters.map((writer) => (
                    <Link key={writer.id} href={`/author/${writer.username}`} className="flex items-center gap-3 group">
                      <span className="w-8 h-8 rounded-full bg-[#dae2ff] inline-flex items-center justify-center text-xs font-medium text-[#0045ad] shrink-0">
                        {(writer.full_name ?? writer.username).charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <span className="font-[family-name:var(--font-inter)] text-sm font-medium text-[#0d1c2e] group-hover:text-[#0045ad] transition-colors">{writer.full_name ?? writer.username}</span>
                        <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f] block">{writer.count} post{writer.count !== 1 ? 's' : ''}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <section className="bg-white rounded-xl p-6 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-2">The Weekly Deploy</h3>
              <p className="font-[family-name:var(--font-newsreader)] text-sm text-[#40484f] mb-3">Curated DevOps insights, delivered weekly.</p>
              <p className="text-xs text-[#70787f] italic">Coming soon</p>
            </section>
          </aside>
        </div>
      </div>
    </div>
    </div>
  )
}
