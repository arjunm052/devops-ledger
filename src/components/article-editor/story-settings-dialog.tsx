'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Tag {
  id: string
  name: string
  slug: string
}

function TagChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-input-bg)] px-2.5 py-1 text-xs font-medium text-[#0045ad]">
      {name}
      <button
        type="button"
        onClick={onRemove}
        className="leading-none transition-colors hover:text-[var(--color-link-hover)]"
        aria-label={`Remove ${name}`}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </span>
  )
}

export function StorySettingsDialog({
  open,
  onOpenChange,
  coverImageUrl,
  onCoverImageUrlChange,
  excerpt,
  onExcerptChange,
  status,
  onStatusChange,
  allTags,
  selectedTagIds,
  onToggleTag,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  coverImageUrl: string
  onCoverImageUrlChange: (v: string) => void
  excerpt: string
  onExcerptChange: (v: string) => void
  status: 'draft' | 'published'
  onStatusChange: (s: 'draft' | 'published') => void
  allTags: Tag[]
  selectedTagIds: string[]
  onToggleTag: (id: string) => void
  error: string | null
}) {
  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id))
  const unselectedTags = allTags.filter((t) => !selectedTagIds.includes(t.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-space-grotesk)]">
            Story settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          <section>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--color-muted-text)] font-[family-name:var(--font-inter)]">
              Cover image URL (optional)
            </label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => onCoverImageUrlChange(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted-text)] focus:border-[#0045ad] font-[family-name:var(--font-inter)]"
            />
            <p className="mt-1 text-[10px] text-[var(--color-muted-text)] font-[family-name:var(--font-inter)]">
              Use the hero area to upload; paste a URL here if the image is already hosted elsewhere.
            </p>
          </section>

          <section>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--color-muted-text)] font-[family-name:var(--font-inter)]">
              Tags <span className="font-normal normal-case tracking-normal">({selectedTagIds.length}/5)</span>
            </label>
            {selectedTags.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <TagChip key={tag.id} name={tag.name} onRemove={() => onToggleTag(tag.id)} />
                ))}
              </div>
            ) : null}
            {selectedTagIds.length < 5 && unselectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {unselectedTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onToggleTag(tag.id)}
                    className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-muted-text)] transition-colors hover:border-[#1a5dd5]/30 hover:bg-[var(--color-input-bg)] hover:text-[var(--color-link)] font-[family-name:var(--font-inter)]"
                  >
                    + {tag.name}
                  </button>
                ))}
              </div>
            ) : null}
            {allTags.length === 0 ? (
              <p className="text-xs text-[var(--color-muted-text)] font-[family-name:var(--font-inter)]">
                No tags available.
              </p>
            ) : null}
          </section>

          <section>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--color-muted-text)] font-[family-name:var(--font-inter)]">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => onExcerptChange(e.target.value.slice(0, 300))}
              placeholder="A short summary…"
              rows={4}
              className="w-full resize-none rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted-text)] focus:border-[#0045ad] font-[family-name:var(--font-newsreader)]"
            />
            <div className="mt-1 text-right text-[10px] text-[var(--color-muted-text)] font-[family-name:var(--font-inter)]">
              {excerpt.length}/300
            </div>
          </section>

          <section>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--color-muted-text)] font-[family-name:var(--font-inter)]">
              Status
            </label>
            <div className="flex overflow-hidden rounded-lg border border-[var(--color-border-subtle)] font-[family-name:var(--font-inter)]">
              <button
                type="button"
                onClick={() => onStatusChange('draft')}
                className={[
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  status === 'draft'
                    ? 'bg-[#0045ad] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-muted-text)] hover:bg-[var(--color-surface-dim)]',
                ].join(' ')}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => onStatusChange('published')}
                className={[
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  status === 'published'
                    ? 'bg-[#0045ad] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-muted-text)] hover:bg-[var(--color-surface-dim)]',
                ].join(' ')}
              >
                Published
              </button>
            </div>
          </section>

          {error ? (
            <div className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400 font-[family-name:var(--font-inter)]">
              {error}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
