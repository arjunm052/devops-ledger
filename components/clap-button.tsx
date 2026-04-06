'use client'

import { useState, useTransition } from 'react'
import { clapForPost } from '@/actions/claps'
import { Button } from '@/components/ui/button'

interface ClapButtonProps {
  postId: string
  slug: string
  initialCount: number
}

export function ClapButton({ postId, slug, initialCount }: ClapButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClap() {
    setError(null)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    startTransition(async () => {
      const result = await clapForPost(postId, slug)
      if (result.error) {
        setError(result.error)
      } else {
        setCount((prev) => prev + 1)
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={handleClap}
        disabled={isPending}
        aria-label="Clap for this post"
        className={`transition-transform ${isAnimating ? 'scale-125' : 'scale-100'}`}
      >
        <span className="text-xl">
          {count > 0 ? '\uD83D\uDC4F' : '\u{1F44F}'}
        </span>
      </Button>
      <span className="font-[family-name:var(--font-inter)] text-sm text-muted-foreground">
        {count}
      </span>
      {error && (
        <p className="font-[family-name:var(--font-inter)] text-xs text-destructive max-w-[120px] text-center">
          {error}
        </p>
      )}
    </div>
  )
}
