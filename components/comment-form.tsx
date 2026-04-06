'use client'

import { useState, useTransition } from 'react'
import { createComment } from '@/actions/comments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CommentFormProps {
  postId: string
  slug: string
  parentId?: string
  onCancel?: () => void
}

export function CommentForm({ postId, slug, parentId, onCancel }: CommentFormProps) {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return

    setError(null)
    startTransition(async () => {
      const result = await createComment(
        { postId, body: body.trim(), parentId },
        slug
      )
      if (result.error) {
        setError(result.error)
      } else {
        setBody('')
        onCancel?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        disabled={isPending}
        className="font-[family-name:var(--font-newsreader)]"
      />
      {error && (
        <p className="font-[family-name:var(--font-inter)] text-xs text-destructive">{error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
          {isPending ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
