'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function handleScroll() {
      const article = document.querySelector('article')
      if (!article) return

      const rect = article.getBoundingClientRect()
      const articleTop = rect.top + window.scrollY
      const articleHeight = article.scrollHeight
      const windowHeight = window.innerHeight
      const scrollY = window.scrollY

      const start = articleTop
      const end = articleTop + articleHeight - windowHeight
      const current = Math.max(0, Math.min(1, (scrollY - start) / (end - start)))
      setProgress(current * 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
