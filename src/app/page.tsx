import Link from 'next/link'
import Image from 'next/image'
import { getPublishedPosts } from '@/lib/queries/posts'
import { getAllTags } from '@/lib/queries/tags'
import { getBookmarkStatuses } from '@/actions/bookmarks'
import ArticleCard from '@/components/article-card'
import { Sidebar } from '@/components/sidebar'

export default async function HomePage() {
  const [posts, tags] = await Promise.all([getPublishedPosts(20), getAllTags()])
  const bookmarks = await getBookmarkStatuses(posts.map((p) => p.id))

  const heroPost = posts[0] ?? null
  const trendingPosts = posts.slice(1, 4)
  const feedPosts = posts.slice(4)

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Featured Hero */}
        {heroPost && (
          <Link href={`/${heroPost.slug}`} className="block mb-12 group">
            <div className="bg-[var(--color-surface)] rounded-xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-all">
              <div className="flex flex-col md:flex-row">
                {heroPost.cover_image_url && (
                  <div className="md:w-1/2 relative aspect-[16/10] md:aspect-auto md:min-h-[300px]">
                    <Image
                      src={heroPost.cover_image_url}
                      alt={heroPost.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}
                <div className={`p-8 flex flex-col justify-center ${heroPost.cover_image_url ? 'md:w-1/2' : 'w-full'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)]">
                      {heroPost.author.full_name ?? heroPost.author.username}
                    </span>
                    <span className="text-[var(--color-border-subtle)]">&middot;</span>
                    <span className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)]">
                      {heroPost.reading_time_mins} min read
                    </span>
                  </div>
                  <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold text-[var(--color-heading)] group-hover:text-[var(--color-link)] transition-colors">
                    {heroPost.title}
                  </h2>
                  {heroPost.excerpt && (
                    <p className="font-[family-name:var(--font-newsreader)] text-[var(--color-body)] mt-3 line-clamp-3">
                      {heroPost.excerpt}
                    </p>
                  )}
                  <span className="font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--color-link)] mt-4 inline-block">
                    Read Story &rarr;
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* On the Radar */}
        {trendingPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[var(--color-heading)] mb-4">
              On the Radar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="bg-[var(--color-surface)] rounded-xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-all"
                >
                  <span className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)]">
                    {post.author.full_name ?? post.author.username}
                  </span>
                  <h3 className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-[var(--color-heading)] mt-1 line-clamp-2">
                    {post.title}
                  </h3>
                  <span className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)] mt-2 block">
                    {post.reading_time_mins} min read
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Topics of Interest */}
        {tags.length > 0 && (
          <section className="mb-12">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[var(--color-heading)] mb-4">
              Topics of Interest
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="bg-[var(--color-surface-raised)] text-[var(--color-chip-text)] text-sm px-4 py-1.5 rounded-full hover:bg-[rgba(26,93,213,0.2)] transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest Feed + Sidebar */}
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[var(--color-heading)] mb-2">
              Latest Thoughts
            </h2>
            {feedPosts.length === 0 && posts.length <= 4 ? (
              <p className="text-muted-foreground text-center py-12">
                More posts coming soon!
              </p>
            ) : (
              feedPosts.map((post) => (
                <ArticleCard
                  key={post.id}
                  postId={post.id}
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
                  bookmarked={bookmarks[post.id] ?? false}
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
