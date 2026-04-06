import Image from 'next/image'
import Link from 'next/link'
import { getAuthorProfile } from '@/lib/queries/profiles'
import { getPublishedPosts } from '@/lib/queries/posts'
import { getAllTags } from '@/lib/queries/tags'
import ArticleCard from '@/components/article-card'

export const metadata = {
  title: 'About',
}

export default async function AboutPage() {
  let profile: Awaited<ReturnType<typeof getAuthorProfile>> | null = null

  try {
    profile = await getAuthorProfile()
  } catch {
    // profile not found
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold mb-4">
          About
        </h1>
        <p className="text-muted-foreground">
          Author profile not found. Please check back later.
        </p>
      </div>
    )
  }

  const [posts, tags] = await Promise.all([
    getPublishedPosts(3),
    getAllTags(),
  ])

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Author Profile */}
      <div className="flex flex-col items-center text-center mb-12">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.full_name ?? profile.username}
            width={128}
            height={128}
            className="rounded-full w-32 h-32 object-cover mb-5"
          />
        ) : (
          <span className="w-32 h-32 rounded-full bg-muted inline-flex items-center justify-center text-4xl font-medium text-muted-foreground mb-5">
            {(profile.full_name ?? profile.username).charAt(0).toUpperCase()}
          </span>
        )}

        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold tracking-tight">
          {profile.full_name ?? profile.username}
        </h1>

        <p className="text-muted-foreground mt-1">@{profile.username}</p>

        <p className="font-[family-name:var(--font-newsreader)] text-lg text-muted-foreground mt-4 max-w-xl leading-relaxed">
          {profile.bio ??
            'Engineering insights, architecture deep-dives, and DevOps patterns from the trenches.'}
        </p>

        {profile.website && (
          <Link
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            {profile.website}
          </Link>
        )}
      </div>

      {/* Topics */}
      {tags.length > 0 && (
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Topics I write about
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="bg-primary/5 hover:bg-primary/10 text-primary text-sm px-3 py-1 rounded-full transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Posts */}
      {posts.length > 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Latest Posts
          </h2>
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
        </section>
      )}
    </div>
  )
}
