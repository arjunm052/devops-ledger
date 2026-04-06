'use client'

import {
  useState,
  useTransition,
  useCallback,
  useRef,
  useEffect,
} from 'react'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { toast } from 'sonner'
import { createEditorExtensions } from '@/lib/tiptap/editor-extensions'
import { createPost, updatePost } from '@/actions/posts'
import { uploadPostImage } from '@/actions/post-images'
import { CoverImageField } from '@/components/article-editor/cover-image-field'
import { ArticlePreviewPane, type AuthorPreview } from '@/components/article-editor/article-preview-pane'
import { StorySettingsDialog } from '@/components/article-editor/story-settings-dialog'
import { getImageFileFromDataTransfer } from '@/components/article-editor/image-clipboard'
import { Button } from '@/components/ui/button'
import { Settings2, Eye, PenLine } from 'lucide-react'

interface Tag {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface PostEditorProps {
  allTags: Tag[]
  authorPreview: AuthorPreview
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
        'rounded p-1.5 transition-colors',
        active
          ? 'bg-[#0045ad]/10 text-[#0045ad]'
          : 'text-[var(--color-muted-text)] hover:bg-[var(--color-surface-dim)] hover:text-[var(--color-link)]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Separator() {
  return <div className="mx-1 h-5 w-px self-center bg-[var(--color-border-subtle)]" />
}

function EditorToolbar({
  editor,
  onPickImageFile,
}: {
  editor: Editor | null
  onPickImageFile: () => void
}) {
  if (!editor) return null

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

  const addImageFromUrl = () => {
    const url = window.prompt('Image URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-2 py-1.5">
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h8a4 4 0 0 1 0 8H6V4zm0 8h9a4 4 0 0 1 0 8H6v-8z" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.182 4h7v2h-3.3l-4.564 12H13v2H6v-2h3.3L13.764 6H11V4z" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
          <path d="M16 6C16 6 14.5 4 12 4C9.5 4 7 5.5 7 8C7 10 8.5 11 12 11C15.5 11 17 12 17 14C17 16.5 14.5 18 12 18C9.5 18 8 16 8 16" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline code"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </ToolbarBtn>
      <Separator />
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
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1" fill="currentColor" />
          <circle cx="4" cy="12" r="1" fill="currentColor" />
          <circle cx="4" cy="18" r="1" fill="currentColor" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered list"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <path d="M4 6h1v4M4 6H3M3 10h2" />
          <path d="M3 18h2a1 1 0 0 1 0 2H3M3 14h2a1 1 0 0 1 0 2H3" />
        </svg>
      </ToolbarBtn>
      <Separator />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code block"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <polyline points="9 9 6 12 9 15" />
          <polyline points="15 9 18 12 15 15" />
        </svg>
      </ToolbarBtn>
      <Separator />
      <ToolbarBtn onClick={setLink} active={editor.isActive('link')} title="Link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={onPickImageFile} active={false} title="Upload image">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={addImageFromUrl} active={false} title="Image from URL">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </ToolbarBtn>
      <Separator />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        title="Horizontal rule"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </ToolbarBtn>
    </div>
  )
}

export default function PostEditor({
  allTags,
  authorPreview,
  initialData,
}: PostEditorProps) {
  const router = useRouter()
  const isEditing = !!initialData
  const inlineImageInputRef = useRef<HTMLInputElement>(null)
  const insertImageFromFileRef = useRef<(file: File) => void>(() => {})

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.cover_image_url ?? ''
  )
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tagIds ?? []
  )
  const [status, setStatus] = useState<'draft' | 'published'>(
    initialData?.status ?? 'draft'
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    'idle' | 'saving' | 'saved'
  >('idle')
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [, forceUpdate] = useState(0)

  const editor = useEditor({
    extensions: createEditorExtensions({
      placeholder: 'Write your article here…',
      linkOpenOnClick: false,
    }),
    content: initialData?.content ?? '',
    editable: true,
    immediatelyRender: false,
    editorProps: {
      handlePaste(_view, event) {
        const file = getImageFileFromDataTransfer(event.clipboardData)
        if (!file) return false
        event.preventDefault()
        insertImageFromFileRef.current(file)
        return true
      },
    },
  })

  const insertImageFromFile = useCallback(
    async (file: File) => {
      const ed = editor
      if (!ed) return
      const fd = new FormData()
      fd.set('file', file)
      const result = await uploadPostImage(fd)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      ed.chain().focus().setImage({ src: result.url }).run()
      toast.success('Image inserted')
    },
    [editor]
  )

  useEffect(() => {
    insertImageFromFileRef.current = (file: File) => {
      void insertImageFromFile(file)
    }
  }, [insertImageFromFile])

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) return prev.filter((id) => id !== tagId)
      if (prev.length >= 5) return prev
      return [...prev, tagId]
    })
  }, [])

  const scheduleAutoSave = useCallback(() => {
    if (!isEditing || !initialData) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(async () => {
      if (!title.trim()) return
      setAutoSaveStatus('saving')
      try {
        await updatePost(initialData.id, {
          title: title.trim(),
          content: editor?.getJSON() ?? {},
          excerpt: excerpt.trim() || null,
          cover_image_url: coverImageUrl.trim() || null,
          tag_ids: selectedTagIds,
          status,
        })
        setLastSaved(new Date())
        setAutoSaveStatus('saved')
      } catch {
        setAutoSaveStatus('idle')
      }
    }, 30000)
  }, [
    isEditing,
    initialData,
    title,
    excerpt,
    coverImageUrl,
    selectedTagIds,
    status,
    editor,
  ])

  useEffect(() => {
    if (!isEditing) return
    scheduleAutoSave()
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, excerpt, coverImageUrl, isEditing])

  useEffect(() => {
    if (!isEditing || !editor) return
    const onUpd = () => scheduleAutoSave()
    editor.on('update', onUpd)
    return () => {
      editor.off('update', onUpd)
    }
  }, [isEditing, editor, scheduleAutoSave])

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  function autoSaveLabel(): string | null {
    if (autoSaveStatus === 'saving') return 'Saving...'
    if (autoSaveStatus === 'saved' && lastSaved) {
      const diffMs = Date.now() - lastSaved.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin < 1) return 'Saved just now'
      return `Saved ${diffMin} min ago`
    }
    return null
  }

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
          setError(
            err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.'
          )
        }
      })
    },
    [
      title,
      excerpt,
      coverImageUrl,
      selectedTagIds,
      editor,
      isEditing,
      initialData,
      router,
    ]
  )

  const previewTags = allTags.filter((t) => selectedTagIds.includes(t.id))

  const onInlineImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) void insertImageFromFile(f)
  }

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)]">
      <nav className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/95 px-4 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <NextLink
            href="/dashboard"
            className="shrink-0 font-[family-name:var(--font-space-grotesk)] text-lg font-bold tracking-tight text-[#0045ad]"
          >
            The Ledger
          </NextLink>
          <span className="hidden truncate font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)] sm:inline max-w-[12rem] md:max-w-xs">
            {title.trim() || 'Untitled'}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isEditing && autoSaveLabel() ? (
            <span className="hidden text-xs text-[var(--color-muted-text)] font-[family-name:var(--font-inter)] sm:inline">
              {autoSaveLabel()}
            </span>
          ) : null}

          <div className="flex rounded-lg border border-[var(--color-border-subtle)] p-0.5">
            <button
              type="button"
              onClick={() => setMode('write')}
              className={[
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium font-[family-name:var(--font-inter)] sm:px-3 sm:text-sm',
                mode === 'write'
                  ? 'bg-[#0045ad] text-white'
                  : 'text-[var(--color-muted-text)] hover:text-[var(--color-heading)]',
              ].join(' ')}
            >
              <PenLine className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Write</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={[
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium font-[family-name:var(--font-inter)] sm:px-3 sm:text-sm',
                mode === 'preview'
                  ? 'bg-[#0045ad] text-white'
                  : 'text-[var(--color-muted-text)] hover:text-[var(--color-heading)]',
              ].join(' ')}
            >
              <Eye className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden gap-1.5 font-[family-name:var(--font-inter)] sm:flex"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="size-4" />
            Settings
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="sm:hidden"
            onClick={() => setSettingsOpen(true)}
            aria-label="Story settings"
          >
            <Settings2 className="size-4" />
          </Button>

          {error ? (
            <span className="hidden max-w-[10rem] truncate text-xs text-red-500 font-[family-name:var(--font-inter)] lg:inline">
              {error}
            </span>
          ) : null}

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setStatus('draft')
              handleSave('draft')
            }}
            className="rounded-lg border border-[#0045ad]/25 px-3 py-1.5 text-sm font-medium text-[#0045ad] transition-colors hover:bg-[var(--color-surface-dim)] disabled:opacity-50 font-[family-name:var(--font-inter)]"
          >
            {isPending && status === 'draft' ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setStatus('published')
              handleSave('published')
            }}
            className="rounded-lg bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 font-[family-name:var(--font-inter)]"
          >
            {isPending && status === 'published' ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </nav>

      <input
        ref={inlineImageInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={onInlineImageSelected}
      />

      <StorySettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        coverImageUrl={coverImageUrl}
        onCoverImageUrlChange={setCoverImageUrl}
        excerpt={excerpt}
        onExcerptChange={setExcerpt}
        status={status}
        onStatusChange={setStatus}
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        onToggleTag={toggleTag}
        error={error}
      />

      {mode === 'preview' ? (
        <div className="py-10">
          <ArticlePreviewPane
            title={title}
            coverImageUrl={coverImageUrl.trim()}
            content={editor?.getJSON() ?? {}}
            tags={previewTags.map((t) => ({ name: t.name, slug: t.slug }))}
            author={authorPreview}
          />
        </div>
      ) : (
        <div className="mx-auto max-w-[680px] px-4 pb-24 pt-8 sm:px-6">
          <CoverImageField
            imageUrl={coverImageUrl}
            onImageUrl={setCoverImageUrl}
            disabled={isPending}
          />

          <div className="mt-8">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              rows={2}
              className="w-full resize-none border-none bg-transparent font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-tight text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted-text)]"
            />
          </div>

          <div className="mt-4">
            <EditorToolbar
              editor={editor}
              onPickImageFile={() => inlineImageInputRef.current?.click()}
            />
          </div>

          <div className="relative mt-4">
            {editor ? (
              <BubbleMenu
                editor={editor}
                options={{ placement: 'top' }}
                shouldShow={({ editor: ed, state }) => {
                  const { from, to } = state.selection
                  if (from === to) return false
                  if (ed.isActive('codeBlock')) return false
                  return true
                }}
              >
                <div className="flex items-center gap-0.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-1 py-1 shadow-lg">
                  <ToolbarBtn
                    onClick={() =>
                      editor.chain().focus().toggleBold().run()
                    }
                    active={editor.isActive('bold')}
                    title="Bold"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h8a4 4 0 0 1 0 8H6V4zm0 8h9a4 4 0 0 1 0 8H6v-8z" />
                    </svg>
                  </ToolbarBtn>
                  <ToolbarBtn
                    onClick={() =>
                      editor.chain().focus().toggleItalic().run()
                    }
                    active={editor.isActive('italic')}
                    title="Italic"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.182 4h7v2h-3.3l-4.564 12H13v2H6v-2h3.3L13.764 6H11V4z" />
                    </svg>
                  </ToolbarBtn>
                  <ToolbarBtn
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: 2 })
                        .run()
                    }
                    active={editor.isActive('heading', { level: 2 })}
                    title="H2"
                  >
                    <span className="text-[10px] font-bold">H2</span>
                  </ToolbarBtn>
                  <ToolbarBtn
                    onClick={() => {
                      const prev = editor.getAttributes('link').href as
                        | string
                        | undefined
                      const url = window.prompt('Link URL:', prev ?? '')
                      if (url === null) return
                      if (url === '') {
                        editor
                          .chain()
                          .focus()
                          .extendMarkRange('link')
                          .unsetLink()
                          .run()
                      } else {
                        editor
                          .chain()
                          .focus()
                          .extendMarkRange('link')
                          .setLink({ href: url })
                          .run()
                      }
                    }}
                    active={editor.isActive('link')}
                    title="Link"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </ToolbarBtn>
                </div>
              </BubbleMenu>
            ) : null}

            <EditorContent
              editor={editor}
              className={[
                'tiptap-editor-root prose prose-lg max-w-none min-h-[50vh] focus:outline-none',
                'prose-headings:font-[family-name:var(--font-space-grotesk)] prose-headings:text-[var(--color-heading)]',
                'prose-p:font-[family-name:var(--font-newsreader)] prose-p:text-[var(--color-body)]',
                'prose-pre:bg-transparent prose-pre:p-0',
                '[&_.tiptap]:outline-none',
                '[&_.tiptap_pre.hljs]:rounded-lg [&_.tiptap_pre.hljs]:border [&_.tiptap_pre.hljs]:border-[var(--color-border-subtle)] [&_.tiptap_pre.hljs]:bg-[oklch(0.2_0.02_250)] [&_.tiptap_pre.hljs]:p-4',
                '[&_.tiptap_pre.hljs_code]:bg-transparent [&_.tiptap_pre.hljs_code]:p-0 [&_.tiptap_pre.hljs_code]:font-mono [&_.tiptap_pre.hljs_code]:text-sm',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:text-[var(--color-muted-text)]',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:float-left',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:h-0',
              ].join(' ')}
            />
          </div>
        </div>
      )}
    </div>
  )
}
