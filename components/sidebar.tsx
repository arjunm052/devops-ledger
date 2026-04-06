import Link from "next/link"

interface SidebarProps {
  tags: { id: string; name: string; slug: string }[]
}

export function Sidebar({ tags }: SidebarProps) {
  return (
    <aside className="sticky top-20 space-y-6">
      {/* Topics */}
      <section>
        <h3 className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="bg-primary/5 hover:bg-primary/10 text-primary text-sm px-3 py-1 rounded-full transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Search */}
      <section>
        <h3 className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Search
        </h3>
        <form action="/search" method="get">
          <input
            type="search"
            name="q"
            placeholder="Search articles..."
            className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </form>
      </section>

      {/* About */}
      <section>
        <h3 className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          About
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Engineering insights, architecture deep-dives, and DevOps patterns from the trenches.
        </p>
        <Link
          href="/about"
          className="inline-block mt-2 text-sm font-medium text-primary hover:underline"
        >
          Learn more &rarr;
        </Link>
      </section>
    </aside>
  )
}
