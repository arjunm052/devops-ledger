# Pending Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 15 pending features from Stitch designs across 7 groups (A-G).

**Architecture:** Each group builds on existing patterns — RSC pages, Supabase queries in `lib/queries/`, server actions in `actions/`, client components only for interactivity. New DB tables (follows, notifications, newsletter_subscribers) are created via Supabase SQL. All styling follows the existing Stitch design system (Space Grotesk headings, Newsreader body, Inter labels, blue tonal palette).

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (PostgreSQL + Auth + Storage), Tailwind CSS 4, shadcn/ui, Tiptap v3, next-themes (dark mode)

---

## Group A: Author Profile Page

### Task 1: Add `getProfileByUsername` query

**Files:**
- Modify: `lib/queries/profiles.ts`
- Test: `__tests__/lib/queries/profiles.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/queries/profiles.test.ts
import { describe, it, expect, vi } from 'vitest'

const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))
const mockSupabase = { from: mockFrom }

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

describe('getProfileByUsername', () => {
  it('fetches a profile by username', async () => {
    const { getProfileByUsername } = await import('@/lib/queries/profiles')
    const fakeProfile = { id: '1', full_name: 'Test', username: 'testuser', avatar_url: null, bio: 'Bio', website: null, role: 'author', created_at: '2024-01-01' }
    mockSingle.mockResolvedValue({ data: fakeProfile, error: null })

    const result = await getProfileByUsername('testuser')
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockEq).toHaveBeenCalledWith('username', 'testuser')
    expect(result).toEqual(fakeProfile)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/queries/profiles.test.ts`
Expected: FAIL — `getProfileByUsername` is not exported

- [ ] **Step 3: Write the implementation**

Add to `lib/queries/profiles.ts`:

```ts
export async function getProfileByUsername(username: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, bio, website, role, created_at')
    .eq('username', username)
    .single()

  if (error) throw error
  return data
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/queries/profiles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/queries/profiles.ts __tests__/lib/queries/profiles.test.ts
git commit -m "feat: add getProfileByUsername query"
```

### Task 2: Add `getPostsByAuthor` query

**Files:**
- Modify: `lib/queries/posts.ts`

- [ ] **Step 1: Add the query function**

Add to `lib/queries/posts.ts`:

```ts
export async function getPostsByAuthor(authorId: string, limit = 6, offset = 0) {
  const supabase = await createServerSupabaseClient()

  const { data, error, count } = await supabase
    .from('posts')
    .select(
      `
      id, title, slug, excerpt, cover_image_url, reading_time_mins, published_at, created_at,
      author:profiles!posts_author_id_fkey ( id, full_name, username, avatar_url ),
      tags:post_tags ( tag:tags ( id, name, slug ) ),
      claps ( count )
      `,
      { count: 'exact' }
    )
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return { posts: data, total: count ?? 0 }
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add lib/queries/posts.ts
git commit -m "feat: add getPostsByAuthor query with pagination"
```

### Task 3: Create the Author Profile page

**Files:**
- Create: `app/author/[username]/page.tsx`

- [ ] **Step 1: Create the page component**

```tsx
// app/author/[username]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getProfileByUsername } from '@/lib/queries/profiles'
import { getPostsByAuthor } from '@/lib/queries/posts'
import ArticleCard from '@/components/article-card'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  try {
    const profile = await getProfileByUsername(username)
    return {
      title: profile.full_name ?? profile.username,
      description: profile.bio ?? `Posts by ${profile.full_name ?? profile.username}`,
    }
  } catch {
    return { title: 'Author Not Found' }
  }
}

export default async function AuthorProfilePage({ params }: PageProps) {
  const { username } = await params

  let profile: Awaited<ReturnType<typeof getProfileByUsername>>
  try {
    profile = await getProfileByUsername(username)
  } catch {
    notFound()
  }

  const { posts, total } = await getPostsByAuthor(profile.id, 6)

  const totalClaps = posts.reduce(
    (sum, p) => sum + p.claps.reduce((s, c) => s + (c.count ?? 0), 0),
    0
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Profile Hero */}
        <div className="flex flex-col items-center text-center mb-12">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? profile.username}
              width={120}
              height={120}
              className="rounded-full w-[120px] h-[120px] object-cover mb-5"
            />
          ) : (
            <span className="w-[120px] h-[120px] rounded-full bg-[#dae2ff] inline-flex items-center justify-center text-4xl font-medium text-[#0045ad] mb-5">
              {(profile.full_name ?? profile.username).charAt(0).toUpperCase()}
            </span>
          )}

          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-[#0d1c2e]">
            {profile.full_name ?? profile.username}
          </h1>

          <p className="font-[family-name:var(--font-inter)] text-sm text-[#70787f] mt-1">
            @{profile.username}
          </p>

          {profile.bio && (
            <p className="font-[family-name:var(--font-newsreader)] text-lg text-[#40484f] mt-4 max-w-xl leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#0d1c2e]">
                {total}
              </span>
              <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f] block">
                Posts
              </span>
            </div>
            <div className="w-px h-8 bg-[#bfc7d0]/30" />
            <div className="text-center">
              <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#0d1c2e]">
                {totalClaps >= 1000 ? `${(totalClaps / 1000).toFixed(1)}k` : totalClaps}
              </span>
              <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f] block">
                Claps
              </span>
            </div>
          </div>

          {/* Social Links */}
          {profile.website && (
            <div className="flex items-center gap-3 mt-4">
              <Link
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-[#0045ad] hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {profile.website.replace(/^https?:\/\//, '')}
              </Link>
            </div>
          )}
        </div>

        {/* Latest Posts */}
        {posts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e]">
                Latest Posts
              </h2>
              {total > 6 && (
                <span className="font-[family-name:var(--font-inter)] text-sm text-[#0045ad]">
                  View All
                </span>
              )}
            </div>
            <div className="space-y-4">
              {posts.map((post) => (
                <ArticleCard
                  key={post.id}
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  coverImageUrl={post.cover_image_url}
                  readingTimeMins={post.reading_time_mins}
                  publishedAt={post.published_at}
                  author={{
                    username: post.author.username,
                    fullName: post.author.full_name,
                    avatarUrl: post.author.avatar_url,
                  }}
                  tags={post.tags.map((pt) => ({
                    name: pt.tag.name,
                    slug: pt.tag.slug,
                  }))}
                  clapCount={post.claps.reduce(
                    (sum, c) => sum + (c.count ?? 0),
                    0
                  )}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/author/[username]/page.tsx
git commit -m "feat: add public author profile page at /author/[username]"
```

### Task 4: Link to author profiles from article cards and article page

**Files:**
- Modify: `components/article-card.tsx`
- Modify: `app/[slug]/page.tsx`

- [ ] **Step 1: Update ArticleCard to link author name**

In `components/article-card.tsx`, wrap the author name span in a link. Replace the author name `<span>` (line ~70-73) inside the author info div:

```tsx
// Replace the existing author name span with:
<span
  onClick={(e) => {
    e.preventDefault()
    window.location.href = `/author/${author.username}`
  }}
  className="font-[family-name:var(--font-inter)] text-xs text-[#40484f] hover:text-[#0045ad] cursor-pointer transition-colors"
>
  {author.fullName ?? author.username}
</span>
```

- [ ] **Step 2: Update article page to link author name**

In `app/[slug]/page.tsx`, wrap the author name (line ~117-119) with a Link:

```tsx
// Replace the author name span with:
<Link
  href={`/author/${author?.username}`}
  className="font-[family-name:var(--font-inter)] text-sm font-medium text-[#40484f] hover:text-[#0045ad] transition-colors"
>
  {authorName}
</Link>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add components/article-card.tsx app/[slug]/page.tsx
git commit -m "feat: link author names to /author/[username] profiles"
```

---

## Group B: Engagement Features

### Task 5: Bookmark server action and button

**Files:**
- Create: `actions/bookmarks.ts`
- Create: `components/bookmark-button.tsx`

- [ ] **Step 1: Create bookmark server action**

```ts
// actions/bookmarks.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleBookmark(postId: string, path: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Must be signed in to bookmark' }

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)
    revalidatePath(path)
    return { bookmarked: false }
  } else {
    await supabase
      .from('bookmarks')
      .insert({ post_id: postId, user_id: user.id })
    revalidatePath(path)
    return { bookmarked: true }
  }
}

export async function getBookmarkStatus(postId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  return !!data
}
```

- [ ] **Step 2: Create BookmarkButton component**

```tsx
// components/bookmark-button.tsx
'use client'

import { useTransition, useOptimistic } from 'react'
import { toggleBookmark } from '@/actions/bookmarks'

interface BookmarkButtonProps {
  postId: string
  initialBookmarked: boolean
  path: string
}

export function BookmarkButton({ postId, initialBookmarked, path }: BookmarkButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticBookmarked, setOptimisticBookmarked] = useOptimistic(initialBookmarked)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      setOptimisticBookmarked(!optimisticBookmarked)
      await toggleBookmark(postId, path)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="p-1 text-[#70787f] hover:text-[#0045ad] transition-colors"
      aria-label={optimisticBookmarked ? 'Remove bookmark' : 'Bookmark'}
      title={optimisticBookmarked ? 'Remove bookmark' : 'Bookmark'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={optimisticBookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add actions/bookmarks.ts components/bookmark-button.tsx
git commit -m "feat: add bookmark toggle action and BookmarkButton component"
```

### Task 6: Integrate BookmarkButton into ArticleCard and article page

**Files:**
- Modify: `components/article-card.tsx`
- Modify: `app/[slug]/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/search/page.tsx`
- Modify: `app/tag/[slug]/page.tsx`
- Modify: `app/author/[username]/page.tsx`

- [ ] **Step 1: Add `postId` and `bookmarked` to ArticleCard props**

In `components/article-card.tsx`, update the interface and add the bookmark button. Add new props:

```tsx
interface ArticleCardProps {
  postId?: string
  title: string
  slug: string
  excerpt: string | null
  coverImageUrl: string | null
  readingTimeMins: number
  publishedAt: string | null
  author: {
    username: string
    fullName: string | null
    avatarUrl: string | null
  }
  tags: { name: string; slug: string }[]
  clapCount: number
  bookmarked?: boolean
}
```

Add the import at top: `import { BookmarkButton } from '@/components/bookmark-button'`

Add after the clap count span inside the metadata row (after line ~103):

```tsx
{postId && bookmarked !== undefined && (
  <BookmarkButton postId={postId} initialBookmarked={bookmarked} path={`/${slug}`} />
)}
```

- [ ] **Step 2: Pass bookmark data from pages**

This requires fetching bookmark status for each post. To avoid N+1 queries, we'll create a bulk bookmark check. Add to `actions/bookmarks.ts`:

```ts
export async function getBookmarkStatuses(postIds: string[]): Promise<Record<string, boolean>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || postIds.length === 0) return {}

  const { data } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('user_id', user.id)
    .in('post_id', postIds)

  const bookmarked: Record<string, boolean> = {}
  for (const id of postIds) bookmarked[id] = false
  for (const row of data ?? []) bookmarked[row.post_id] = true
  return bookmarked
}
```

Update `app/page.tsx` to fetch and pass bookmarks:

```tsx
import { getPublishedPosts } from '@/lib/queries/posts'
import { getAllTags } from '@/lib/queries/tags'
import { getBookmarkStatuses } from '@/actions/bookmarks'
import ArticleCard from '@/components/article-card'
import { Sidebar } from '@/components/sidebar'

export default async function HomePage() {
  const [posts, tags] = await Promise.all([getPublishedPosts(), getAllTags()])
  const bookmarks = await getBookmarkStatuses(posts.map((p) => p.id))

  return (
    <div className="min-h-screen">
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        <div className="flex-1 space-y-4">
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No posts yet. Check back soon!
            </p>
          ) : (
            posts.map((post) => (
              <ArticleCard
                key={post.id}
                postId={post.id}
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                coverImageUrl={post.cover_image_url}
                readingTimeMins={post.reading_time_mins}
                publishedAt={post.published_at}
                author={{
                  username: post.author.username,
                  fullName: post.author.full_name,
                  avatarUrl: post.author.avatar_url,
                }}
                tags={post.tags.map((pt) => ({
                  name: pt.tag.name,
                  slug: pt.tag.slug,
                }))}
                clapCount={post.claps.reduce(
                  (sum, c) => sum + (c.count ?? 0),
                  0
                )}
                bookmarked={bookmarks[post.id] ?? false}
              />
            ))
          )}
        </div>
        <div className="hidden lg:block w-80">
          <Sidebar tags={tags} />
        </div>
      </div>
    </div>
    </div>
  )
}
```

Apply the same pattern to `app/search/page.tsx`, `app/tag/[slug]/page.tsx`, and `app/author/[username]/page.tsx` — import `getBookmarkStatuses`, fetch bookmarks, pass `postId` and `bookmarked` to each `ArticleCard`.

For `app/[slug]/page.tsx`, import `getBookmarkStatus` (single) and add a `BookmarkButton` next to the clap button area.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add actions/bookmarks.ts components/article-card.tsx app/page.tsx app/search/page.tsx app/tag/[slug]/page.tsx app/author/[username]/page.tsx app/[slug]/page.tsx
git commit -m "feat: integrate bookmark button across all post listings and article page"
```

### Task 7: Follow authors — DB migration + server action + button

**Files:**
- Create: `supabase/migrations/create_follows_table.sql`
- Create: `actions/follows.ts`
- Create: `components/follow-button.tsx`

- [ ] **Step 1: Create the follows table SQL migration**

```sql
-- supabase/migrations/create_follows_table.sql
CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);
```

Run this SQL in the Supabase dashboard or via `supabase db push`.

- [ ] **Step 2: Create follow server action**

```ts
// actions/follows.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFollow(authorId: string, path: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Must be signed in to follow' }
  if (user.id === authorId) return { error: 'Cannot follow yourself' }

  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', authorId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', authorId)
    revalidatePath(path)
    return { following: false }
  } else {
    await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: authorId })
    revalidatePath(path)
    return { following: true }
  }
}

export async function getFollowStatus(authorId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', authorId)
    .maybeSingle()

  return !!data
}

export async function getFollowerCount(authorId: string): Promise<number> {
  const supabase = await createServerSupabaseClient()

  const { count } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', authorId)

  return count ?? 0
}
```

- [ ] **Step 3: Create FollowButton component**

```tsx
// components/follow-button.tsx
'use client'

import { useTransition, useOptimistic } from 'react'
import { toggleFollow } from '@/actions/follows'

interface FollowButtonProps {
  authorId: string
  initialFollowing: boolean
  path: string
}

export function FollowButton({ authorId, initialFollowing, path }: FollowButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticFollowing, setOptimisticFollowing] = useOptimistic(initialFollowing)

  function handleClick() {
    startTransition(async () => {
      setOptimisticFollowing(!optimisticFollowing)
      await toggleFollow(authorId, path)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`font-[family-name:var(--font-inter)] text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
        optimisticFollowing
          ? 'bg-[#dae2ff] text-[#0045ad] hover:bg-red-50 hover:text-red-600'
          : 'bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] text-white hover:opacity-90'
      }`}
    >
      {optimisticFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/create_follows_table.sql actions/follows.ts components/follow-button.tsx
git commit -m "feat: add follow system — DB migration, server action, FollowButton component"
```

### Task 8: Integrate FollowButton into author profile and article page

**Files:**
- Modify: `app/author/[username]/page.tsx`
- Modify: `app/[slug]/page.tsx`

- [ ] **Step 1: Add FollowButton to author profile page**

In `app/author/[username]/page.tsx`, import follow functions and component:

```tsx
import { getFollowStatus, getFollowerCount } from '@/actions/follows'
import { FollowButton } from '@/components/follow-button'
```

After fetching the profile, add:

```tsx
const [followStatus, followerCount] = await Promise.all([
  getFollowStatus(profile.id),
  getFollowerCount(profile.id),
])
```

Add the FollowButton after the username display (below the `@username` paragraph):

```tsx
<FollowButton
  authorId={profile.id}
  initialFollowing={followStatus}
  path={`/author/${username}`}
/>
```

Add follower count to stats row.

- [ ] **Step 2: Add FollowButton to article page**

In `app/[slug]/page.tsx`, import and add FollowButton next to the author name in the author row. Fetch follow status:

```tsx
import { getFollowStatus } from '@/actions/follows'
import { FollowButton } from '@/components/follow-button'
```

After fetching user:

```tsx
const followStatus = author ? await getFollowStatus(author.id) : false
```

Add after the author name Link:

```tsx
{author && (
  <FollowButton
    authorId={author.id}
    initialFollowing={followStatus}
    path={`/${slug}`}
  />
)}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/author/[username]/page.tsx app/[slug]/page.tsx
git commit -m "feat: integrate FollowButton on author profile and article pages"
```

### Task 9: Share button on article page

**Files:**
- Create: `components/share-button.tsx`
- Modify: `app/[slug]/page.tsx`

- [ ] **Step 1: Create ShareButton component**

```tsx
// components/share-button.tsx
'use client'

import { useState } from 'react'

interface ShareButtonProps {
  title: string
  url: string
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="p-2 text-[#70787f] hover:text-[#0045ad] transition-colors rounded-full hover:bg-muted"
      aria-label="Share"
      title={copied ? 'Link copied!' : 'Share'}
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Add ShareButton to article page**

In `app/[slug]/page.tsx`, import and add next to the clap section:

```tsx
import { ShareButton } from '@/components/share-button'
```

Add in the engagement area (alongside ClapButton):

```tsx
<ShareButton title={post.title} url={`${process.env.NEXT_PUBLIC_APP_URL}/${slug}`} />
```

- [ ] **Step 3: Commit**

```bash
git add components/share-button.tsx app/[slug]/page.tsx
git commit -m "feat: add share button with Web Share API + clipboard fallback"
```

---

## Group C: Reading Experience Enhancements

### Task 10: Reading progress bar

**Files:**
- Create: `components/reading-progress.tsx`
- Modify: `app/[slug]/page.tsx`

- [ ] **Step 1: Create ReadingProgress component**

```tsx
// components/reading-progress.tsx
'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function handleScroll() {
      const article = document.querySelector('article')
      if (!article) return

      const rect = article.getBoundingClientRect()
      const articleTop = rect.top + window.scrollY
      const articleHeight = article.scrollHeight
      const windowHeight = window.innerHeight
      const scrollY = window.scrollY

      const start = articleTop
      const end = articleTop + articleHeight - windowHeight
      const current = Math.max(0, Math.min(1, (scrollY - start) / (end - start)))
      setProgress(current * 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Add to article page**

In `app/[slug]/page.tsx`, import and render at the top of the return:

```tsx
import { ReadingProgress } from '@/components/reading-progress'

// Inside the return, as the first child:
<ReadingProgress />
```

- [ ] **Step 3: Commit**

```bash
git add components/reading-progress.tsx app/[slug]/page.tsx
git commit -m "feat: add reading progress bar to article page"
```

### Task 11: Homepage enhancements — hero, trending, topics

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Rewrite homepage with hero, trending, and topics sections**

```tsx
// app/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { getPublishedPosts } from '@/lib/queries/posts'
import { getAllTags } from '@/lib/queries/tags'
import { getBookmarkStatuses } from '@/actions/bookmarks'
import ArticleCard from '@/components/article-card'
import { Sidebar } from '@/components/sidebar'

export default async function HomePage() {
  const [posts, tags] = await Promise.all([getPublishedPosts(20), getAllTags()])
  const bookmarks = await getBookmarkStatuses(posts.map((p) => p.id))

  const heroPost = posts[0] ?? null
  const trendingPosts = posts.slice(1, 4)
  const feedPosts = posts.slice(4)

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Featured Hero */}
        {heroPost && (
          <Link href={`/${heroPost.slug}`} className="block mb-12 group">
            <div className="bg-white rounded-xl overflow-hidden shadow-[0_8px_40px_rgba(13,28,46,0.06)] hover:shadow-[0_8px_40px_rgba(13,28,46,0.12)] transition-all">
              <div className="flex flex-col md:flex-row">
                {heroPost.cover_image_url && (
                  <div className="md:w-1/2 relative aspect-[16/10] md:aspect-auto">
                    <Image
                      src={heroPost.cover_image_url}
                      alt={heroPost.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}
                <div className={`p-8 flex flex-col justify-center ${heroPost.cover_image_url ? 'md:w-1/2' : 'w-full'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f]">
                      {heroPost.author.full_name ?? heroPost.author.username}
                    </span>
                    <span className="text-[#bfc7d0]">&middot;</span>
                    <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f]">
                      {heroPost.reading_time_mins} min read
                    </span>
                  </div>
                  <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold text-[#0d1c2e] group-hover:text-[#0045ad] transition-colors">
                    {heroPost.title}
                  </h2>
                  {heroPost.excerpt && (
                    <p className="font-[family-name:var(--font-newsreader)] text-[#40484f] mt-3 line-clamp-3">
                      {heroPost.excerpt}
                    </p>
                  )}
                  <span className="font-[family-name:var(--font-inter)] text-sm font-medium text-[#0045ad] mt-4 inline-block">
                    Read Story &rarr;
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* On the Radar */}
        {trendingPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-4">
              On the Radar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="bg-white rounded-xl p-5 shadow-[0_8px_40px_rgba(13,28,46,0.06)] hover:shadow-[0_8px_40px_rgba(13,28,46,0.12)] transition-all"
                >
                  <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f]">
                    {post.author.full_name ?? post.author.username}
                  </span>
                  <h3 className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-[#0d1c2e] mt-1 line-clamp-2">
                    {post.title}
                  </h3>
                  <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f] mt-2 block">
                    {post.reading_time_mins} min read
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Topics of Interest */}
        {tags.length > 0 && (
          <section className="mb-12">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-4">
              Topics of Interest
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="bg-[#dae2ff] text-[#001848] text-sm px-4 py-1.5 rounded-full hover:bg-[#c4d0f5] transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest Feed + Sidebar */}
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-2">
              Latest Thoughts
            </h2>
            {feedPosts.length === 0 && posts.length <= 4 ? (
              <p className="text-muted-foreground text-center py-12">
                More posts coming soon!
              </p>
            ) : (
              feedPosts.map((post) => (
                <ArticleCard
                  key={post.id}
                  postId={post.id}
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  coverImageUrl={post.cover_image_url}
                  readingTimeMins={post.reading_time_mins}
                  publishedAt={post.published_at}
                  author={{
                    username: post.author.username,
                    fullName: post.author.full_name,
                    avatarUrl: post.author.avatar_url,
                  }}
                  tags={post.tags.map((pt) => ({
                    name: pt.tag.name,
                    slug: pt.tag.slug,
                  }))}
                  clapCount={post.claps.reduce(
                    (sum, c) => sum + (c.count ?? 0),
                    0
                  )}
                  bookmarked={bookmarks[post.id] ?? false}
                />
              ))
            )}
          </div>
          <div className="hidden lg:block w-80">
            <Sidebar tags={tags} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: homepage hero, on the radar, and topics of interest sections"
```

### Task 12: Search results sidebar filters

**Files:**
- Modify: `app/search/page.tsx`
- Modify: `lib/queries/posts.ts`

- [ ] **Step 1: Update `searchPosts` to accept sort and category params**

In `lib/queries/posts.ts`, update the `searchPosts` function:

```ts
export async function searchPosts(
  query: string,
  limit = 10,
  sortBy: 'relevance' | 'newest' | 'oldest' = 'relevance',
  categorySlug?: string
) {
  const supabase = await createServerSupabaseClient()

  let q = supabase
    .from('posts')
    .select(
      `
      id, title, slug, excerpt, cover_image_url, reading_time_mins, published_at, created_at,
      author:profiles!posts_author_id_fkey ( id, full_name, username, avatar_url ),
      tags:post_tags ( tag:tags ( id, name, slug ) ),
      claps ( count )
      `
    )
    .eq('status', 'published')
    .textSearch('fts', query, { type: 'websearch' })

  if (sortBy === 'newest') {
    q = q.order('published_at', { ascending: false })
  } else if (sortBy === 'oldest') {
    q = q.order('published_at', { ascending: true })
  }

  const { data, error } = await q.limit(limit)

  if (error) throw error

  // Client-side filter by category if provided (Supabase doesn't easily filter nested joins)
  if (categorySlug && data) {
    return data.filter((post) =>
      post.tags.some((pt) => pt.tag.slug === categorySlug)
    )
  }

  return data
}
```

- [ ] **Step 2: Update search page with sidebar filters**

Rewrite `app/search/page.tsx`:

```tsx
import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { searchPosts } from '@/lib/queries/posts'
import { getAllTags } from '@/lib/queries/tags'
import { getBookmarkStatuses } from '@/actions/bookmarks'
import ArticleCard from '@/components/article-card'
import SearchInput from '@/components/search-input'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; sort?: string; category?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `Search results for '${q}'` : 'Search' }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, sort = 'relevance', category } = await searchParams
  const sortBy = (['relevance', 'newest', 'oldest'].includes(sort) ? sort : 'relevance') as 'relevance' | 'newest' | 'oldest'

  const [posts, tags] = await Promise.all([
    q ? searchPosts(q, 20, sortBy, category) : null,
    getAllTags(),
  ])

  const bookmarks = posts ? await getBookmarkStatuses(posts.map((p) => p.id)) : {}

  // Build URL helper
  function filterUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (params.sort ?? sort) sp.set('sort', params.sort ?? sort)
    if (params.category !== undefined) {
      if (params.category) sp.set('category', params.category)
    } else if (category) {
      sp.set('category', category)
    }
    return `/search?${sp.toString()}`
  }

  return (
    <div className="min-h-screen">
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto mb-6">
        <Suspense>
          <SearchInput />
        </Suspense>
      </div>

      {!q && (
        <p className="font-[family-name:var(--font-newsreader)] text-[#40484f] text-center py-12">
          Search for articles on DevOps, Kubernetes, AWS, and more.
        </p>
      )}

      {q && posts && (
        <div className="flex gap-8">
          {/* Results */}
          <div className="flex-1">
            <p className="font-[family-name:var(--font-inter)] text-sm text-[#70787f] mb-4">
              {posts.length} result{posts.length !== 1 ? 's' : ''} for &lsquo;{q}&rsquo;
            </p>

            {posts.length === 0 ? (
              <p className="font-[family-name:var(--font-newsreader)] text-[#40484f] text-center py-12">
                No results found. Try different keywords.
              </p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <ArticleCard
                    key={post.id}
                    postId={post.id}
                    title={post.title}
                    slug={post.slug}
                    excerpt={post.excerpt}
                    coverImageUrl={post.cover_image_url}
                    readingTimeMins={post.reading_time_mins}
                    publishedAt={post.published_at}
                    author={{
                      username: post.author.username,
                      fullName: post.author.full_name,
                      avatarUrl: post.author.avatar_url,
                    }}
                    tags={post.tags.map((pt) => ({
                      name: pt.tag.name,
                      slug: pt.tag.slug,
                    }))}
                    clapCount={post.claps.reduce(
                      (sum, c) => sum + (c.count ?? 0),
                      0
                    )}
                    bookmarked={bookmarks[post.id] ?? false}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Filters */}
          <div className="hidden lg:block w-64">
            <aside className="sticky top-20 space-y-6">
              {/* Sort By */}
              <section className="bg-white rounded-xl p-5 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-3">
                  Sort By
                </h3>
                <div className="space-y-1">
                  {(['relevance', 'newest', 'oldest'] as const).map((s) => (
                    <Link
                      key={s}
                      href={filterUrl({ sort: s })}
                      className={`block text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        sortBy === s ? 'bg-[#dae2ff] text-[#0045ad] font-medium' : 'text-[#40484f] hover:bg-muted'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Link>
                  ))}
                </div>
              </section>

              {/* Category */}
              <section className="bg-white rounded-xl p-5 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-3">
                  Category
                </h3>
                <div className="space-y-1">
                  <Link
                    href={filterUrl({ category: undefined })}
                    className={`block text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      !category ? 'bg-[#dae2ff] text-[#0045ad] font-medium' : 'text-[#40484f] hover:bg-muted'
                    }`}
                  >
                    All
                  </Link>
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={filterUrl({ category: tag.slug })}
                      className={`block text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        category === tag.slug ? 'bg-[#dae2ff] text-[#0045ad] font-medium' : 'text-[#40484f] hover:bg-muted'
                      }`}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add lib/queries/posts.ts app/search/page.tsx
git commit -m "feat: add search sort/category filters with sidebar"
```

### Task 13: Tag page enhancements — stats, related topics, top writers

**Files:**
- Modify: `app/tag/[slug]/page.tsx`
- Add: `lib/queries/tags.ts` (new functions)

- [ ] **Step 1: Add tag stats and related topics queries**

Add to `lib/queries/tags.ts`:

```ts
export async function getTagStats(tagId: string) {
  const supabase = await createServerSupabaseClient()

  // Count published posts with this tag
  const { data: postTags } = await supabase
    .from('post_tags')
    .select('post_id, post:posts!post_tags_post_id_fkey ( status, author_id )')
    .eq('tag_id', tagId)

  const publishedPostTags = (postTags ?? []).filter(
    (pt) => (pt.post as { status: string } | null)?.status === 'published'
  )

  const uniqueAuthors = new Set(
    publishedPostTags.map((pt) => (pt.post as { author_id: string } | null)?.author_id).filter(Boolean)
  )

  return { postCount: publishedPostTags.length, authorCount: uniqueAuthors.size }
}

export async function getRelatedTags(tagId: string, limit = 6) {
  const supabase = await createServerSupabaseClient()

  // Find tags that co-occur with this tag on the same posts
  const { data: postIds } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tagId)

  if (!postIds || postIds.length === 0) return []

  const ids = postIds.map((p) => p.post_id)

  const { data: coTags } = await supabase
    .from('post_tags')
    .select('tag:tags ( id, name, slug )')
    .in('post_id', ids)
    .neq('tag_id', tagId)

  // Count occurrences and deduplicate
  const tagCounts = new Map<string, { id: string; name: string; slug: string; count: number }>()
  for (const row of coTags ?? []) {
    const tag = row.tag as { id: string; name: string; slug: string } | null
    if (!tag) continue
    const existing = tagCounts.get(tag.id)
    if (existing) {
      existing.count++
    } else {
      tagCounts.set(tag.id, { ...tag, count: 1 })
    }
  }

  return Array.from(tagCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export async function getTopWritersForTag(tagId: string, limit = 5) {
  const supabase = await createServerSupabaseClient()

  const { data: postTags } = await supabase
    .from('post_tags')
    .select('post:posts!post_tags_post_id_fkey ( author_id, status, author:profiles!posts_author_id_fkey ( id, full_name, username, avatar_url ) )')
    .eq('tag_id', tagId)

  const authorCounts = new Map<string, { id: string; full_name: string | null; username: string; avatar_url: string | null; count: number }>()

  for (const row of postTags ?? []) {
    const post = row.post as { author_id: string; status: string; author: { id: string; full_name: string | null; username: string; avatar_url: string | null } } | null
    if (!post || post.status !== 'published') continue
    const a = post.author
    const existing = authorCounts.get(a.id)
    if (existing) {
      existing.count++
    } else {
      authorCounts.set(a.id, { ...a, count: 1 })
    }
  }

  return Array.from(authorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
```

- [ ] **Step 2: Update the tag page**

Rewrite `app/tag/[slug]/page.tsx` to include stats, related topics sidebar, and top writers:

Import the new functions and update the page to:
- Show stats ("X Posts, Y Writers") under the tag title
- Replace the generic Sidebar with a custom sidebar containing Related Topics and Top Writers sections
- Add bookmark support to article cards

Full replacement of the sidebar section in the return JSX — replace `<Sidebar tags={tags} />` with:

```tsx
<aside className="sticky top-20 space-y-4">
  {/* Related Topics */}
  {relatedTags.length > 0 && (
    <section className="bg-white rounded-xl p-6 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
      <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-3">
        Related Topics
      </h3>
      <div className="flex flex-wrap gap-2">
        {relatedTags.map((t) => (
          <Link key={t.id} href={`/tag/${t.slug}`} className="bg-[#dae2ff] text-[#001848] text-xs px-3 py-1 rounded-full hover:bg-[#c4d0f5] transition-colors">
            {t.name}
          </Link>
        ))}
      </div>
    </section>
  )}

  {/* Top Writers */}
  {topWriters.length > 0 && (
    <section className="bg-white rounded-xl p-6 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
      <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-3">
        Top Writers
      </h3>
      <div className="space-y-3">
        {topWriters.map((writer) => (
          <Link key={writer.id} href={`/author/${writer.username}`} className="flex items-center gap-3 group">
            <span className="w-8 h-8 rounded-full bg-[#dae2ff] inline-flex items-center justify-center text-xs font-medium text-[#0045ad] shrink-0">
              {(writer.full_name ?? writer.username).charAt(0).toUpperCase()}
            </span>
            <div>
              <span className="font-[family-name:var(--font-inter)] text-sm font-medium text-[#0d1c2e] group-hover:text-[#0045ad] transition-colors">
                {writer.full_name ?? writer.username}
              </span>
              <span className="font-[family-name:var(--font-inter)] text-xs text-[#70787f] block">
                {writer.count} post{writer.count !== 1 ? 's' : ''}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )}

  {/* Newsletter placeholder */}
  <section className="bg-white rounded-xl p-6 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
    <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-2">
      The Weekly Deploy
    </h3>
    <p className="font-[family-name:var(--font-newsreader)] text-sm text-[#40484f] mb-3">
      Curated DevOps insights, delivered weekly.
    </p>
    <p className="text-xs text-[#70787f] italic">Coming soon</p>
  </section>
</aside>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add lib/queries/tags.ts app/tag/[slug]/page.tsx
git commit -m "feat: tag page stats, related topics sidebar, top writers"
```

---

## Group D: Dashboard & Editor Polish

### Task 14: Dashboard pagination

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Add pagination with page search param**

The dashboard already has tab filters and shows a count. Add actual pagination with prev/next links. Update the dashboard page:

At the top of the component, parse page param:

```tsx
interface DashboardPageProps {
  searchParams: Promise<{ filter?: string; page?: string }>
}
```

In the body:

```tsx
const { filter = 'all', page: pageStr = '1' } = await searchParams
const page = Math.max(1, parseInt(pageStr, 10) || 1)
const perPage = 10
```

Replace `filteredPosts` with paginated version:

```tsx
const filteredPosts =
  filter === 'published' ? allPosts.filter((p) => p.status === 'published')
  : filter === 'drafts'    ? allPosts.filter((p) => p.status === 'draft')
  : allPosts

const totalFiltered = filteredPosts.length
const totalPages = Math.ceil(totalFiltered / perPage)
const paginatedPosts = filteredPosts.slice((page - 1) * perPage, page * perPage)
```

Use `paginatedPosts` in the table render. Update the pagination footer:

```tsx
<div className="px-8 py-6 bg-muted/30">
  <div className="flex items-center justify-between" style={{ fontFamily: 'var(--font-inter)' }}>
    <span className="text-sm text-[#40484f]">
      Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalFiltered)} of {totalFiltered} post{totalFiltered !== 1 ? 's' : ''}
    </span>
    <div className="flex items-center gap-2">
      {page > 1 && (
        <Link
          href={`/dashboard?filter=${filter}&page=${page - 1}`}
          className="px-3 py-1.5 rounded-lg bg-muted text-sm text-[#40484f] hover:bg-[#dae2ff] transition-colors"
        >
          &larr; Prev
        </Link>
      )}
      {page < totalPages && (
        <Link
          href={`/dashboard?filter=${filter}&page=${page + 1}`}
          className="px-3 py-1.5 rounded-lg bg-muted text-sm text-[#40484f] hover:bg-[#dae2ff] transition-colors"
        >
          Next &rarr;
        </Link>
      )}
    </div>
  </div>
</div>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add pagination to author dashboard posts table"
```

### Task 15: Post editor — cover image upload + autosave indicator

**Files:**
- Modify: `components/post-editor.tsx`

- [ ] **Step 1: Read the full post editor component**

Read `components/post-editor.tsx` fully to understand the current structure before modifying.

- [ ] **Step 2: Add cover image URL input and autosave status**

Add to the PostEditor component:

1. A cover image URL input field at the top (before the title), with image preview
2. An autosave indicator that shows "Saving..." / "Saved just now" / "Saved X min ago"
3. A debounced auto-save that fires 30s after the last content change (only for existing posts being edited)

The cover image field should be a text input for the URL (matching the existing `cover_image_url` field pattern) with an image preview below it.

The autosave status should appear in the editor header area near the Save Draft button.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add components/post-editor.tsx
git commit -m "feat: add cover image input and autosave status to post editor"
```

---

## Group E: Settings Expansion

### Task 16: Profile settings — additional tabs

**Files:**
- Modify: `components/profile-settings-form.tsx`
- Modify: `app/dashboard/settings/page.tsx`

- [ ] **Step 1: Read the full profile settings form**

Read `components/profile-settings-form.tsx` fully.

- [ ] **Step 2: Enhance Profile tab and add remaining tabs**

The component already has tab definitions (`const TABS = ['Profile', 'Account', 'Security', 'Notifications', 'Membership']`). Add content for each tab:

**Profile tab enhancements:**
- Add bio character counter showing `{length}/160`
- Add URL preview below username: `thedevopsledger.com/@{username}`

**Account tab:**
- Display user's email (read-only)
- Deactivate account button with confirmation dialog (just UI — actual deactivation can call `supabase.auth.admin.deleteUser` but we'll make it a placeholder that shows a warning)

**Security tab:**
- Password change form (email + new password fields)
- Note: only for email/password users

**Notifications tab:**
- Toggle switches for: email on new comment, email on new follower
- Placeholder — just UI, no backend storage yet

**Membership tab:**
- Display current role
- Account creation date
- Member since duration

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add components/profile-settings-form.tsx app/dashboard/settings/page.tsx
git commit -m "feat: expand settings page with Account, Security, Notifications, Membership tabs"
```

---

## Group F: Infrastructure Features

### Task 17: Dark mode with next-themes

**Files:**
- Modify: `package.json` (install next-themes)
- Create: `components/theme-provider.tsx`
- Create: `components/theme-toggle.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `components/nav.tsx`

- [ ] **Step 1: Install next-themes**

Run: `npm install next-themes`

- [ ] **Step 2: Create ThemeProvider**

```tsx
// components/theme-provider.tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  )
}
```

- [ ] **Step 3: Create ThemeToggle**

```tsx
// components/theme-toggle.tsx
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-1.5 rounded-full text-[#40484f] hover:text-[#0045ad] transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
```

- [ ] **Step 4: Update layout.tsx to wrap with ThemeProvider**

In `app/layout.tsx`:

```tsx
import { ThemeProvider } from '@/components/theme-provider'

// In the body:
<body className="flex min-h-svh flex-col bg-background text-foreground antialiased">
  <ThemeProvider>
    <Nav />
    <main className="flex-1">{children}</main>
    <Footer />
    <Toaster richColors position="bottom-right" />
  </ThemeProvider>
</body>
```

- [ ] **Step 5: Add dark mode CSS variables**

In `app/globals.css`, add a `.dark` section after the `:root` variables with dark-mode Stitch colors:

```css
.dark {
  --background: oklch(0.17 0.02 250);
  --foreground: oklch(0.93 0 0);
  --card: oklch(0.22 0.02 250);
  --card-foreground: oklch(0.93 0 0);
  --popover: oklch(0.22 0.02 250);
  --popover-foreground: oklch(0.93 0 0);
  --primary: oklch(0.93 0 0);
  --primary-foreground: oklch(0.17 0.02 250);
  --secondary: oklch(0.25 0.02 250);
  --secondary-foreground: oklch(0.93 0 0);
  --muted: oklch(0.25 0.02 250);
  --muted-foreground: oklch(0.65 0 0);
  --accent: oklch(0.25 0.02 250);
  --accent-foreground: oklch(0.93 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.3 0.02 250);
  --input: oklch(0.3 0.02 250);
  --ring: oklch(0.5 0 0);
}
```

- [ ] **Step 6: Add ThemeToggle to nav**

In `components/nav.tsx`, import and add `ThemeToggle` in the right-side actions area (before the search icon):

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

// In the right-side div, before the search link:
<ThemeToggle />
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json components/theme-provider.tsx components/theme-toggle.tsx app/layout.tsx app/globals.css components/nav.tsx
git commit -m "feat: add dark mode with next-themes and Stitch dark color tokens"
```

### Task 18: Notifications system

**Files:**
- Create: `supabase/migrations/create_notifications_table.sql`
- Create: `actions/notifications.ts`
- Create: `components/notifications-dropdown.tsx`
- Modify: `components/nav.tsx`
- Modify: `actions/comments.ts`
- Modify: `actions/claps.ts`
- Modify: `actions/follows.ts`

- [ ] **Step 1: Create notifications table**

```sql
-- supabase/migrations/create_notifications_table.sql
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('comment', 'follow', 'clap')),
  actor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
```

Run this SQL in Supabase dashboard.

- [ ] **Step 2: Create notification actions**

```ts
// actions/notifications.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUnreadCount(): Promise<number> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return count ?? 0
}

export async function getNotifications(limit = 20) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('notifications')
    .select('id, type, read, created_at, post_id, actor:profiles!notifications_actor_id_fkey ( full_name, username, avatar_url )')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/')
}

export async function markAllRead() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  revalidatePath('/')
}

// Helper used by other actions to create notifications
export async function createNotification(userId: string, actorId: string, type: 'comment' | 'follow' | 'clap', postId?: string) {
  if (userId === actorId) return // Don't notify yourself
  const supabase = await createServerSupabaseClient()
  await supabase.from('notifications').insert({
    user_id: userId,
    actor_id: actorId,
    type,
    post_id: postId ?? null,
  })
}
```

- [ ] **Step 3: Create NotificationsDropdown component**

```tsx
// components/notifications-dropdown.tsx
'use client'

import { useState, useTransition } from 'react'
import { markNotificationRead, markAllRead } from '@/actions/notifications'

interface Notification {
  id: string
  type: string
  read: boolean
  created_at: string
  post_id: string | null
  actor: { full_name: string | null; username: string; avatar_url: string | null }
}

interface NotificationsDropdownProps {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationsDropdown({ notifications, unreadCount }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function getMessage(n: Notification) {
    const name = n.actor.full_name ?? n.actor.username
    switch (n.type) {
      case 'comment': return `${name} commented on your post`
      case 'follow': return `${name} started following you`
      case 'clap': return `${name} clapped for your post`
      default: return `${name} interacted with you`
    }
  }

  function handleClick(n: Notification) {
    if (!n.read) {
      startTransition(() => markNotificationRead(n.id))
    }
    setOpen(false)
    if (n.post_id) {
      // Navigate is handled by the caller
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-[#40484f] hover:text-[#0045ad] transition-colors"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-[0_8px_40px_rgba(13,28,46,0.12)] z-50 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-[#bfc7d0]/20">
              <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() => startTransition(() => markAllRead())}
                  disabled={isPending}
                  className="text-xs text-[#0045ad] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-[#70787f]">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-start gap-3 ${
                      !n.read ? 'bg-[#eff4ff]' : ''
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-[#dae2ff] inline-flex items-center justify-center text-xs font-medium text-[#0045ad] shrink-0 mt-0.5">
                      {(n.actor.full_name ?? n.actor.username).charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-inter)] text-sm text-[#0d1c2e]">
                        {getMessage(n)}
                      </p>
                      <span className="text-xs text-[#70787f]">
                        {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Add notification creation to existing actions**

In `actions/comments.ts`, after successful insert, add:

```ts
import { createNotification } from '@/actions/notifications'

// After successful comment insert, notify the post author:
const { data: postData } = await supabase.from('posts').select('author_id').eq('id', parsed.data.postId).single()
if (postData) {
  await createNotification(postData.author_id, user.id, 'comment', parsed.data.postId)
}
```

In `actions/claps.ts`, after successful clap, add similar notification.

In `actions/follows.ts`, after successful follow (not unfollow), add:

```ts
await createNotification(authorId, user.id, 'follow')
```

- [ ] **Step 5: Add NotificationsDropdown to nav**

In `components/nav.tsx`, fetch notifications and render the dropdown for authenticated users:

```tsx
import { getNotifications, getUnreadCount } from '@/actions/notifications'
import { NotificationsDropdown } from '@/components/notifications-dropdown'

// Inside Nav(), after getting user:
let notifications: Awaited<ReturnType<typeof getNotifications>> = []
let unreadCount = 0
if (user) {
  ;[notifications, unreadCount] = await Promise.all([getNotifications(10), getUnreadCount()])
}

// In the JSX, before the user menu:
{user && (
  <NotificationsDropdown notifications={notifications} unreadCount={unreadCount} />
)}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/create_notifications_table.sql actions/notifications.ts components/notifications-dropdown.tsx components/nav.tsx actions/comments.ts actions/claps.ts actions/follows.ts
git commit -m "feat: notifications system — DB, actions, dropdown, trigger on comments/claps/follows"
```

### Task 19: Newsletter subscription

**Files:**
- Create: `supabase/migrations/create_newsletter_subscribers_table.sql`
- Create: `actions/newsletter.ts`
- Create: `components/newsletter-form.tsx`
- Modify: `app/page.tsx`
- Modify: `components/sidebar.tsx`

- [ ] **Step 1: Create newsletter subscribers table**

```sql
-- supabase/migrations/create_newsletter_subscribers_table.sql
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  confirmed boolean DEFAULT false
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
```

Run this SQL in Supabase dashboard.

- [ ] **Step 2: Create newsletter server action**

```ts
// actions/newsletter.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const emailSchema = z.string().email('Please enter a valid email address')

export async function subscribeToNewsletter(email: string): Promise<{ success: true } | { error: string }> {
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email: parsed.data }, { onConflict: 'email' })

  if (error) return { error: 'Something went wrong. Please try again.' }
  return { success: true }
}
```

- [ ] **Step 3: Create NewsletterForm component**

```tsx
// components/newsletter-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { subscribeToNewsletter } from '@/actions/newsletter'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await subscribeToNewsletter(email)
      if ('success' in result) {
        setMessage({ type: 'success', text: 'Subscribed! Check your inbox.' })
        setEmail('')
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 rounded-full bg-[#d5e3fc] px-4 py-2 text-sm outline-none placeholder:text-[#70787f] focus:ring-2 focus:ring-[#0045ad]/30"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? '...' : 'Subscribe'}
        </button>
      </div>
      {message && (
        <p className={`text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {message.text}
        </p>
      )}
    </form>
  )
}
```

- [ ] **Step 4: Add newsletter to sidebar and homepage**

In `components/sidebar.tsx`, add a newsletter section:

```tsx
import { NewsletterForm } from '@/components/newsletter-form'

// Add after the About section:
<section className="bg-white rounded-xl p-6 shadow-[0_8px_40px_rgba(13,28,46,0.06)]">
  <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] mb-2">
    Curated Inbox
  </h3>
  <p className="font-[family-name:var(--font-newsreader)] text-sm text-[#40484f] mb-3">
    The best DevOps insights, delivered weekly.
  </p>
  <NewsletterForm />
</section>
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/create_newsletter_subscribers_table.sql actions/newsletter.ts components/newsletter-form.tsx components/sidebar.tsx
git commit -m "feat: newsletter subscription — DB table, action, form, sidebar integration"
```

---

## Group G: Deployment & Production

### Task 20: SEO — sitemap, robots.txt, Open Graph

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Modify: `app/layout.tsx` (enhance metadata)

- [ ] **Step 1: Create sitemap**

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thedevopsledger.com'

  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const { data: tags } = await supabase
    .from('tags')
    .select('slug')

  const postEntries = (posts ?? []).map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly' as const,
  }))

  const tagEntries = (tags ?? []).map((tag) => ({
    url: `${baseUrl}/tag/${tag.slug}`,
    changeFrequency: 'weekly' as const,
  }))

  return [
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly' },
    { url: `${baseUrl}/tags`, changeFrequency: 'weekly' },
    { url: `${baseUrl}/search`, changeFrequency: 'monthly' },
    ...postEntries,
    ...tagEntries,
  ]
}
```

- [ ] **Step 2: Create robots.txt**

```ts
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thedevopsledger.com'

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

- [ ] **Step 3: Enhance root layout metadata**

Update `app/layout.tsx` metadata:

```ts
export const metadata: Metadata = {
  title: { default: 'The DevOps Ledger', template: '%s | The DevOps Ledger' },
  description: 'Engineering insights, architecture deep-dives, and DevOps patterns from the trenches.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://thedevopsledger.com'),
  openGraph: {
    type: 'website',
    siteName: 'The DevOps Ledger',
    title: 'The DevOps Ledger',
    description: 'Engineering insights, architecture deep-dives, and DevOps patterns from the trenches.',
  },
  twitter: {
    card: 'summary_large_image',
  },
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.ts app/robots.ts app/layout.tsx
git commit -m "feat: SEO — sitemap.xml, robots.txt, Open Graph metadata"
```

### Task 21: Update project state files

**Files:**
- Modify: `ai/PROJECT_STATE.md`
- Create: `ai/SESSION_SUMMARY.md`

- [ ] **Step 1: Update PROJECT_STATE.md**

Mark all groups as completed and Phase 5 as completed.

- [ ] **Step 2: Create SESSION_SUMMARY.md**

Document all completed work.

- [ ] **Step 3: Commit**

```bash
git add ai/PROJECT_STATE.md ai/SESSION_SUMMARY.md
git commit -m "docs: update project state — all pending features implemented"
```
