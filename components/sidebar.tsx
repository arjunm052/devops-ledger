import Link from "next/link"
import { NewsletterForm } from '@/components/newsletter-form'

interface SidebarProps {
  tags: { id: string; name: string; slug: string }[]
}

export function Sidebar({ tags }: SidebarProps) {
  return (
    <aside className="sticky top-20 space-y-4">
      {/* Topics */}
      <section className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[var(--color-heading)] mb-3">
          Topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="bg-[var(--color-surface-raised)] text-[var(--color-chip-text)] text-xs px-3 py-1 rounded-full hover:bg-[rgba(26,93,213,0.2)] transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Search */}
      <section className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[var(--color-heading)] mb-3">
          Search
        </h3>
        <form action="/search" method="get">
          <input
            type="search"
            name="q"
            placeholder="Search articles..."
            className="w-full rounded-full bg-[var(--color-input-bg)] px-4 py-2 text-sm outline-none placeholder:text-[var(--color-muted-text)] focus:border-b-2 focus:border-[#0045ad] border-0 text-[var(--color-heading)]"
          />
        </form>
      </section>

      {/* About */}
      <section className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[var(--color-heading)] mb-3">
          About
        </h3>
        <p className="font-[family-name:var(--font-newsreader)] text-sm text-[var(--color-body)] leading-relaxed">
          Engineering insights, architecture deep-dives, and DevOps patterns from the trenches.
        </p>
        <Link
          href="/about"
          className="font-[family-name:var(--font-inter)] inline-block mt-2 text-sm font-medium text-[var(--color-link)] hover:underline"
        >
          Learn more &rarr;
        </Link>
      </section>
      {/* Newsletter */}
      <section className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[var(--color-heading)] mb-2">
          Curated Inbox
        </h3>
        <p className="font-[family-name:var(--font-newsreader)] text-sm text-[var(--color-body)] mb-3">
          The best DevOps insights, delivered weekly.
        </p>
        <NewsletterForm />
      </section>
    </aside>
  )
}
