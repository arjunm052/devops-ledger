'use client'

import { useTransition, useOptimistic } from 'react'
import { toggleBookmark } from '@/actions/bookmarks'

interface BookmarkButtonProps {
  postId: string
  initialBookmarked: boolean
  path: string
}

export function BookmarkButton({ postId, initialBookmarked, path }: BookmarkButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticBookmarked, setOptimisticBookmarked] = useOptimistic(initialBookmarked)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      setOptimisticBookmarked(!optimisticBookmarked)
      await toggleBookmark(postId, path)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="p-1 text-[#70787f] hover:text-[#0045ad] transition-colors"
      aria-label={optimisticBookmarked ? 'Remove bookmark' : 'Bookmark'}
      title={optimisticBookmarked ? 'Remove bookmark' : 'Bookmark'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={optimisticBookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
