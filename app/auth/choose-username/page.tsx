'use client'

import { useState, useTransition } from 'react'
import { setUsername } from '@/actions/username'

export default function ChooseUsernamePage() {
  const [username, setUsernameValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await setUsername(username)
      if (result && 'error' in result) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-[#0d1c2e] mb-2"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Choose your username
          </h1>
          <p
            className="text-sm text-[#40484f]"
            style={{ fontFamily: 'var(--font-newsreader)' }}
          >
            Pick a unique username for your profile. This cannot be changed later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-stretch rounded-xl overflow-hidden bg-[#d5e3fc] border-b-2 border-transparent focus-within:border-[#0045ad] transition-colors">
              <span
                className="flex items-center px-4 text-sm text-[#4a5568] bg-[#c3d7f9] select-none shrink-0"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsernameValue(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="your-username"
                className="flex-1 bg-transparent px-3 py-3.5 text-[#1a1a2e] text-sm outline-none placeholder:text-[#6b7a99]"
                style={{ fontFamily: 'var(--font-inter)' }}
                autoFocus
                required
                minLength={3}
                maxLength={30}
              />
            </div>
            <p
              className="text-xs text-[#6b7a99] mt-2"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              3-30 characters. Lowercase letters, numbers, hyphens, underscores only.
            </p>
            {error && (
              <p className="text-xs text-red-500 mt-2">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || username.length < 3}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(to right, #0045ad, #1a5dd5)',
              fontFamily: 'var(--font-inter)',
            }}
          >
            {isPending ? 'Setting username...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
