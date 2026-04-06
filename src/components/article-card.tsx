import Link from 'next/link'
import Image from 'next/image'
import { BookmarkButton } from '@/components/bookmark-button'

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
  postId?: string
  bookmarked?: boolean
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
  postId,
  bookmarked,
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
      className="bg-[var(--color-surface)] rounded-xl p-6 flex gap-5 items-start transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_8px_40px_rgba(0,0,0,0.35)] shadow-[0_8px_40px_rgba(0,0,0,0.2)]"
    >
      <div className="flex-1 min-w-0">
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold leading-snug text-[var(--color-heading)]">
          {title}
        </h2>

        {excerpt && (
          <p className="font-[family-name:var(--font-newsreader)] text-[var(--color-body)] mt-2 line-clamp-2">
            {excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5">
            {author.avatarUrl ? (
              <Image
                src={author.avatarUrl}
                alt=""
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <span className="w-5 h-5 rounded-full bg-[var(--color-surface-raised)] inline-flex items-center justify-center text-[10px] font-medium text-[var(--color-body)]">
                {(author.fullName ?? author.username).charAt(0).toUpperCase()}
              </span>
            )}
            <span
              onClick={(e) => {
                e.preventDefault()
                window.location.href = `/author/${author.username}`
              }}
              className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-body)] hover:text-[var(--color-link)] cursor-pointer transition-colors"
            >
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
                  className="bg-[var(--color-surface-raised)] text-[var(--color-chip-text)] text-xs px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-[rgba(26,93,213,0.2)] transition-colors"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <span className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)]">
            {readingTimeMins} min read
          </span>

          {formattedDate && (
            <span className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)]">
              {formattedDate}
            </span>
          )}

          {clapCount > 0 && (
            <span className="font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)]">
              👏 {clapCount}
            </span>
          )}

          {postId && bookmarked !== undefined && (
            <BookmarkButton postId={postId} initialBookmarked={bookmarked} path={`/${slug}`} />
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
