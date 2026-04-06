'use client'

import React, { useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import { BubbleMenu } from '@tiptap/react/menus'
import { Bold, Italic, Code, Highlighter, Link2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditorBubbleMenuProps {
  editor: Editor
}

// ─── Button ───────────────────────────────────────────────────────────────────

interface BubbleButtonProps {
  active?: boolean
  title?: string
  onMouseDown: (e: React.MouseEvent) => void
  children: React.ReactNode
}

function BubbleButton({ active, title, onMouseDown, children }: BubbleButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      className={`flex size-7 items-center justify-center rounded transition-colors ${
        active
          ? 'bg-[var(--color-surface-raised)] text-[var(--color-heading)]'
          : 'text-[var(--color-muted-text)] hover:bg-[var(--color-surface-dim)] hover:text-[var(--color-body)]'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const handleLink = useCallback(() => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetMark('link').run()
      return
    }
    const url = window.prompt('URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: ed, state }) => {
        // Hide in code blocks
        if (ed.isActive('codeBlock')) return false
        // Show only when there is a non-empty text selection
        const { selection } = state
        return !selection.empty
      }}
      options={{ placement: 'top-start' }}
      className="flex items-center gap-0.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-1 shadow-lg font-[family-name:var(--font-inter)]"
    >
      <BubbleButton
        active={editor.isActive('bold')}
        title="Bold"
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleBold().run()
        }}
      >
        <Bold size={13} />
      </BubbleButton>

      <BubbleButton
        active={editor.isActive('italic')}
        title="Italic"
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleItalic().run()
        }}
      >
        <Italic size={13} />
      </BubbleButton>

      <BubbleButton
        active={editor.isActive('code')}
        title="Inline Code"
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleCode().run()
        }}
      >
        <Code size={13} />
      </BubbleButton>

      <BubbleButton
        active={editor.isActive('highlight')}
        title="Highlight"
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleHighlight().run()
        }}
      >
        <Highlighter size={13} />
      </BubbleButton>

      <span className="mx-0.5 h-4 w-px bg-[var(--color-border-subtle)]" />

      <BubbleButton
        active={editor.isActive('link')}
        title="Link"
        onMouseDown={(e) => {
          e.preventDefault()
          handleLink()
        }}
      >
        <Link2 size={13} />
      </BubbleButton>
    </BubbleMenu>
  )
}
