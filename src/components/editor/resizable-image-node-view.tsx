'use client'

import { useCallback, useRef } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { uploadPostImage } from '@/actions/post-images'
import {
  getPendingUpload,
  removePendingUpload,
} from '@/lib/tiptap/resizable-image-extension'

export function ResizableImageNodeView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const { src, alt, width, caption, uploadState } = node.attrs as {
    src: string
    alt: string
    width: string | null
    caption: string
    uploadState: 'idle' | 'uploading' | 'error'
  }

  const imgRef = useRef<HTMLImageElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const dragSide = useRef<'left' | 'right'>('right')

  // ── Retry upload ────────────────────────────────────────────────────────────
  const handleRetry = useCallback(async () => {
    const file = getPendingUpload(src)
    if (!file) return
    updateAttributes({ uploadState: 'uploading' })
    const fd = new FormData()
    fd.set('file', file)
    const result = await uploadPostImage(fd)
    if ('error' in result) {
      updateAttributes({ uploadState: 'error' })
    } else {
      const oldBlobUrl = src
      updateAttributes({ src: result.url, uploadState: 'idle' })
      removePendingUpload(oldBlobUrl)
      URL.revokeObjectURL(oldBlobUrl)
    }
  }, [src, updateAttributes])

  // ── Drag-to-resize ──────────────────────────────────────────────────────────
  const startResize = useCallback(
    (side: 'left' | 'right', e: React.MouseEvent) => {
      e.preventDefault()
      isDragging.current = true
      startX.current = e.clientX
      startWidth.current = imgRef.current?.offsetWidth ?? 0
      dragSide.current = side

      const onMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current || !imgRef.current) return
        const delta = moveEvent.clientX - startX.current
        const raw =
          dragSide.current === 'right'
            ? startWidth.current + delta
            : startWidth.current - delta
        const clamped = Math.max(120, Math.min(raw, 800))
        imgRef.current.style.width = clamped + 'px'
      }

      const onUp = (upEvent: MouseEvent) => {
        if (!isDragging.current) return
        isDragging.current = false
        const delta = upEvent.clientX - startX.current
        const raw =
          dragSide.current === 'right'
            ? startWidth.current + delta
            : startWidth.current - delta
        const clamped = Math.max(120, Math.min(raw, 800))
        updateAttributes({ width: clamped + 'px' })
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [updateAttributes]
  )

  // ── Uploading state ─────────────────────────────────────────────────────────
  if (uploadState === 'uploading') {
    return (
      <NodeViewWrapper>
        <figure className="my-6 text-center" contentEditable={false}>
          <div
            className="mx-auto animate-pulse rounded-lg bg-[var(--color-surface)]"
            style={{ width: width ?? '100%', maxWidth: '100%', height: '220px' }}
          >
            <div className="flex h-full items-center justify-center gap-2">
              <div className="size-4 animate-spin rounded-full border-2 border-[rgba(178,197,255,0.2)] border-t-[var(--color-link)]" />
              <span className="font-[family-name:var(--font-inter)] text-sm text-[var(--color-muted-text)]">
                Uploading image…
              </span>
            </div>
          </div>
        </figure>
      </NodeViewWrapper>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (uploadState === 'error') {
    return (
      <NodeViewWrapper>
        <figure className="my-6" contentEditable={false}>
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <span className="text-red-400">⚠</span>
            <span className="flex-1 font-[family-name:var(--font-inter)] text-sm text-red-300">
              Upload failed — file may be too large (5 MB limit)
            </span>
            <button
              type="button"
              onClick={() => void handleRetry()}
              className="rounded-md border border-red-400/40 bg-red-500/15 px-3 py-1 font-[family-name:var(--font-inter)] text-sm text-red-300 transition-colors hover:bg-red-500/25"
            >
              Retry
            </button>
          </div>
        </figure>
      </NodeViewWrapper>
    )
  }

  // ── Idle (loaded) state ─────────────────────────────────────────────────────
  return (
    <NodeViewWrapper>
      <figure className="my-6 text-center" contentEditable={false}>
        <div
          className="relative mx-auto inline-block"
          style={{ width: width ?? '100%', maxWidth: '100%' }}
        >
          <img
            ref={imgRef}
            src={src}
            alt={alt ?? ''}
            draggable={false}
            className={[
              'block h-auto w-full rounded-md',
              selected
                ? 'outline outline-2 outline-offset-2 outline-[rgba(178,197,255,0.5)]'
                : '',
            ].join(' ')}
          />
          {selected && (
            <>
              {/* Left resize handle */}
              <div
                onMouseDown={(e) => startResize('left', e)}
                className="absolute -left-1 top-1/2 h-10 w-1.5 -translate-y-1/2 cursor-ew-resize rounded-full bg-[rgba(178,197,255,0.85)] shadow-sm"
              />
              {/* Right resize handle */}
              <div
                onMouseDown={(e) => startResize('right', e)}
                className="absolute -right-1 top-1/2 h-10 w-1.5 -translate-y-1/2 cursor-ew-resize rounded-full bg-[rgba(178,197,255,0.85)] shadow-sm"
              />
            </>
          )}
        </div>

        {/* Caption — plain contenteditable; onBlur persists to Tiptap attrs */}
        <div
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Add a caption…"
          onBlur={(e) =>
            updateAttributes({ caption: e.currentTarget.textContent ?? '' })
          }
          className="mx-auto mt-2 max-w-prose font-[family-name:var(--font-inter)] text-sm italic text-[var(--color-muted-text)] outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--color-muted-text)]/40"
        >
          {caption || null}
        </div>
      </figure>
    </NodeViewWrapper>
  )
}
