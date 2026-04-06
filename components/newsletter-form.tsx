'use client'

import { useState, useTransition } from 'react'
import { subscribeToNewsletter } from '@/actions/newsletter'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await subscribeToNewsletter(email)
      if ('success' in result) {
        setMessage({ type: 'success', text: 'Subscribed! Check your inbox.' })
        setEmail('')
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 rounded-full bg-[#d5e3fc] px-4 py-2 text-sm outline-none placeholder:text-[#70787f] focus:ring-2 focus:ring-[#0045ad]/30"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? '...' : 'Subscribe'}
        </button>
      </div>
      {message && (
        <p className={`text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {message.text}
        </p>
      )}
    </form>
  )
}
