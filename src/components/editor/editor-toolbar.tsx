'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Highlighter,
  Link2,
  ChevronDown,
  Plus,
  Image,
  Table2,
  Minus,
  Video,
  ListTree,
  Info,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isMac =
  typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl+'

export function getActiveBlockLabel(editor: Editor): string {
  if (editor.isActive('heading', { level: 1 })) return 'Heading 1'
  if (editor.isActive('heading', { level: 2 })) return 'Heading 2'
  if (editor.isActive('heading', { level: 3 })) return 'Heading 3'
  if (editor.isActive('heading', { level: 4 })) return 'Heading 4'
  if (editor.isActive('heading', { level: 5 })) return 'Heading 5'
  if (editor.isActive('heading', { level: 6 })) return 'Heading 6'
  if (editor.isActive('bulletList')) return 'Bullet List'
  if (editor.isActive('orderedList')) return 'Numbered List'
  if (editor.isActive('taskList')) return 'Task List'
  if (editor.isActive('blockquote')) return 'Blockquote'
  if (editor.isActive('codeBlock')) return 'Code Block'
  if (editor.isActive('callout')) return 'Callout'
  return 'Paragraph'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  title?: string
}

function ToolbarButton({
  active,
  className = '',
  children,
  ...rest
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`flex size-7 items-center justify-center rounded transition-colors ${
        active
          ? 'bg-[var(--color-surface-raised)] text-[var(--color-heading)]'
          : 'text-[var(--color-muted-text)] hover:bg-[var(--color-surface-dim)] hover:text-[var(--color-body)]'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

function Separator() {
  return (
    <span className="mx-0.5 h-4 w-px bg-[var(--color-border-subtle)]" />
  )
}

// ─── Block Type Dropdown ──────────────────────────────────────────────────────

interface BlockDropdownProps {
  editor: Editor
}

const BLOCK_OPTIONS = [
  { label: 'Paragraph', action: (e: Editor) => e.chain().focus().setParagraph().run() },
  { label: 'Heading 2', action: (e: Editor) => e.chain().focus().setHeading({ level: 2 }).run() },
  { label: 'Heading 3', action: (e: Editor) => e.chain().focus().setHeading({ level: 3 }).run() },
  { label: 'Heading 4', action: (e: Editor) => e.chain().focus().setHeading({ level: 4 }).run() },
  { label: 'Bullet List', action: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { label: 'Numbered List', action: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { label: 'Task List', action: (e: Editor) => e.chain().focus().toggleTaskList().run() },
  { label: 'Blockquote', action: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { label: 'Code Block', action: (e: Editor) => e.chain().focus().toggleCodeBlock().run() },
]

function BlockDropdown({ editor }: BlockDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const label = getActiveBlockLabel(editor)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          setOpen((v) => !v)
        }}
        className="flex h-7 items-center gap-1 rounded px-2 text-sm font-medium text-[var(--color-body)] hover:bg-[var(--color-surface-dim)] transition-colors"
      >
        <span className="max-w-28 truncate">{label}</span>
        <ChevronDown size={12} className="shrink-0 text-[var(--color-muted-text)]" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] py-1 shadow-lg">
          {BLOCK_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                opt.action(editor)
                setOpen(false)
              }}
              className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-surface-dim)] ${
                label === opt.label
                  ? 'font-semibold text-[var(--color-heading)]'
                  : 'text-[var(--color-body)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Insert Menu ──────────────────────────────────────────────────────────────

interface InsertMenuProps {
  editor: Editor
  onInsertImage: () => void
}

function InsertMenu({ editor, onInsertImage }: InsertMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const insertItems = [
    {
      icon: <Image size={14} />,
      label: 'Image',
      action: () => {
        onInsertImage()
        setOpen(false)
      },
    },
    {
      icon: <Table2 size={14} />,
      label: 'Table',
      action: () => {
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run()
        setOpen(false)
      },
    },
    {
      icon: <Minus size={14} />,
      label: 'Divider',
      action: () => {
        editor.chain().focus().setHorizontalRule().run()
        setOpen(false)
      },
    },
    {
      icon: <Video size={14} />,
      label: 'YouTube',
      action: () => {
        const url = window.prompt('YouTube URL:')
        if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run()
        setOpen(false)
      },
    },
    {
      icon: <ListTree size={14} />,
      label: 'Table of Contents',
      action: () => {
        editor.chain().focus().insertTableOfContents().run()
        setOpen(false)
      },
    },
    null, // separator
    {
      icon: <Info size={14} className="text-blue-400" />,
      label: 'Callout Info',
      action: () => {
        editor.chain().focus().setCallout({ type: 'info' }).run()
        setOpen(false)
      },
    },
    {
      icon: <AlertTriangle size={14} className="text-yellow-400" />,
      label: 'Callout Warning',
      action: () => {
        editor.chain().focus().setCallout({ type: 'warning' }).run()
        setOpen(false)
      },
    },
    {
      icon: <Lightbulb size={14} className="text-green-400" />,
      label: 'Callout Tip',
      action: () => {
        editor.chain().focus().setCallout({ type: 'tip' }).run()
        setOpen(false)
      },
    },
    {
      icon: <ShieldAlert size={14} className="text-red-400" />,
      label: 'Callout Danger',
      action: () => {
        editor.chain().focus().setCallout({ type: 'danger' }).run()
        setOpen(false)
      },
    },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          setOpen((v) => !v)
        }}
        className="flex h-7 items-center gap-1 rounded bg-blue-600/15 px-2 text-sm font-medium text-blue-400 hover:bg-blue-600/25 transition-colors"
      >
        <Plus size={13} />
        <span>Insert</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] py-1 shadow-lg">
          {insertItems.map((item, i) =>
            item === null ? (
              <div
                key={`sep-${i}`}
                className="my-1 h-px bg-[var(--color-border-subtle)]"
              />
            ) : (
              <button
                key={item.label}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  item.action()
                }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-[var(--color-body)] transition-colors hover:bg-[var(--color-surface-dim)]"
              >
                <span className="text-[var(--color-muted-text)]">
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────

export interface EditorToolbarProps {
  editor: Editor | null
  onInsertImage: () => void
}

export function EditorToolbar({ editor, onInsertImage }: EditorToolbarProps) {
  const [, forceUpdate] = useState(0)

  const handleUpdate = useCallback(() => forceUpdate((n) => n + 1), [])

  useEffect(() => {
    if (!editor) return
    editor.on('selectionUpdate', handleUpdate)
    editor.on('transaction', handleUpdate)
    return () => {
      editor.off('selectionUpdate', handleUpdate)
      editor.off('transaction', handleUpdate)
    }
  }, [editor, handleUpdate])

  const handleLink = useCallback(() => {
    if (!editor) return
    if (editor.isActive('link')) {
      editor.chain().focus().unsetMark('link').run()
      return
    }
    const url = window.prompt('URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  if (!editor) return null

  const inlineButtons: {
    icon: React.ReactNode
    active: boolean
    title: string
    action: () => void
  }[] = [
    {
      icon: <Bold size={14} />,
      active: editor.isActive('bold'),
      title: `Bold (${mod}B)`,
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: <Italic size={14} />,
      active: editor.isActive('italic'),
      title: `Italic (${mod}I)`,
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: <Underline size={14} />,
      active: editor.isActive('underline'),
      title: `Underline (${mod}U)`,
      action: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      icon: <Strikethrough size={14} />,
      active: editor.isActive('strike'),
      title: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      icon: <Code size={14} />,
      active: editor.isActive('code'),
      title: `Inline Code (${mod}E)`,
      action: () => editor.chain().focus().toggleCode().run(),
    },
    {
      icon: <Highlighter size={14} />,
      active: editor.isActive('highlight'),
      title: 'Highlight',
      action: () => editor.chain().focus().toggleHighlight().run(),
    },
  ]

  return (
    <div className="sticky top-14 z-20 flex h-10 items-center gap-1 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/95 px-3 backdrop-blur-md font-[family-name:var(--font-inter)]">
      {/* Block type */}
      <BlockDropdown editor={editor} />

      <Separator />

      {/* Inline formatting */}
      {inlineButtons.map((btn) => (
        <ToolbarButton
          key={btn.title}
          active={btn.active}
          title={btn.title}
          onMouseDown={(e) => {
            e.preventDefault()
            btn.action()
          }}
        >
          {btn.icon}
        </ToolbarButton>
      ))}

      <Separator />

      {/* Link */}
      <ToolbarButton
        active={editor.isActive('link')}
        title="Link"
        onMouseDown={(e) => {
          e.preventDefault()
          handleLink()
        }}
      >
        <Link2 size={14} />
      </ToolbarButton>

      {/* Spacer */}
      <span className="flex-1" />

      {/* Insert menu */}
      <InsertMenu editor={editor} onInsertImage={onInsertImage} />
    </div>
  )
}
