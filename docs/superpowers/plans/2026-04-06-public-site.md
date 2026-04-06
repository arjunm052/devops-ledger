# Public Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public reading experience — homepage with feed + sidebar, article reader with claps/comments, tag pages, full-text search, and about page. All following "The Ledger" editorial design from the Stitch screens.

**Architecture:** Next.js 16 App Router with React Server Components for data fetching. Supabase queries via the server client. Tailwind CSS v4 + shadcn/ui for styling. The Stitch "Architectural Ledger" design system: Space Grotesk headlines, Newsreader body, Inter labels, no borders (surface color shifts), ambient shadows.

**Tech Stack:** Next.js 16.2, TypeScript 6, Supabase, Tailwind CSS 4.2.2, shadcn/ui 4.1.1

---

## File Map

```
app/
├── page.tsx                          # Homepage — feed + sidebar
├── [slug]/page.tsx                   # Article reader
├── tag/[slug]/page.tsx               # Posts filtered by tag
├── search/page.tsx                   # Search results
├── about/page.tsx                    # Author profile
├── layout.tsx                        # (already exists — update with nav/footer)

components/
├── nav.tsx                           # Main navigation bar
├── footer.tsx                        # Site footer
├── article-card.tsx                  # Post card for feed lists
├── sidebar.tsx                       # Homepage/tag sidebar (topics, search, about)
├── clap-button.tsx                   # Clap interaction (client component)
├── comment-section.tsx               # Comments with replies (client component)
├── comment-form.tsx                  # New comment form
├── search-input.tsx                  # Search bar component

lib/
├── queries/
│   ├── posts.ts                      # Supabase queries for posts
│   ├── tags.ts                       # Supabase queries for tags
│   └── profiles.ts                   # Supabase queries for profiles

actions/
├── claps.ts                          # Server Action: upsert clap
├── comments.ts                       # Server Action: create/delete comment
```

---

## Task 1: Data query helpers

**Files:**
- Create: `lib/queries/posts.ts`
- Create: `lib/queries/tags.ts`
- Create: `lib/queries/profiles.ts`

- [ ] **Step 1: Create `lib/queries/posts.ts`**

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getPublishedPosts(limit = 10, offset = 0) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, slug, excerpt, cover_image_url, status,
      reading_time_mins, published_at, created_at,
      author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url),
      tags:post_tags(tag:tags(id, name, slug)),
      claps(count)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getPostBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, slug, content, excerpt, cover_image_url, status,
      reading_time_mins, published_at, created_at, updated_at,
      author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url, bio),
      tags:post_tags(tag:tags(id, name, slug)),
      claps(count),
      comments(id, body, created_at, parent_id,
        author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url)
      )
    `)
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

export async function getPostsByTag(tagSlug: string, limit = 10, offset = 0) {
  const supabase = await createServerSupabaseClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('id, name, slug, description')
    .eq('slug', tagSlug)
    .single()

  if (!tag) return { tag: null, posts: [] }

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id, title, slug, excerpt, cover_image_url, status,
      reading_time_mins, published_at,
      author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url),
      tags:post_tags(tag:tags(id, name, slug)),
      claps(count)
    `)
    .eq('status', 'published')
    .in('id', (await supabase
      .from('post_tags')
      .select('post_id')
      .eq('tag_id', tag.id)
    ).data?.map(pt => pt.post_id) ?? [])
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return { tag, posts: posts ?? [] }
}

export async function searchPosts(query: string, limit = 10) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, slug, excerpt, cover_image_url,
      reading_time_mins, published_at,
      author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url),
      tags:post_tags(tag:tags(id, name, slug)),
      claps(count)
    `)
    .eq('status', 'published')
    .textSearch('fts', query, { type: 'websearch' })
    .limit(limit)

  if (error) throw error
  return data
}
```

- [ ] **Step 2: Create `lib/queries/tags.ts`**

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAllTags() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug, description')
    .order('name')

  if (error) throw error
  return data
}
```

- [ ] **Step 3: Create `lib/queries/profiles.ts`**

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAuthorProfile() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'author')
    .single()

  if (error) throw error
  return data
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/queries/
git commit -m "feat: add Supabase query helpers for posts, tags, and profiles"
```

---

## Task 2: Nav and Footer components

**Files:**
- Create: `components/nav.tsx`
- Create: `components/footer.tsx`
- Modify: `app/layout.tsx` — add Nav + Footer

- [ ] **Step 1: Create `components/nav.tsx`**

Glassmorphic sticky nav matching the Stitch design: "The Ledger" logo left, Home/Tags/About links, Search icon, Sign In button (or avatar if logged in). Use Space Grotesk for the logo. No borders — use surface color shifts.

- [ ] **Step 2: Create `components/footer.tsx`**

Minimal footer: "The Ledger" branding, nav links, copyright.

- [ ] **Step 3: Update `app/layout.tsx`**

Wrap children with Nav and Footer.

- [ ] **Step 4: Commit**

```bash
git add components/nav.tsx components/footer.tsx app/layout.tsx
git commit -m "feat: add Nav and Footer components to root layout"
```

---

## Task 3: Article card component

**Files:**
- Create: `components/article-card.tsx`

- [ ] **Step 1: Create `components/article-card.tsx`**

Reusable card matching the Stitch homepage design: title (serif bold), excerpt, author info, tag chips, reading time, date, clap count, cover thumbnail right-aligned. No borders — use surface-container-lowest background. Hover: subtle scale-up (1.02x).

- [ ] **Step 2: Commit**

```bash
git add components/article-card.tsx
git commit -m "feat: add ArticleCard component for post feeds"
```

---

## Task 4: Sidebar component

**Files:**
- Create: `components/sidebar.tsx`

- [ ] **Step 1: Create `components/sidebar.tsx`**

Right sidebar matching Stitch design: Topics section (tag chips linking to /tag/[slug]), Search bar, About section with brief description. Sticky on scroll.

- [ ] **Step 2: Commit**

```bash
git add components/sidebar.tsx
git commit -m "feat: add Sidebar component with topics, search, and about"
```

---

## Task 5: Homepage

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement homepage**

Feed + Sidebar layout. Server Component that fetches published posts via `getPublishedPosts()` and tags via `getAllTags()`. Renders ArticleCard list on left (2/3 width), Sidebar on right (1/3 width). "Load more" pagination at bottom.

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: implement homepage with article feed and sidebar"
```

---

## Task 6: Article reader page

**Files:**
- Create: `app/[slug]/page.tsx`

- [ ] **Step 1: Implement article reader**

Server Component that fetches post by slug via `getPostBySlug()`. Renders: cover image, title (Space Grotesk display), author info row, reading time, published date, tags, full article content (render Tiptap JSON), clap button, and comments section. Generate metadata for SEO (title, description, OG image).

- [ ] **Step 2: Create Tiptap JSON renderer**

Create `components/tiptap-renderer.tsx` — a client component that takes Tiptap JSON and renders it as HTML using `@tiptap/react` in read-only mode with the same extensions (CodeBlockLowlight for syntax highlighting). Style with Tailwind prose classes.

- [ ] **Step 3: Commit**

```bash
git add app/\[slug\]/ components/tiptap-renderer.tsx
git commit -m "feat: implement article reader with Tiptap content rendering"
```

---

## Task 7: Clap and Comment server actions + components

**Files:**
- Create: `actions/claps.ts`
- Create: `actions/comments.ts`
- Create: `components/clap-button.tsx`
- Create: `components/comment-section.tsx`
- Create: `components/comment-form.tsx`

- [ ] **Step 1: Create `actions/claps.ts`**

Server Action: upsert clap for current user on a post. Increment count (max 50).

- [ ] **Step 2: Create `actions/comments.ts`**

Server Actions: createComment, deleteComment.

- [ ] **Step 3: Create `components/clap-button.tsx`**

Client component: animated clap button with count display. Calls the clap server action.

- [ ] **Step 4: Create `components/comment-section.tsx` and `components/comment-form.tsx`**

Threaded comments: display top-level comments with nested replies. Comment form with text input.

- [ ] **Step 5: Commit**

```bash
git add actions/claps.ts actions/comments.ts components/clap-button.tsx components/comment-section.tsx components/comment-form.tsx
git commit -m "feat: add clap and comment functionality"
```

---

## Task 8: Tag page

**Files:**
- Create: `app/tag/[slug]/page.tsx`

- [ ] **Step 1: Implement tag page**

Similar to homepage but filtered by tag. Server Component: fetch tag info + filtered posts via `getPostsByTag()`. Shows tag name as hero, article cards, sidebar with related tags. Generate metadata.

- [ ] **Step 2: Commit**

```bash
git add app/tag/
git commit -m "feat: implement tag page with filtered post feed"
```

---

## Task 9: Search page

**Files:**
- Create: `app/search/page.tsx`
- Create: `components/search-input.tsx`

- [ ] **Step 1: Create search input component**

Client component: search bar with debounced input that updates URL query params.

- [ ] **Step 2: Implement search page**

Server Component: reads `?q=` from searchParams, calls `searchPosts()`, renders results as article cards. Empty state if no results.

- [ ] **Step 3: Commit**

```bash
git add app/search/ components/search-input.tsx
git commit -m "feat: implement full-text search page"
```

---

## Task 10: About page

**Files:**
- Create: `app/about/page.tsx`

- [ ] **Step 1: Implement about page**

Server Component: fetch author profile via `getAuthorProfile()` + recent posts. Render: avatar, name, bio, social links, stats, latest posts cards. Match the Stitch "Author Profile" design.

- [ ] **Step 2: Commit**

```bash
git add app/about/
git commit -m "feat: implement author about page"
```

---

## Task 11: Push and verify

- [ ] **Step 1: Run all tests**

```bash
npm run test:run
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Push to GitHub**

```bash
git push origin main
```

---

*Next: Plan 3 — Author Tools (editor, dashboard, post CRUD, settings)*
