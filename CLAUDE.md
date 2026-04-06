# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run
npx vitest run __tests__/path/to/file.test.ts  # Run a single test file
```

## Environment

Requires `.env.local` with: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.

## Architecture

**Stack:** Next.js 16 (App Router, React Server Components), TypeScript (strict), Supabase (PostgreSQL + Auth + RLS), Tailwind CSS 4, shadcn/ui, Tiptap v3 rich text editor.

**Data layer:** No ORM — uses Supabase JS client directly. Two client factories:
- `lib/supabase/server.ts` — server-side, reads cookies for auth session (use in RSC/Server Actions)
- `lib/supabase/client.ts` — browser-side singleton (use in client components)

**Database types** are auto-generated in `lib/supabase/types.ts`. Query helpers live in `lib/queries/` (posts, tags, profiles).

**Server Actions** in `actions/` handle mutations (auth, claps, comments) and call `revalidatePath()` for cache invalidation.

**Auth:** Supabase Auth with email/password, Google OAuth, GitHub OAuth. Session managed via HTTP-only cookies + middleware (`middleware.ts` guards `/dashboard/*` routes). New users get `role='reader'`; authors are promoted manually in Supabase.

**Content:** Blog posts store Tiptap JSON in `posts.content`, rendered by `components/tiptap-renderer.tsx`. Full-text search uses a `tsvector` column (`fts`) on the posts table.

**Client components** (`"use client"`) are used only for interactive elements: auth forms, clap button, comment form, search input, dropdowns.

## Key Patterns

- Path alias: `@/*` maps to project root
- Form validation: React Hook Form + Zod schemas in `lib/validations/`
- UI components: shadcn/ui in `components/ui/` — do not edit these directly
- Tailwind CSS 4 uses CSS-first config in `app/globals.css` with `@theme inline` and OKLch colors
- Tests use Vitest + React Testing Library + jsdom (config in `vitest.config.ts`)
- Deployed on Vercel
