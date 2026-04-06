'use client'

import { useState, useTransition } from 'react'
import { deleteComment } from '@/actions/comments'
import { CommentForm } from '@/components/comment-form'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface Comment {
  id: string
  body: string
  createdAt: string
  parentId: string | null
  author: {
    id: string
    username: string
    fullName: string | null
    avatarUrl: string | null
  }
}

interface CommentSectionProps {
  postId: string
  slug: string
  comments: Comment[]
  currentUserId: string | null
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function CommentItem({
  comment,
  replies,
  currentUserId,
  postId,
  slug,
}: {
  comment: Comment
  replies: Comment[]
  currentUserId: string | null
  postId: string
  slug: string
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteComment(comment.id, slug)
    })
  }

  const displayName = comment.author.fullName ?? comment.author.username
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar size="sm">
          {comment.author.avatarUrl ? (
            <AvatarImage src={comment.author.avatarUrl} alt="" />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-inter)] text-sm font-medium">
              {displayName}
            </span>
            <span className="font-[family-name:var(--font-inter)] text-xs text-muted-foreground">
              {relativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="font-[family-name:var(--font-newsreader)] text-sm mt-1 whitespace-pre-wrap break-words">
            {comment.body}
          </p>
          <div className="flex gap-2 mt-1.5">
            {currentUserId && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-muted-foreground"
              >
                Reply
              </Button>
            )}
            {currentUserId === comment.author.id && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleDelete}
                disabled={isPending}
                className="text-destructive hover:text-destructive"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                slug={slug}
                parentId={comment.id}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-9 space-y-3 border-l-2 border-border pl-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]}
              currentUserId={currentUserId}
              postId={postId}
              slug={slug}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentSection({
  postId,
  slug,
  comments,
  currentUserId,
}: CommentSectionProps) {
  const topLevel = comments.filter((c) => !c.parentId)
  const repliesMap = new Map<string, Comment[]>()

  for (const comment of comments) {
    if (comment.parentId) {
      const existing = repliesMap.get(comment.parentId) ?? []
      existing.push(comment)
      repliesMap.set(comment.parentId, existing)
    }
  }

  return (
    <section className="space-y-6">
      <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold">
        Comments ({comments.length})
      </h3>

      {currentUserId ? (
        <CommentForm postId={postId} slug={slug} />
      ) : (
        <p className="font-[family-name:var(--font-inter)] text-sm text-muted-foreground">
          Sign in to leave a comment.
        </p>
      )}

      <div className="space-y-6">
        {topLevel.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={repliesMap.get(comment.id) ?? []}
            currentUserId={currentUserId}
            postId={postId}
            slug={slug}
          />
        ))}
      </div>
    </section>
  )
}
