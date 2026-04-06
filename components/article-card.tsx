import Link from 'next/link'
import Image from 'next/image'

interface ArticleCardProps {
  title: string
  slug: string
  excerpt: string | null
  coverImageUrl: string | null
  readingTimeMins: number
  publishedAt: string | null
  author: {
    username: string
    fullName: string | null
    avatarUrl: string | null
  }
  tags: { name: string; slug: string }[]
  clapCount: number
}

export default function ArticleCard({
  title,
  slug,
  excerpt,
  coverImageUrl,
  readingTimeMins,
  publishedAt,
  author,
  tags,
  clapCount,
}: ArticleCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <Link
      href={`/${slug}`}
      className="bg-white rounded-xl p-6 flex gap-5 items-start transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_8px_40px_rgba(13,28,46,0.08)] shadow-[0_8px_40px_rgba(13,28,46,0.06)]"
    >
      <div className="flex-1 min-w-0">
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold leading-snug text-[#0d1c2e]">
          {title}
        </h2>

        {excerpt && (
          <p className="font-[family-name:var(--font-newsreader)] text-[#40484f] mt-2 line-clamp-2">
            {excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5">
            {author.avatarUrl ? (
              <Image
                src={author.avatarUrl}
                alt={author.fullName ?? author.username}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <span className="w-5 h-5 rounded-full bg-[#eff4ff] inline-flex items-center justify-center text-[10px] font-medium text-[#40484f]">
                {(author.fullName ?? author.username).charAt(0).toUpperCase()}
              </span>
            )}
            <span className="font-[family-name:var(--font-inter)] text-xs text-[#40484f]">
              {author.fullName ?? author.username}
            </span>
          </div>

          {tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.slug}
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = `/tag/${tag.slug}`
                  }}
                  className="bg-[#dae2ff] text-[#001848] text-xs px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-[#c4d0f5] transition-colors"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f]">
            {readingTimeMins} min read
          </span>

          {formattedDate && (
            <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f]">
              {formattedDate}
            </span>
          )}

          {clapCount > 0 && (
            <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f]">
              👏 {clapCount}
            </span>
          )}
        </div>
      </div>

      {coverImageUrl && (
        <div className="shrink-0">
          <Image
            src={coverImageUrl}
            alt={title}
            width={100}
            height={100}
            className="rounded-lg object-cover w-[100px] h-[100px]"
          />
        </div>
      )}
    </Link>
  )
}
