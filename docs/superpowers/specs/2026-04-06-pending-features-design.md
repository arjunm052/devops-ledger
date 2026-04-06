# Pending Features Design Spec

## Scope

All 15 pending feature areas identified from Stitch designs, implemented in 7 groups (A through G).

---

## Group A: Author Profile Page

**Route:** `app/author/[username]/page.tsx` (React Server Component)

### Data Layer

- `lib/queries/profiles.ts` — add `getProfileByUsername(username: string)`:
  - Fetches profile by username
  - Computes stats: post count and total claps via a joined query on posts + claps
- `lib/queries/posts.ts` — add `getPostsByAuthor(authorId: string, limit = 6, offset = 0)`:
  - Fetches published posts by author, ordered by published_at desc
  - Same select shape as `getPublishedPosts` (includes author, tags, claps)

### Page Sections (matching Stitch "Author Profile" design)

1. **Profile hero** — avatar (120px rounded), full_name, username, bio, website link
2. **Stats row** — "Posts {count}" and "Claps {totalClaps}" using computed data
3. **Social/sharing icons** — website link icon, rendered from profile.website (no new DB fields needed; other social links deferred)
4. **Latest Posts section** — up to 6 posts using `ArticleCard`, with "View All" link that goes to `/author/[username]/posts` (or just loads more inline)
5. Reuses existing `Nav` and `Footer` components

### What's Deferred

- Follow button (Group B)
- Bookmark icons on article cards (Group B)
- Member-only badges (Group B)

### SEO

- Dynamic `metadata` using author's name and bio for title/description
- `generateStaticParams` not needed (dynamic page)

---

## Group B: Engagement Features (Bookmarks, Follow, Share)

### Bookmarks

**DB:** `bookmarks` table already exists (user_id, post_id, created_at).

**Server Actions** (`actions/bookmarks.ts`):
- `toggleBookmark(postId: string)` — insert or delete based on existence
- `getBookmarkStatus(postId: string)` — check if current user has bookmarked

**Component:** `components/bookmark-button.tsx` ("use client")
- Renders bookmark icon, filled when active
- Calls toggleBookmark server action
- Shows on: article cards (homepage, tag page, search results, author profile), article page

### Follow Authors

**DB:** New `follows` table needed: `follower_id` (uuid, FK profiles), `following_id` (uuid, FK profiles), `created_at`, PK on (follower_id, following_id).

**Server Actions** (`actions/follows.ts`):
- `toggleFollow(authorId: string)` — insert or delete
- `getFollowStatus(authorId: string)` — check if current user follows
- `getFollowerCount(authorId: string)` — count followers

**Component:** `components/follow-button.tsx` ("use client")
- "Follow" / "Following" toggle button
- Shows on: author profile page, article page (next to author name)

### Share Button

**Component:** `components/share-button.tsx` ("use client")
- Uses Web Share API (`navigator.share`) with clipboard fallback
- Shows on: article page
- No DB needed

---

## Group C: Reading Experience Enhancements

### Reading Progress Bar

**Component:** `components/reading-progress.tsx` ("use client")
- Thin bar at top of viewport, tracks scroll position relative to article content
- Uses `useEffect` + scroll listener on article container
- Only rendered on `app/[slug]/page.tsx`

### Homepage Enhancements

**Featured Article Hero** — first post from `getPublishedPosts` rendered as a large hero card at top of `app/page.tsx`, separate from the feed below.

**"On the Radar" Section** — next 3 posts after the hero, rendered as compact trending items (title, author, read time).

**"Topics of Interest" Section** — renders all tags as browsable pill links using `getAllTags()`.

### Search Results Filters

**Sort By** — add `sortBy` search param to `app/search/page.tsx`: "relevance" (default, uses fts), "newest", "oldest". Passed to `searchPosts` which adjusts `.order()`.

**Category Filter** — add `category` search param. Filter by tag slug using a join. Sidebar shows available tags.

**Suggested Topics** — sidebar section showing related tags (tags that co-occur with search result tags).

### Tag Page Enhancements

- Topic stats: count of published posts with this tag, count of unique authors
- Related Topics sidebar: tags that frequently co-occur with the current tag (query post_tags for co-occurrence)
- Top Writers sidebar: authors with most posts in this tag

---

## Group D: Dashboard & Editor Polish

### Dashboard Pagination + Tab Filters

- Add `status` tab filter: "All" / "Published" / "Drafts" (filter query by post status)
- Add pagination: page/limit search params, "Showing X of Y posts" with prev/next
- Update `lib/queries/posts.ts` — add `getAuthorPosts(authorId, status?, limit, offset)` returning posts + total count

### Post Editor Enhancements

**Cover Image Upload:**
- Add image upload area at top of editor
- Upload to Supabase Storage bucket
- Preview uploaded image
- Store URL in `posts.cover_image_url` (field already exists)

**Auto-save Draft Status:**
- Debounced auto-save (every 30s or on content change)
- Status indicator: "Saving..." / "Saved just now" / "Saved 2 min ago"
- Uses existing `updatePost` server action

---

## Group E: Settings Expansion

### Additional Tabs

Add tab navigation to `app/dashboard/settings/page.tsx`:

**Profile tab** (existing) — enhance with:
- Username field with URL preview (`thedevopsledger.com/@username`)
- Bio character counter (160 max)
- Connected accounts display (read-only, shows which OAuth providers are linked)

**Account tab** — email display, deactivate account button (with confirmation dialog)

**Notifications tab** — placeholder/preferences UI (email notifications on/off for comments, follows, etc.) — stored in a new `notification_preferences` jsonb column on profiles, or a separate table

**Security tab** — password change form (for email/password users), active sessions display

**Membership tab** — current role display, account creation date

---

## Group F: Infrastructure Features

### Dark Mode

- Add `ThemeProvider` using `next-themes` package
- Toggle button in nav
- CSS variables in `globals.css` with dark variants using Stitch's dark color tokens
- Persist preference in localStorage

### Notifications System

**DB:** New `notifications` table: id, user_id, type (enum: 'comment', 'follow', 'clap'), actor_id, post_id (nullable), read (boolean), created_at.

**Server-side:** Create notifications when actions occur (in existing server actions for comments, follows, claps).

**Component:** `components/notifications-dropdown.tsx` ("use client")
- Bell icon in nav with unread count badge
- Dropdown showing recent notifications
- Mark as read on click

### Newsletter Subscription

**Approach:** Simple email collection table (`newsletter_subscribers`: email, created_at, confirmed).
- `components/newsletter-form.tsx` ("use client") — email input + subscribe button
- `actions/newsletter.ts` — `subscribe(email)` server action
- Renders on homepage and tag pages per Stitch design
- No email sending infrastructure (just collects emails for now)

---

## Group G: Deployment & Production

- Vercel deployment configuration
- Environment variables setup
- SEO: meta tags, Open Graph, sitemap.xml, robots.txt
- Performance: image optimization, font loading, bundle analysis
- This group follows standard Next.js deployment practices and will be specced in detail when reached.
