import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllTags } from '@/lib/queries/tags'

export const metadata: Metadata = { title: 'Topics' }

export default async function TagsPage() {
  const tags = await getAllTags()

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold">
          Topics
        </h1>
        <p className="font-[family-name:var(--font-newsreader)] text-muted-foreground mt-2">
          Browse articles by subject area.
        </p>
      </div>

      {tags.length === 0 ? (
        <p className="text-muted-foreground">No topics yet.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="bg-primary/5 hover:bg-primary/10 text-primary font-[family-name:var(--font-inter)] text-sm font-medium px-4 py-2 rounded-full transition-colors border border-primary/10"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
