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
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-[#0d1c2e] mb-4">
            About
          </h1>
          <p className="font-[family-name:var(--font-newsreader)] text-[#40484f]">
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
      {/* Author Profile */}
      <div className="flex flex-col items-center text-center mb-12">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.full_name ?? profile.username ?? ''}
            width={120}
            height={120}
            className="rounded-full w-[120px] h-[120px] object-cover mb-5"
          />
        ) : (
          <span className="w-[120px] h-[120px] rounded-full bg-[#dae2ff] inline-flex items-center justify-center text-4xl font-medium text-[#0045ad] mb-5">
            {(profile.full_name ?? profile.username ?? '').charAt(0).toUpperCase()}
          </span>
        )}

        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-[#0d1c2e]">
          {profile.full_name ?? profile.username}
        </h1>

        <p className="font-[family-name:var(--font-inter)] text-sm text-[#70787f] mt-1">@{profile.username}</p>

        <p className="font-[family-name:var(--font-newsreader)] text-lg text-[#40484f] mt-4 max-w-xl leading-relaxed">
          {profile.bio ??
            'Engineering insights, architecture deep-dives, and DevOps patterns from the trenches.'}
        </p>

        {profile.website && (
          <Link
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="font-[family-name:var(--font-inter)] mt-3 text-sm font-medium text-[#0045ad] hover:underline"
          >
            {profile.website}
          </Link>
        )}
      </div>

      {/* Topics */}
      {tags.length > 0 && (
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-4">
            Topics I write about
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="bg-[#dae2ff] text-[#001848] text-xs px-3 py-1 rounded-full hover:bg-[#c4d0f5] transition-colors"
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
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-4">
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
