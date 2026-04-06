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
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-[var(--color-heading)] mb-4">
            About
          </h1>
          <p className="font-[family-name:var(--font-newsreader)] text-[var(--color-body)]">
            Author profile not found. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  const [posts, tags] = await Promise.all([
    getPublishedPosts(3),
    getAllTags(),
  ])

  return (
    <div className="min-h-screen">
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Author Profile — w-full min-w-0 so long names wrap instead of clipping in flex column */}
      <div className="flex flex-col items-center text-center mb-12 w-full max-w-full min-w-0 px-1 sm:px-0">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt=""
            width={120}
            height={120}
            priority
            className="rounded-full w-[120px] h-[120px] object-cover mb-5 shrink-0"
          />
        ) : (
          <span className="w-[120px] h-[120px] rounded-full bg-[var(--color-surface-raised)] inline-flex items-center justify-center text-4xl font-medium text-[var(--color-link)] mb-5 shrink-0 leading-none">
            {(profile.full_name ?? profile.username ?? '').charAt(0).toUpperCase()}
          </span>
        )}

        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-normal text-[var(--color-heading)] w-full max-w-full min-w-0 break-words leading-snug py-1">
          {profile.full_name ?? profile.username}
        </h1>

        <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-muted-text)] mt-1">@{profile.username}</p>

        <p className="font-[family-name:var(--font-newsreader)] text-lg text-[var(--color-body)] mt-4 max-w-xl leading-relaxed">
          {profile.bio ??
            'Engineering insights, architecture deep-dives, and DevOps patterns from the trenches.'}
        </p>

        {profile.website && (
          <Link
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="font-[family-name:var(--font-inter)] mt-3 text-sm font-medium text-[var(--color-link)] hover:underline"
          >
            {profile.website}
          </Link>
        )}
      </div>

      {/* Topics */}
      {tags.length > 0 && (
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[var(--color-heading)] mb-4">
            Topics I write about
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="bg-[var(--color-surface-raised)] text-[var(--color-chip-text)] text-xs px-3 py-1 rounded-full hover:bg-[rgba(26,93,213,0.2)] transition-colors"
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
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[var(--color-heading)] mb-4">
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
              />
            ))}
          </div>
        </section>
      )}
    </div>
    </div>
  )
}
