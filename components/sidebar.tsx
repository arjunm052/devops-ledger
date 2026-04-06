import Link from "next/link"

interface SidebarProps {
  tags: { id: string; name: string; slug: string }[]
}

export function Sidebar({ tags }: SidebarProps) {
  return (
    <aside className="sticky top-20 space-y-4">
      {/* Topics */}
      <section className="bg-white rounded-xl p-6 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-3">
          Topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="bg-[#dae2ff] text-[#001848] text-xs px-3 py-1 rounded-full hover:bg-[#c4d0f5] transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Search */}
      <section className="bg-white rounded-xl p-6 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-3">
          Search
        </h3>
        <form action="/search" method="get">
          <input
            type="search"
            name="q"
            placeholder="Search articles..."
            className="w-full rounded-full bg-[#d5e3fc] px-4 py-2 text-sm outline-none placeholder:text-[#70787f] focus:border-b-2 focus:border-[#0045ad] border-0"
          />
        </form>
      </section>

      {/* About */}
      <section className="bg-white rounded-xl p-6 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-3">
          About
        </h3>
        <p className="font-[family-name:var(--font-newsreader)] text-sm text-[#40484f] leading-relaxed">
          Engineering insights, architecture deep-dives, and DevOps patterns from the trenches.
        </p>
        <Link
          href="/about"
          className="font-[family-name:var(--font-inter)] inline-block mt-2 text-sm font-medium text-[#0045ad] hover:underline"
        >
          Learn more &rarr;
        </Link>
      </section>
    </aside>
  )
}
