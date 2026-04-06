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
import { useEditor, EditorContent } from '@tiptap/react'
import { toast } from 'sonner'
import MarkdownIt from 'markdown-it'
import { createEditorExtensions } from '@/lib/tiptap/editor-extensions'
import { SlashCommands } from '@/components/editor/slash-command-menu'
import { EditorToolbar } from '@/components/editor/editor-toolbar'
import { EditorBubbleMenu } from '@/components/editor/editor-bubble-menu'
import { WordCountBar } from '@/components/editor/word-count-bar'
import { DragHandle } from '@/components/editor/drag-handle'
import { createPost, updatePost } from '@/actions/posts'
import { uploadPostImage } from '@/actions/post-images'
import { CoverImageField } from '@/components/article-editor/cover-image-field'
import {
  ArticlePreviewPane,
  type AuthorPreview,
} from '@/components/article-editor/article-preview-pane'
import { StorySettingsDialog } from '@/components/article-editor/story-settings-dialog'
import { getImageFileFromDataTransfer } from '@/components/article-editor/image-clipboard'
import { Button } from '@/components/ui/button'
import { Settings2, Eye, PenLine } from 'lucide-react'

// ─── Markdown-It instance ─────────────────────────────────────────────────────

const md = new MarkdownIt()

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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
    extensions: [
      ...createEditorExtensions({
        placeholder: 'Start writing, or type / for commands…',
        linkOpenOnClick: false,
      }),
      SlashCommands,
    ],
    content: initialData?.content ?? '',
    editable: true,
    immediatelyRender: false,
    editorProps: {
      handlePaste(_view, event) {
        const dt = event.clipboardData

        // Image paste
        const imageFile = getImageFileFromDataTransfer(dt)
        if (imageFile) {
          event.preventDefault()
          insertImageFromFileRef.current(imageFile)
          return true
        }

        return false
      },
    },
  })

  // Rich paste handling — upgrade after editor is initialized
  useEffect(() => {
    if (!editor) return

    editor.setOptions({
      editorProps: {
        handlePaste(_view, event) {
          const dt = event.clipboardData
          if (!dt) return false

          // 1. Image paste — upload to Supabase
          const imageFile = getImageFileFromDataTransfer(dt)
          if (imageFile) {
            event.preventDefault()
            insertImageFromFileRef.current(imageFile)
            return true
          }

          // 2. Rich HTML paste (ChatGPT, Claude, docs, etc.)
          //    Explicitly grab the HTML and insert via Tiptap's parser
          //    so all registered extensions (headings, lists, code blocks,
          //    tables, bold, italic, links, etc.) are used to convert it.
          const html = dt.getData('text/html')
          if (html && html.trim().length > 0) {
            event.preventDefault()
            editor.commands.insertContent(html, {
              parseOptions: { preserveWhitespace: false },
            })
            return true
          }

          // 3. Markdown plain-text fallback
          const plain = dt.getData('text/plain')
          if (
            plain &&
            /^#{1,4}\s|```|^\s*[-*]\s|^\s*\d+\.\s|^\s*>/m.test(plain)
          ) {
            event.preventDefault()
            const rendered = md.render(plain)
            editor.commands.insertContent(rendered, {
              parseOptions: { preserveWhitespace: false },
            })
            return true
          }

          return false
        },
      },
    })
  }, [editor])

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

  // Listen for editor:insert-image custom event (from slash commands)
  useEffect(() => {
    function onInsertImage() {
      inlineImageInputRef.current?.click()
    }
    window.addEventListener('editor:insert-image', onInsertImage)
    return () =>
      window.removeEventListener('editor:insert-image', onInsertImage)
  }, [])

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

  // Force re-render every 30s to refresh relative timestamps
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
      {/* ── Nav bar ── */}
      <nav className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/95 px-4 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <NextLink
            href="/dashboard"
            className="shrink-0 font-[family-name:var(--font-space-grotesk)] text-lg font-bold tracking-tight text-[#0045ad]"
          >
            The Ledger
          </NextLink>
          <span className="hidden max-w-[12rem] truncate font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)] sm:inline md:max-w-xs">
            {title.trim() || 'Untitled'}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isEditing && autoSaveLabel() ? (
            <span className="hidden font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)] sm:inline">
              {autoSaveLabel()}
            </span>
          ) : null}

          {/* Write / Preview toggle */}
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

          {/* Settings button */}
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
            <span className="hidden max-w-[10rem] truncate font-[family-name:var(--font-inter)] text-xs text-red-500 lg:inline">
              {error}
            </span>
          ) : null}

          {/* Save draft */}
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

          {/* Publish */}
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

      {/* Hidden file input for inline image insertion */}
      <input
        ref={inlineImageInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={onInlineImageSelected}
      />

      {/* Story settings dialog */}
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

      {/* ── Main content area ── */}
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
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
          {/* Cover image */}
          <CoverImageField
            imageUrl={coverImageUrl}
            onImageUrl={setCoverImageUrl}
            disabled={isPending}
          />

          {/* Title */}
          <div className="mt-8">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              rows={2}
              className="w-full resize-none border-none bg-transparent font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-tight text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted-text)]"
            />
          </div>

          {/* Toolbar */}
          <EditorToolbar
            editor={editor}
            onInsertImage={() => inlineImageInputRef.current?.click()}
          />

          {/* Editor area with drag handle and bubble menu */}
          <div className="relative mt-4">
            <DragHandle editor={editor} />

            {editor ? <EditorBubbleMenu editor={editor} /> : null}

            <EditorContent
              editor={editor}
              className={[
                'tiptap-editor-root prose prose-lg max-w-none min-h-[50vh] focus:outline-none',
                'prose-headings:font-[family-name:var(--font-space-grotesk)] prose-headings:text-[var(--color-heading)]',
                'prose-p:font-[family-name:var(--font-newsreader)] prose-p:text-[var(--color-body)] prose-p:leading-[1.8]',
                'prose-li:font-[family-name:var(--font-newsreader)] prose-li:text-[var(--color-body)]',
                'prose-pre:bg-transparent prose-pre:p-0',
                // Task lists
                '[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0',
                '[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:gap-2 [&_ul[data-type=taskList]_li]:items-start',
                '[&_ul[data-type=taskList]_li_label]:mt-1 [&_ul[data-type=taskList]_li_input]:pointer-events-none',
                // Highlight
                '[&_mark]:bg-[rgba(255,184,108,0.3)] [&_mark]:rounded-sm [&_mark]:px-0.5',
                // Code blocks
                '[&_.tiptap]:outline-none',
                '[&_.tiptap_pre.hljs]:rounded-lg [&_.tiptap_pre.hljs]:border [&_.tiptap_pre.hljs]:border-[var(--color-border-subtle)] [&_.tiptap_pre.hljs]:bg-[oklch(0.2_0.02_250)] [&_.tiptap_pre.hljs]:p-4',
                '[&_.tiptap_pre.hljs_code]:bg-transparent [&_.tiptap_pre.hljs_code]:p-0 [&_.tiptap_pre.hljs_code]:font-[family-name:var(--font-jetbrains-mono)] [&_.tiptap_pre.hljs_code]:text-sm',
                // Placeholder
                '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:text-[var(--color-muted-text)]',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:float-left',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none',
                '[&_.tiptap_p.is-editor-empty:first-child::before]:h-0',
              ].join(' ')}
            />
          </div>

          {/* Word count bar */}
          <WordCountBar editor={editor} />
        </div>
      )}
    </div>
  )
}
