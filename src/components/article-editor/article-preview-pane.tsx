'use client'

import Link from 'next/link'
import TiptapRenderer from '@/components/tiptap-renderer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface AuthorPreview {
  fullName: string | null
  username: string
  avatarUrl: string | null
}

function estimateMinsFromContent(content: unknown, title: string): number {
  const text = title + ' ' + JSON.stringify(content)
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function ArticlePreviewPane({
  title,
  coverImageUrl,
  content,
  tags,
  author,
}: {
  title: string
  coverImageUrl: string
  content: unknown
  tags: { name: string; slug: string }[]
  author: AuthorPreview
}) {
  const authorName = author.fullName ?? author.username
  const initial = authorName.charAt(0).toUpperCase()
  const mins = estimateMinsFromContent(content, title)

  return (
    <article className="mx-auto w-full max-w-3xl px-4 sm:px-6">
      {coverImageUrl ? (
        <div className="relative mb-8 aspect-[2/1] w-full overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary cover URLs in editor preview */}
          <img
            src={coverImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-tight tracking-tight text-[var(--color-heading)] md:text-5xl">
        {title.trim() || 'Untitled'}
      </h1>

      <div className="mt-6 flex items-center gap-4">
        <Avatar>
          {author.avatarUrl ? (
            <AvatarImage src={author.avatarUrl} alt="" />
          ) : (
            <AvatarFallback>{initial}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col">
          <Link
            href={`/author/${author.username}`}
            className="font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--color-body)] transition-colors hover:text-[var(--color-link)]"
          >
            {authorName}
          </Link>
          <div className="font-[family-name:var(--font-inter)] flex items-center gap-2 text-xs text-[var(--color-muted-text)]">
            <span>Preview</span>
            <span aria-hidden="true">&middot;</span>
            <span>{mins} min read</span>
          </div>
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tag/${tag.slug}`}
              className="rounded-full bg-[var(--color-surface-raised)] px-3 py-1 text-xs text-[var(--color-chip-text)] transition-colors hover:bg-[rgba(26,93,213,0.2)]"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-10 font-[family-name:var(--font-newsreader)]">
        <TiptapRenderer content={content} />
      </div>

      <p className="mt-10 rounded-xl border border-dashed border-[var(--color-border-subtle)] py-6 text-center font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)]">
        Claps, bookmarks, and comments appear on the published article.
      </p>
    </article>
  )
}
