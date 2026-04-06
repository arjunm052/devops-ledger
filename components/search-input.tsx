'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

export default function SearchInput() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#70787f]" />
      <input
        type="search"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className="w-full rounded-full bg-[#d5e3fc] pl-11 pr-5 py-3 text-sm outline-none placeholder:text-[#70787f] text-[#0d1c2e] focus:shadow-[0_0_0_2px_#0045ad] transition-shadow border-0"
      />
    </form>
  )
}
