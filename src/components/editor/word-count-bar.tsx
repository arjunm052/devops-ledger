'use client'

import React, { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/core'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WordCountBarProps {
  editor: Editor | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WordCountBar({ editor }: WordCountBarProps) {
  const [stats, setStats] = useState({ words: 0, chars: 0 })

  useEffect(() => {
    if (!editor) return

    function update() {
      const text = editor!.state.doc.textContent
      const words = countWords(text)
      const chars =
        editor!.storage.characterCount?.characters?.() ?? text.length
      setStats({ words, chars })
    }

    update()
    editor.on('update', update)
    return () => {
      editor.off('update', update)
    }
  }, [editor])

  if (!editor) return null

  const mins = Math.max(1, Math.ceil(stats.words / 200))

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 flex h-8 items-center justify-between border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)]/90 px-4 backdrop-blur-md font-[family-name:var(--font-inter)]">
      <span className="text-xs text-[var(--color-muted-text)]">
        {stats.words.toLocaleString()} words &middot; {mins} min read
      </span>
      <span className="text-xs text-[var(--color-muted-text)]">
        {stats.chars.toLocaleString()} characters
      </span>
    </div>
  )
}
