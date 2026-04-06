import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { searchPosts } from '@/lib/queries/posts'
import { getAllTags } from '@/lib/queries/tags'
import { getBookmarkStatuses } from '@/actions/bookmarks'
import ArticleCard from '@/components/article-card'
import SearchInput from '@/components/search-input'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; sort?: string; category?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `Search results for '${q}'` : 'Search' }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, sort = 'relevance', category } = await searchParams
  const sortBy = (['relevance', 'newest', 'oldest'].includes(sort) ? sort : 'relevance') as 'relevance' | 'newest' | 'oldest'

  const [posts, tags] = await Promise.all([
    q ? searchPosts(q, 20, sortBy, category) : null,
    getAllTags(),
  ])

  const bookmarks = posts ? await getBookmarkStatuses(posts.map((p) => p.id)) : {}

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    sp.set('sort', params.sort ?? sort)
    if (params.category !== undefined) {
      if (params.category) sp.set('category', params.category)
    } else if (category) {
      sp.set('category', category)
    }
    return `/search?${sp.toString()}`
  }

  return (
    <div className="min-h-screen">
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto mb-6">
        <Suspense>
          <SearchInput />
        </Suspense>
      </div>

      {!q && (
        <p className="font-[family-name:var(--font-newsreader)] text-[#40484f] text-center py-12">
          Search for articles on DevOps, Kubernetes, AWS, and more.
        </p>
      )}

      {q && posts && (
        <div className="flex gap-8">
          <div className="flex-1">
            <p className="font-[family-name:var(--font-inter)] text-sm text-[#70787f] mb-4">
              {posts.length} result{posts.length !== 1 ? 's' : ''} for &lsquo;{q}&rsquo;
            </p>

            {posts.length === 0 ? (
              <p className="font-[family-name:var(--font-newsreader)] text-[#40484f] text-center py-12">
                No results found. Try different keywords.
              </p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
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
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block w-64">
            <aside className="sticky top-20 space-y-6">
              <section className="bg-white rounded-xl p-5 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-3">
                  Sort By
                </h3>
                <div className="space-y-1">
                  {(['relevance', 'newest', 'oldest'] as const).map((s) => (
                    <Link
                      key={s}
                      href={buildUrl({ sort: s })}
                      className={`block text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        sortBy === s ? 'bg-[#dae2ff] text-[#0045ad] font-medium' : 'text-[#40484f] hover:bg-muted'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Link>
                  ))}
                </div>
              </section>

              <section className="bg-white rounded-xl p-5 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-3">
                  Category
                </h3>
                <div className="space-y-1">
                  <Link
                    href={buildUrl({ category: '' })}
                    className={`block text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      !category ? 'bg-[#dae2ff] text-[#0045ad] font-medium' : 'text-[#40484f] hover:bg-muted'
                    }`}
                  >
                    All
                  </Link>
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={buildUrl({ category: tag.slug })}
                      className={`block text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        category === tag.slug ? 'bg-[#dae2ff] text-[#0045ad] font-medium' : 'text-[#40484f] hover:bg-muted'
                      }`}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
