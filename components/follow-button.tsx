'use client'

import { useTransition, useOptimistic } from 'react'
import { toggleFollow } from '@/actions/follows'

interface FollowButtonProps {
  authorId: string
  initialFollowing: boolean
  path: string
}

export function FollowButton({ authorId, initialFollowing, path }: FollowButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticFollowing, setOptimisticFollowing] = useOptimistic(initialFollowing)

  function handleClick() {
    startTransition(async () => {
      setOptimisticFollowing(!optimisticFollowing)
      await toggleFollow(authorId, path)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`font-[family-name:var(--font-inter)] text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
        optimisticFollowing
          ? 'bg-[#dae2ff] text-[#0045ad] hover:bg-red-50 hover:text-red-600'
          : 'bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] text-white hover:opacity-90'
      }`}
    >
      {optimisticFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
