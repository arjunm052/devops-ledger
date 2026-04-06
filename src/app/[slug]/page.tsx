import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPostBySlug } from '@/lib/queries/posts'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import TiptapRenderer from '@/components/tiptap-renderer'
import { ClapButton } from '@/components/clap-button'
import { ShareButton } from '@/components/share-button'
import { BookmarkButton } from '@/components/bookmark-button'
import { getBookmarkStatus } from '@/actions/bookmarks'
import { getFollowStatus } from '@/actions/follows'
import { FollowButton } from '@/components/follow-button'
import { CommentSection } from '@/components/comment-section'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ReadingProgress } from '@/components/reading-progress'

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

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isBookmarked = await getBookmarkStatus(post.id)

  const author = post.author as { id: string; full_name: string | null; username: string; avatar_url: string | null; bio: string | null } | null

  const followStatus = author ? await getFollowStatus(author.id) : false
  const tags = (post.tags as { tag: { id: string; name: string; slug: string } | null }[] | null) ?? []
  const claps = post.claps as { count: number }[] | null
  const rawComments = (post.comments ?? []) as {
    id: string
    body: string
    created_at: string
    parent_id: string | null
    author: { id: string; full_name: string | null; username: string; avatar_url: string | null }
  }[]

  const totalClaps = claps?.reduce((sum, c) => sum + c.count, 0) ?? 0

  const comments = rawComments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    parentId: c.parent_id,
    author: {
      id: c.author.id,
      username: c.author.username,
      fullName: c.author.full_name,
      avatarUrl: c.author.avatar_url,
    },
  }))

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
    <div className="min-h-screen py-10">
      <ReadingProgress />
    <article className="mx-auto max-w-3xl px-6">
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
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-tight tracking-tight text-[var(--color-heading)] md:text-5xl">
        {post.title}
      </h1>

      {/* Author row */}
      <div className="mt-6 flex items-center gap-4">
        <Avatar>
          {author?.avatar_url ? (
            <AvatarImage src={author.avatar_url} alt="" />
          ) : (
            <AvatarFallback>{authorInitial}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col">
          <Link
            href={`/author/${author?.username}`}
            className="font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--color-body)] hover:text-[var(--color-link)] transition-colors"
          >
            {authorName}
          </Link>
          <div className="font-[family-name:var(--font-inter)] flex items-center gap-2 text-xs text-[var(--color-muted-text)]">
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
        {author && (
          <FollowButton
            authorId={author.id}
            initialFollowing={followStatus}
            path={`/${slug}`}
          />
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map(({ tag }) =>
            tag ? (
              <Link
                key={tag.slug}
                href={`/tag/${tag.slug}`}
                className="bg-[var(--color-surface-raised)] text-[var(--color-chip-text)] text-xs px-3 py-1 rounded-full hover:bg-[rgba(26,93,213,0.2)] transition-colors"
              >
                {tag.name}
              </Link>
            ) : null
          )}
        </div>
      )}

      {/* Article content */}
      <div className="mt-10 font-[family-name:var(--font-newsreader)]">
        <TiptapRenderer content={post.content} />
      </div>

      {/* Claps */}
      <div className="mt-10 flex justify-center items-center gap-4 bg-muted/50 rounded-xl py-6">
        <ClapButton postId={post.id} slug={slug} initialCount={totalClaps} />
        <ShareButton title={post.title} url={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/${slug}`} />
        <BookmarkButton postId={post.id} initialBookmarked={isBookmarked} path={`/${slug}`} />
      </div>

      {/* Comments */}
      <div className="mt-8 bg-muted/50 rounded-xl p-6">
        <CommentSection
          postId={post.id}
          slug={slug}
          comments={comments}
          currentUserId={user?.id ?? null}
        />
      </div>
    </article>
    </div>
  )
}
