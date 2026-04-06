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
            <div className="bg-white rounded-xl overflow-hidden shadow-[0_8px_40px_rgba(13,28,46,0.06)] hover:shadow-[0_8px_40px_rgba(13,28,46,0.12)] transition-all">
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
                    <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f]">
                      {heroPost.author.full_name ?? heroPost.author.username}
                    </span>
                    <span className="text-[#bfc7d0]">&middot;</span>
                    <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f]">
                      {heroPost.reading_time_mins} min read
                    </span>
                  </div>
                  <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold text-[#0d1c2e] group-hover:text-[#0045ad] transition-colors">
                    {heroPost.title}
                  </h2>
                  {heroPost.excerpt && (
                    <p className="font-[family-name:var(--font-newsreader)] text-[#40484f] mt-3 line-clamp-3">
                      {heroPost.excerpt}
                    </p>
                  )}
                  <span className="font-[family-name:var(--font-inter)] text-sm font-medium text-[#0045ad] mt-4 inline-block">
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
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-4">
              On the Radar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="bg-white rounded-xl p-5 shadow-[0_8px_40px_rgba(13,28,46,0.06)] hover:shadow-[0_8px_40px_rgba(13,28,46,0.12)] transition-all"
                >
                  <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f]">
                    {post.author.full_name ?? post.author.username}
                  </span>
                  <h3 className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-[#0d1c2e] mt-1 line-clamp-2">
                    {post.title}
                  </h3>
                  <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f] mt-2 block">
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
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-4">
              Topics of Interest
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="bg-[#dae2ff] text-[#001848] text-sm px-4 py-1.5 rounded-full hover:bg-[#c4d0f5] transition-colors"
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
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-2">
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
