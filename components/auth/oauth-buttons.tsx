'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signInWithOAuth } from '@/actions/auth'

export function OAuthButtons() {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null)

  async function handleOAuth(provider: 'google' | 'github') {
    setLoading(provider)
    await signInWithOAuth(provider)
    setLoading(null)
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuth('google')}
        disabled={loading !== null}
      >
        {loading === 'google' ? 'Redirecting\u2026' : 'Continue with Google'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuth('github')}
        disabled={loading !== null}
      >
        {loading === 'github' ? 'Redirecting\u2026' : 'Continue with GitHub'}
      </Button>
    </div>
  )
}
