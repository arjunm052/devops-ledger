'use client'

import { useEffect, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { List } from 'lucide-react'
import { slugify } from '@/lib/tiptap/slugify'

interface TocHeading {
  level: number
  text: string
  id: string
}

function getHeadings(editor: NodeViewProps['editor']): TocHeading[] {
  const headings: TocHeading[] = []
  const slugCounts: Record<string, number> = {}

  editor.state.doc.descendants((node) => {
    if (node.type.name === 'heading') {
      const text = node.textContent
      const base = slugify(text) || 'heading'
      const count = slugCounts[base] ?? 0
      slugCounts[base] = count + 1
      const id = count === 0 ? base : `${base}-${count}`
      headings.push({
        level: node.attrs.level as number,
        text,
        id,
      })
    }
  })

  return headings
}

export function TocNodeView({ editor }: NodeViewProps) {
  const [headings, setHeadings] = useState<TocHeading[]>([])

  useEffect(() => {
    const update = () => setHeadings(getHeadings(editor))
    update()
    editor.on('update', update)
    return () => { editor.off('update', update) }
  }, [editor])

  return (
    <NodeViewWrapper className="my-6" contentEditable={false}>
      <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
        <div className="mb-3 flex items-center gap-2 font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-wider text-[var(--color-muted-text)]">
          <List className="size-3.5" />
          Table of Contents
        </div>
        {headings.length === 0 ? (
          <p className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-muted-text)]">
            Add headings to generate table of contents\u2026
          </p>
        ) : (
          <nav>
            <ul className="space-y-1">
              {headings.map((h) => (
                <li
                  key={h.id}
                  style={{ paddingLeft: `${(h.level - 2) * 16}px` }}
                >
                  <a
                    href={`#${h.id}`}
                    className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-link)] hover:text-[var(--color-link-hover)] hover:underline"
                  >
                    {h.text || 'Untitled'}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </NodeViewWrapper>
  )
}
