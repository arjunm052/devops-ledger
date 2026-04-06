import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPostBySlug } from '@/lib/queries/posts'
import TiptapRenderer from '@/components/tiptap-renderer'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const post = await getPostBySlug(slug)
    return {
      title: post.title,
      description: post.excerpt ?? undefined,
      openGraph: {
        title: post.title,
        description: post.excerpt ?? undefined,
        type: 'article',
        ...(post.cover_image_url ? { images: [{ url: post.cover_image_url }] } : {}),
      },
    }
  } catch {
    return { title: 'Article Not Found' }
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params

  let post
  try {
    post = await getPostBySlug(slug)
  } catch {
    notFound()
  }

  const author = post.author as { id: string; full_name: string | null; username: string; avatar_url: string | null; bio: string | null } | null
  const tags = (post.tags as { tag: { id: string; name: string; slug: string } | null }[] | null) ?? []
  const claps = post.claps as { count: number }[] | null

  const totalClaps = claps?.reduce((sum, c) => sum + c.count, 0) ?? 0

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const authorName = author?.full_name ?? author?.username ?? 'Unknown'
  const authorInitial = authorName.charAt(0).toUpperCase()

  return (
    <article className="mx-auto max-w-3xl px-6 py-10">
      {/* Cover image */}
      {post.cover_image_url && (
        <div className="relative mb-8 aspect-[2/1] w-full overflow-hidden rounded-xl">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Title */}
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-tight tracking-tight md:text-5xl">
        {post.title}
      </h1>

      {/* Author row */}
      <div className="mt-6 flex items-center gap-4">
        <Avatar>
          {author?.avatar_url ? (
            <AvatarImage src={author.avatar_url} alt={authorName} />
          ) : (
            <AvatarFallback>{authorInitial}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col">
          <span className="font-[family-name:var(--font-inter)] text-sm font-medium">
            {authorName}
          </span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {formattedDate && <time dateTime={post.published_at!}>{formattedDate}</time>}
            <span aria-hidden="true">&middot;</span>
            <span>{post.reading_time_mins} min read</span>
            {totalClaps > 0 && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>{totalClaps} claps</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map(({ tag }) =>
            tag ? (
              <Link key={tag.slug} href={`/tag/${tag.slug}`}>
                <Badge variant="secondary">{tag.name}</Badge>
              </Link>
            ) : null
          )}
        </div>
      )}

      {/* Article content */}
      <div className="mt-10">
        <TiptapRenderer content={post.content} />
      </div>

      {/* Placeholder sections for claps and comments (Task 7) */}
      <div id="claps" />
      <div id="comments" />
    </article>
  )
}
