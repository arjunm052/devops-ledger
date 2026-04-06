'use client'

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { uploadPostImage } from '@/actions/post-images'
import { getImageFileFromDataTransfer } from '@/components/article-editor/image-clipboard'
import { cn } from '@/lib/utils'

interface CoverImageFieldProps {
  imageUrl: string
  onImageUrl: (url: string) => void
  disabled?: boolean
}

export function CoverImageField({
  imageUrl,
  onImageUrl,
  disabled,
}: CoverImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const runUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        const fd = new FormData()
        fd.set('file', file)
        const result = await uploadPostImage(fd)
        if ('error' in result) {
          toast.error(result.error)
          return
        }
        onImageUrl(result.url)
        toast.success('Cover image uploaded')
      } finally {
        setUploading(false)
      }
    },
    [onImageUrl]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (disabled || uploading) return
      const file = getImageFileFromDataTransfer(e.dataTransfer)
      if (file) void runUpload(file)
    },
    [disabled, uploading, runUpload]
  )

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled || uploading) return
      const file = getImageFileFromDataTransfer(e.clipboardData)
      if (file) {
        e.preventDefault()
        void runUpload(file)
      }
    },
    [disabled, uploading, runUpload]
  )

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onPaste={onPaste}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !uploading) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        className={cn(
          'rounded-xl border-2 border-dashed transition-colors outline-none',
          'border-[var(--color-border-subtle)] bg-[var(--color-input-bg)]/40',
          dragOver && 'border-[#0045ad]/60 bg-[#0045ad]/10',
          (disabled || uploading) && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void runUpload(f)
          }}
        />
        {imageUrl ? (
          <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={(ev) => {
                ;(ev.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 bg-black/50 p-2">
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => inputRef.current?.click()}
                className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
              >
                {uploading ? 'Uploading…' : 'Replace'}
              </button>
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => onImageUrl('')}
                className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 px-4 py-8 text-center"
          >
            <span className="font-[family-name:var(--font-inter)] text-sm font-medium text-[var(--color-heading)]">
              {uploading ? 'Uploading…' : 'Add cover image'}
            </span>
            <span className="max-w-sm font-[family-name:var(--font-inter)] text-xs text-[var(--color-muted-text)]">
              Drag and drop, paste from clipboard, or click to choose a file (max 5MB)
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
