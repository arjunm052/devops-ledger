import { Suspense } from 'react'
import { Metadata } from 'next'
import { searchPosts } from '@/lib/queries/posts'
import ArticleCard from '@/components/article-card'
import SearchInput from '@/components/search-input'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Search results for '${q}'` : 'Search',
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const posts = q ? await searchPosts(q) : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Suspense>
          <SearchInput />
        </Suspense>

        {!q && (
          <p className="text-muted-foreground text-center py-12">
            Search for articles on DevOps, Kubernetes, AWS, and more.
          </p>
        )}

        {q && posts && posts.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            No results found for &lsquo;{q}&rsquo;. Try different keywords.
          </p>
        )}

        {q && posts && posts.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              {posts.length} result{posts.length !== 1 ? 's' : ''} for &lsquo;{q}&rsquo;
            </p>
            <div className="space-y-4">
              {posts.map((post) => (
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
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
