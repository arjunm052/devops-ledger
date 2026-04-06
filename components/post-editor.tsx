'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Youtube from '@tiptap/extension-youtube'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import { common, createLowlight } from 'lowlight'
import { createPost, updatePost } from '@/actions/posts'

const lowlight = createLowlight(common)

// ---- Tag type ----
interface Tag {
  id: string
  name: string
  slug: string
  description: string | null
}

interface PostEditorProps {
  allTags: Tag[]
  initialData?: {
    id: string
    title: string
    content: unknown
    excerpt: string | null
    cover_image_url: string | null
    status: 'draft' | 'published'
    tagIds: string[]
  }
}

// ---- Toolbar icon helpers ----
function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={[
        'p-1.5 rounded transition-colors',
        active
          ? 'bg-[#0045ad]/10 text-[#0045ad]'
          : 'text-[#5a6a8a] hover:bg-[#eff4ff] hover:text-[#0045ad]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Separator() {
  return <div className="w-px h-5 bg-[#c5d5f0] mx-1 self-center" />
}

// ---- Toolbar ----
function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null

  const addImage = () => {
    const url = window.prompt('Image URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL:', prev ?? '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-4 py-2 border-b border-[#dde8fb] bg-white sticky top-0 z-10">
      {/* Text style */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 0 1 0 8H6V4zm0 8h9a4 4 0 0 1 0 8H6v-8z"/></svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.182 4h7v2h-3.3l-4.564 12H13v2H6v-2h3.3L13.764 6H11V4z"/></svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><path d="M16 6C16 6 14.5 4 12 4C9.5 4 7 5.5 7 8C7 10 8.5 11 12 11C15.5 11 17 12 17 14C17 16.5 14.5 18 12 18C9.5 18 8 16 8 16"/></svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline code"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      </ToolbarBtn>

      <Separator />

      {/* Headings */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <span className="text-xs font-bold leading-none">H2</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <span className="text-xs font-bold leading-none">H3</span>
      </ToolbarBtn>

      <Separator />

      {/* Lists */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered list"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 6H3M3 10h2"/><path d="M3 18h2a1 1 0 0 1 0 2H3M3 14h2a1 1 0 0 1 0 2H3"/></svg>
      </ToolbarBtn>

      <Separator />

      {/* Block types */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z"/></svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code block"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 9 6 12 9 15"/><polyline points="15 9 18 12 15 15"/></svg>
      </ToolbarBtn>

      <Separator />

      {/* Link & Image */}
      <ToolbarBtn
        onClick={setLink}
        active={editor.isActive('link')}
        title="Link"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={addImage}
        active={false}
        title="Image"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </ToolbarBtn>

      <Separator />

      {/* HR */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        title="Horizontal rule"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </ToolbarBtn>
    </div>
  )
}

// ---- Tag chip ----
function TagChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#d5e3fc] text-[#0045ad] text-xs font-medium px-2.5 py-1 rounded-full">
      {name}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-[#002d7a] transition-colors leading-none"
        aria-label={`Remove ${name}`}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </span>
  )
}

// ---- Main component ----
export default function PostEditor({ allTags, initialData }: PostEditorProps) {
  const router = useRouter()
  const isEditing = !!initialData

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url ?? '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds ?? [])
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status ?? 'draft')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Image,
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ inline: false }),
      Typography,
      Placeholder.configure({
        placeholder: 'Write your article here…',
      }),
    ],
    content: initialData?.content ?? '',
    editable: true,
    immediatelyRender: false,
  })

  const toggleTag = useCallback(
    (tagId: string) => {
      setSelectedTagIds((prev) => {
        if (prev.includes(tagId)) return prev.filter((id) => id !== tagId)
        if (prev.length >= 5) return prev
        return [...prev, tagId]
      })
    },
    []
  )

  const handleSave = useCallback(
    (targetStatus: 'draft' | 'published') => {
      setError(null)

      if (!title.trim()) {
        setError('Please add a title before saving.')
        return
      }

      const content = editor?.getJSON() ?? {}

      startTransition(async () => {
        try {
          if (isEditing && initialData) {
            await updatePost(initialData.id, {
              title: title.trim(),
              content,
              excerpt: excerpt.trim() || null,
              cover_image_url: coverImageUrl.trim() || null,
              tag_ids: selectedTagIds,
              status: targetStatus,
            })
          } else {
            await createPost({
              title: title.trim(),
              content,
              excerpt: excerpt.trim() || null,
              cover_image_url: coverImageUrl.trim() || null,
              tag_ids: selectedTagIds,
              status: targetStatus,
            })
          }
          router.push('/dashboard')
          router.refresh()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        }
      })
    },
    [title, excerpt, coverImageUrl, selectedTagIds, editor, isEditing, initialData, router]
  )

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id))
  const unselectedTags = allTags.filter((t) => !selectedTagIds.includes(t.id))

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      {/* Top nav bar */}
      <nav className="sticky top-0 z-20 bg-white border-b border-[#dde8fb] flex items-center justify-between px-6 h-14">
        <NextLink
          href="/dashboard"
          className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-[#0045ad] tracking-tight"
        >
          The Ledger
        </NextLink>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-red-500 font-[family-name:var(--font-inter)]">
              {error}
            </span>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => { setStatus('draft'); handleSave('draft') }}
            className="px-4 py-1.5 rounded-lg text-sm font-medium font-[family-name:var(--font-inter)] text-[#0045ad] border border-[#0045ad]/25 hover:bg-[#eff4ff] transition-colors disabled:opacity-50"
          >
            {isPending && status === 'draft' ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => { setStatus('published'); handleSave('published') }}
            className="px-4 py-1.5 rounded-lg text-sm font-medium font-[family-name:var(--font-inter)] text-white bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending && status === 'published' ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </nav>

      {/* Two-column layout */}
      <div className="flex gap-0 max-w-[1400px] mx-auto">
        {/* Main editor column */}
        <div className="flex-1 min-w-0 bg-white min-h-[calc(100vh-3.5rem)]">
          {/* Title input */}
          <div className="px-10 pt-10 pb-4">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article Title…"
              rows={2}
              className={[
                'w-full resize-none bg-transparent border-none outline-none',
                'font-[family-name:var(--font-space-grotesk)] text-4xl font-bold text-[#0f1f40]',
                'placeholder:text-[#b8c8e8] leading-tight',
              ].join(' ')}
            />
          </div>

          {/* Tiptap toolbar + editor */}
          <EditorToolbar editor={editor} />
          <div className="px-10 py-8">
            <EditorContent
              editor={editor}
              className={[
                'prose prose-lg max-w-none min-h-[60vh] focus:outline-none',
                'prose-headings:font-[family-name:var(--font-space-grotesk)] prose-headings:text-[#0f1f40]',
                'prose-p:font-[family-name:var(--font-newsreader)] prose-p:text-[#2a3a55]',
                'prose-pre:bg-slate-900 prose-pre:text-slate-100',
                '[&_.tiptap]:outline-none',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:text-[#b8c8e8]',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:float-left',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:h-0',
              ].join(' ')}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="w-[320px] shrink-0 bg-[#eff4ff] min-h-[calc(100vh-3.5rem)] border-l border-[#dde8fb]">
          <div className="sticky top-14 p-6 space-y-6 max-h-[calc(100vh-3.5rem)] overflow-y-auto">

            {/* Cover image */}
            <section>
              <label
                className="block text-xs font-bold uppercase tracking-widest text-[#5a6a8a] mb-2 font-[family-name:var(--font-inter)]"
              >
                Cover Image URL
              </label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://…"
                className={[
                  'w-full px-3 py-2 rounded-lg text-sm bg-[#d5e3fc] text-[#0f1f40]',
                  'border-b-2 border-transparent focus:border-[#0045ad]',
                  'outline-none transition-colors placeholder:text-[#8aa3c8]',
                  'font-[family-name:var(--font-inter)]',
                ].join(' ')}
              />
              {coverImageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden aspect-video bg-[#d5e3fc]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </section>

            {/* Tags */}
            <section>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#5a6a8a] mb-2 font-[family-name:var(--font-inter)]">
                Tags{' '}
                <span className="normal-case font-normal tracking-normal text-[#8aa3c8]">
                  ({selectedTagIds.length}/5)
                </span>
              </label>

              {/* Selected tags as chips */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedTags.map((tag) => (
                    <TagChip
                      key={tag.id}
                      name={tag.name}
                      onRemove={() => toggleTag(tag.id)}
                    />
                  ))}
                </div>
              )}

              {/* Unselected tags to pick */}
              {selectedTagIds.length < 5 && unselectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {unselectedTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className="text-xs px-2.5 py-1 rounded-full bg-white text-[#5a6a8a] border border-[#c5d5f0] hover:bg-[#d5e3fc] hover:text-[#0045ad] hover:border-[#0045ad]/30 transition-colors font-[family-name:var(--font-inter)]"
                    >
                      + {tag.name}
                    </button>
                  ))}
                </div>
              )}
              {allTags.length === 0 && (
                <p className="text-xs text-[#8aa3c8] font-[family-name:var(--font-inter)]">
                  No tags available.
                </p>
              )}
            </section>

            {/* Excerpt */}
            <section>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#5a6a8a] mb-2 font-[family-name:var(--font-inter)]">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value.slice(0, 300))}
                placeholder="A short summary of your article…"
                rows={4}
                className={[
                  'w-full px-3 py-2 rounded-lg text-sm bg-[#d5e3fc] text-[#0f1f40]',
                  'border-b-2 border-transparent focus:border-[#0045ad]',
                  'outline-none transition-colors resize-none placeholder:text-[#8aa3c8]',
                  'font-[family-name:var(--font-newsreader)]',
                ].join(' ')}
              />
              <div className="text-right text-[10px] text-[#8aa3c8] mt-1 font-[family-name:var(--font-inter)]">
                {excerpt.length}/300
              </div>
            </section>

            {/* Status */}
            <section>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#5a6a8a] mb-2 font-[family-name:var(--font-inter)]">
                Status
              </label>
              <div className="flex rounded-lg overflow-hidden border border-[#c5d5f0] font-[family-name:var(--font-inter)]">
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={[
                    'flex-1 py-2 text-sm font-medium transition-colors',
                    status === 'draft'
                      ? 'bg-[#0045ad] text-white'
                      : 'bg-white text-[#5a6a8a] hover:bg-[#eff4ff]',
                  ].join(' ')}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={[
                    'flex-1 py-2 text-sm font-medium transition-colors',
                    status === 'published'
                      ? 'bg-[#0045ad] text-white'
                      : 'bg-white text-[#5a6a8a] hover:bg-[#eff4ff]',
                  ].join(' ')}
                >
                  Published
                </button>
              </div>
            </section>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 font-[family-name:var(--font-inter)]">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSave('published')}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] hover:opacity-90 transition-opacity disabled:opacity-50 font-[family-name:var(--font-inter)]"
              >
                {isPending && status === 'published' ? 'Publishing…' : 'Publish'}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSave('draft')}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-[#0045ad] border border-[#0045ad]/25 hover:bg-[#d5e3fc] transition-colors disabled:opacity-50 font-[family-name:var(--font-inter)]"
              >
                {isPending && status === 'draft' ? 'Saving…' : 'Save Draft'}
              </button>
            </div>

          </div>
        </aside>
      </div>
    </div>
  )
}
