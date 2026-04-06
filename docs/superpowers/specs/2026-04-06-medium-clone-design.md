# The DevOps Ledger — Design Spec
**Date:** 2026-04-06  
**Status:** Approved  
**Project:** Medium clone for publishing DevOps / cloud engineering blogs

---

## 1. Overview

A personal Medium clone called **"The DevOps Ledger"** — a solo-author blog platform for publishing long-form DevOps and cloud engineering content. Designed for a single author initially, with the data model ready to support multiple authors in a future version.

Visual design follows **"The Architectural Ledger"** design system: editorial, serif-heavy, minimal, premium. Stitch designs exist for all 9 pages in the `DevOps Tech Blog` Stitch project (`projects/3427292924854146935`).

---

## 2. Tech Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js | 16.2 |
| Language | TypeScript | 6.0 |
| Database / Auth / Storage | Supabase | latest |
| Styling | Tailwind CSS | 4.2.2 |
| UI Components | shadcn/ui | 4.1.1 |
| Rich Text Editor | Tiptap | 3.21+ |
| Syntax Highlighting | lowlight + highlight.js | latest (11.x) |
| Validation | Zod | 4.x |
| Reading Time | remark-reading-time | 2.0.2 |
| Deployment | Vercel | — |

**Dropped:** `next-seo` (replaced by Next.js 16 built-in Metadata API), `reading-time` (replaced by `remark-reading-time`).

---

## 3. Architecture

**Pattern:** Supabase-First — Supabase handles auth, database, storage, and full-text search. Next.js 16 App Router handles UI via React Server Components and Server Actions. Minimal custom API routes.

```
Browser
  └── React Server Components (read path, no auth required)
  └── React Client Components (editor, interactive UI)
  └── Supabase JS Client (realtime, client-side auth state)

Next.js 16 (Vercel)
  └── App Router / RSC
  └── Server Actions (write path)
  └── Middleware (auth guard on /dashboard/*)
  └── Built-in Metadata API (SEO, OG tags)

Supabase
  └── Auth: email+password, Google OAuth, GitHub OAuth, OTP/magic link
  └── PostgreSQL DB (with RLS policies)
  └── Storage: post-images bucket (public CDN)
  └── Full-text search: tsvector generated column on posts
```

---

## 4. Authentication

Four sign-in methods, all via Supabase Auth + `@supabase/ssr`:

1. **Email + Password** — `supabase.auth.signInWithPassword()`
2. **Google OAuth** — `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. **GitHub OAuth** — `supabase.auth.signInWithOAuth({ provider: 'github' })`
4. **OTP / Magic Link** — `supabase.auth.signInWithOtp()`

Session stored in HTTP-only cookies via `@supabase/ssr`. Next.js middleware refreshes expired tokens and guards all `/dashboard/*` routes.

On first sign-up (any method), a Supabase DB trigger auto-creates a row in `profiles` with `role = 'reader'`. The blog author manually sets their role to `'author'` once in the Supabase dashboard to unlock `/dashboard`.

---

## 5. Database Schema

### `profiles`
Extends `auth.users`. Fields: `id` (uuid, FK to auth.users), `username` (unique), `full_name`, `bio`, `avatar_url`, `website`, `role` (enum: author | reader), `created_at`.

### `posts`
Fields: `id`, `author_id` (FK profiles), `title`, `slug` (unique), `content` (jsonb — Tiptap JSON), `excerpt`, `cover_image_url`, `status` (enum: draft | published), `reading_time_mins`, `published_at`, `created_at`, `updated_at`, `fts` (tsvector generated column on title + content for full-text search).

### `tags` + `post_tags` (join)
`tags`: `id`, `name` (unique), `slug` (unique), `description`.  
`post_tags`: `post_id` (FK posts), `tag_id` (FK tags).

### `comments`
Fields: `id`, `post_id` (FK posts), `author_id` (FK profiles), `parent_id` (FK comments — self-referential for threaded replies), `body`, `created_at`.

### `claps`
Fields: `id`, `post_id`, `user_id`, `count` (int, 1–50). UNIQUE constraint on `(post_id, user_id)`. Matches Medium's multi-clap behaviour.

### `bookmarks` *(v2, schema only)*
Fields: `post_id`, `user_id`, `created_at`.

**RLS:** All tables have Row Level Security. Public can read published posts, comments, claps. Only the row owner can write their own data.

---

## 6. Pages & Routes

### Public
| Route | Page |
|---|---|
| `/` | Homepage — feed + sidebar |
| `/[slug]` | Article reader |
| `/tag/[slug]` | Posts filtered by tag |
| `/search?q=` | Full-text search results |
| `/about` | Author profile |
| `/auth/login` | Sign in / sign up |
| `/auth/callback` | OAuth redirect handler |
| `/auth/verify` | OTP / magic link verify |

### Protected (`/dashboard/*`)
| Route | Page |
|---|---|
| `/dashboard` | Post list + stats |
| `/dashboard/new` | Create post (editor) |
| `/dashboard/[id]/edit` | Edit post (editor) |
| `/dashboard/settings` | Profile & account settings |

---

## 7. Editor

Built on **Tiptap v3** with the following extensions:

**From `@tiptap/starter-kit`:** Bold, Italic, Strike, Code (inline), Headings H1–H4, Paragraph, BulletList, OrderedList, Blockquote, HorizontalRule, HardBreak, History.

**Additional extensions:** CodeBlockLowlight (syntax highlighting via lowlight + highlight.js), Image (upload to Supabase Storage), Link (auto-detect), Table, Placeholder, CharacterCount (for reading time), Typography (smart quotes), Youtube (embed), custom Slash Commands (`/` menu).

**Code block languages (priority):** yaml, hcl (terraform), dockerfile, bash/shell, nginx, json, toml, sql, xml + 180 more via highlight.js.

**Image upload flow:** User drops/selects image → Server Action → Supabase Storage `post-images` bucket → public CDN URL inserted into Tiptap content JSON.

**Content storage:** Tiptap JSON stored in `posts.content` as `jsonb`. Rendered client-side — no HTML sanitization needed.

---

## 8. Key Features (v1)

- ✅ Sign in / sign up (4 methods)
- ✅ Publish / draft posts
- ✅ Rich text editor with code blocks (190+ languages), images, tables, embeds
- ✅ Tags / topics
- ✅ Reading time estimate (auto-calculated)
- ✅ Claps (1–50 per user per post)
- ✅ Threaded comments
- ✅ Full-text search (PostgreSQL tsvector)
- ✅ SEO: OG tags, structured data via Next.js Metadata API
- ✅ Author dashboard with post management
- ✅ Profile settings
- 🔲 Bookmarks (v2)
- 🔲 Multi-author (v2 — schema ready)

---

## 9. Stitch Designs

All 9 screens designed in Stitch project `projects/3427292924854146935`:

| Screen | Stitch ID |
|---|---|
| Homepage | `9942b056ccf4459fa25571ea1673e332` |
| Article Page | `55fbbe2883b5434ca591cd880c9d4177` |
| Sign In / Sign Up | `552e96c87d6e49d98458dcdf16fe3140` |
| Author Profile | `423880e9b20e4155afa79250a3b5a845` |
| Search Results | `76a6a9bf454c4b98b592f762292a54fe` |
| Tag Page | `790c4337cbbf459cbe004b822cb18d68` |
| Post Editor | `8bc02213046b48818001cd40da7bffce` |
| Author Dashboard | `93169481bf09494b9fb0cb3d069a2a6c` |
| Profile Settings | `c502634f044a4a75927b7472aece8b47` |

---

## 10. Project Directory

`/Users/arjunmeena/Desktop/the-devops-ledger`
