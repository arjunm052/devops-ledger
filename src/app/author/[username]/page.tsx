// app/author/[username]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getProfileByUsername } from '@/lib/queries/profiles'
import { getPostsByAuthor } from '@/lib/queries/posts'
import { getBookmarkStatuses } from '@/actions/bookmarks'
import { getFollowStatus, getFollowerCount } from '@/actions/follows'
import { FollowButton } from '@/components/follow-button'
import ArticleCard from '@/components/article-card'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  try {
    const profile = await getProfileByUsername(username)
    return {
      title: profile.full_name ?? profile.username ?? '',
      description: profile.bio ?? `Posts by ${profile.full_name ?? profile.username ?? ''}`,
    }
  } catch {
    return { title: 'Author Not Found' }
  }
}

export default async function AuthorProfilePage({ params }: PageProps) {
  const { username } = await params

  let profile: Awaited<ReturnType<typeof getProfileByUsername>>
  try {
    profile = await getProfileByUsername(username)
  } catch {
    notFound()
  }

  const { posts, total } = await getPostsByAuthor(profile.id, 6)
  const bookmarks = await getBookmarkStatuses(posts.map((p) => p.id))

  const [followStatus, followerCount] = await Promise.all([
    getFollowStatus(profile.id),
    getFollowerCount(profile.id),
  ])

  const totalClaps = posts.reduce(
    (sum, p) => sum + p.claps.reduce((s, c) => s + (c.count ?? 0), 0),
    0
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Profile Hero */}
        <div className="flex flex-col items-center text-center mb-12 w-full max-w-full min-w-0 px-1 sm:px-0">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? profile.username ?? ''}
              width={120}
              height={120}
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

          <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-muted-text)] mt-1">
            @{profile.username}
          </p>

          <div className="mt-3">
            <FollowButton
              authorId={profile.id}
              initialFollowing={followStatus}
              path={`/author/${username}`}
            />
          </div>

          {profile.bio && (
            <p className="font-[family-name:var(--font-newsreader)] text-lg text-[var(--color-body)] mt-4 max-w-xl leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[var(--color-heading)]">
                {total}
              </span>
              <span className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)] block">
                Posts
              </span>
            </div>
            <div className="w-px h-8 bg-[var(--color-border-subtle)]" />
            <div className="text-center">
              <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[var(--color-heading)]">
                {totalClaps >= 1000 ? `${(totalClaps / 1000).toFixed(1)}k` : totalClaps}
              </span>
              <span className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)] block">
                Claps
              </span>
            </div>
            <div className="w-px h-8 bg-[var(--color-border-subtle)]" />
            <div className="text-center">
              <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[var(--color-heading)]">
                {followerCount}
              </span>
              <span className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)] block">
                Followers
              </span>
            </div>
          </div>

          {/* Social Links */}
          {profile.website && (
            <div className="flex items-center gap-3 mt-4">
              <Link
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-link)] hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {profile.website.replace(/^https?:\/\//, '')}
              </Link>
            </div>
          )}
        </div>

        {/* Latest Posts */}
        {posts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[var(--color-heading)]">
                Latest Posts
              </h2>
              {total > 6 && (
                <span className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-link)]">
                  View All
                </span>
              )}
            </div>
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
                  postId={post.id}
                  bookmarked={bookmarks[post.id] ?? false}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
