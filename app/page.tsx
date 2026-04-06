import { getPublishedPosts } from '@/lib/queries/posts'
import { getAllTags } from '@/lib/queries/tags'
import ArticleCard from '@/components/article-card'
import { Sidebar } from '@/components/sidebar'

export default async function HomePage() {
  const [posts, tags] = await Promise.all([getPublishedPosts(), getAllTags()])

  return (
    <div className="bg-[#eff4ff] min-h-screen">
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        <div className="flex-1 space-y-4">
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No posts yet. Check back soon!
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
