# The DevOps Ledger

A production-oriented publication site for engineering and DevOps content: long-form articles, search, engagement (claps, comments, bookmarks), author profiles, and an author dashboard with a rich-text editor.

**Live reference:** [thedevopsledger.com](https://thedevopsledger.com) (configure `NEXT_PUBLIC_APP_URL` to match your deployment).

---

## Features

- **Public site:** Home feed with featured hero, tag browsing, full-text search with sort options, individual post pages with reading time, and author profile pages.
- **Content:** Tiptap-based editor; post bodies are stored as JSON and rendered server-side. Cover images and related assets integrate with Supabase Storage (see migrations).
- **Auth:** Supabase Auth with email/password plus **Google** and **GitHub** OAuth. Session cookies are refreshed in middleware; `/dashboard/*` requires a signed-in user.
- **Social & engagement:** Claps, threaded comments, bookmarks, follows, and in-app notifications (server actions + `revalidatePath` for cache coherence).
- **Newsletter:** Subscriber capture via server actions (backed by Supabase).
- **UX:** Dark/light theming, responsive layout, security-oriented HTTP headers and CSP in `next.config.ts`.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React Server Components) |
| UI | React 19, [Tailwind CSS 4](https://tailwindcss.com/) (`src/app/globals.css`, `@theme`), [shadcn-style](https://ui.shadcn.com/) primitives under `src/components/ui/` |
| Data | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Row Level Security) via `@supabase/ssr` and `@supabase/supabase-js` — no ORM |
| Forms & validation | React Hook Form + [Zod](https://zod.dev/) |
| Rich text | [Tiptap v3](https://tiptap.dev/) + extensions (tables, tasks, code blocks, images, etc.) |
| Tests | [Vitest](https://vitest.dev/) + React Testing Library (unit/component); [Playwright](https://playwright.dev/) (E2E) |

> **Note:** This repo targets **Next.js 16**, which differs from older Next.js releases. See [`AGENTS.md`](./AGENTS.md) and in-repo Next docs under `node_modules/next/dist/docs/` when changing routing, caching, or `next/*` APIs.

---

## Prerequisites

- **Node.js** 20+ (aligned with `@types/node` in the project)
- A **Supabase** project with schema and RLS matching this app (apply migrations under `supabase/migrations/` or maintain an equivalent remote schema)
- Optional: **Vercel** (or any Node host) for production deploys

---

## Getting started

```bash
git clone <your-fork-or-repo-url>
cd the-devops-ledger
npm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL, keys, and app URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

Create **`.env.local`** (never commit secrets). Template: **`.env.local.example`**.

| Variable | Scope | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Supabase anonymous key (respects RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Elevated access for trusted server actions; must not appear in client bundles or `NEXT_PUBLIC_*` |
| `NEXT_PUBLIC_APP_URL` | Client + server | Canonical site URL (metadata, OAuth redirects, absolute links) |

OAuth providers must be enabled and redirect URLs configured in the Supabase dashboard for your local and production origins.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server (default port 3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (watch) |
| `npm run test:run` | Vitest single run (CI-style) |
| `npm run test:e2e` | Playwright E2E (builds app and serves on port **3100**; see below) |

---

## Project structure (high level)

```
src/
  app/           # App Router routes (pages, layouts, auth callback)
  actions/       # Server Actions (mutations, revalidation)
  components/    # UI and feature components
  lib/
    queries/     # Read paths (Supabase selects)
    supabase/    # Clients, generated types, profile helpers
    validations/ # Zod schemas
    tiptap/      # Editor extensions and helpers
  middleware.ts  # Supabase session + /dashboard auth gate
supabase/migrations/  # SQL migrations (Storage, profiles, features)
e2e/                  # Playwright specs and E2E notes
```

Path alias: `@/*` → `src/*` (see `tsconfig.json`).

---

## Database and Supabase

- **Migrations** live in `supabase/migrations/`. Apply them with the [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase db push`, etc.) or equivalent tooling; confirm target project before pushing to production.
- **TypeScript types** for the database are generated in `src/lib/supabase/types.ts`. Regenerate after schema changes, e.g.:

  ```bash
  supabase gen types typescript --linked > src/lib/supabase/types.ts
  ```

  (Adjust flags/path if your workflow differs.)

- **Profiles** (`profiles` table) are the source of truth for display fields such as `avatar_url` and `full_name` in the UI; do not rely only on `user.user_metadata` where settings must match the database.

---

## Testing

**Unit / component (Vitest)**

```bash
npm run test:run
# or a single file:
npx vitest run src/__tests__/path/to/file.test.ts
```

**E2E (Playwright)**

E2E runs a **production** server on port **3100** so it does not conflict with `next dev` on 3000. See [`e2e/README.md`](./e2e/README.md) for setup (e.g. `npx playwright install chromium`) and seed notes for the About page.

```bash
npm run test:e2e
```

---

## Deployment

The app is designed to run on **Vercel** (or any platform that supports Next.js 16). Typical workflow:

1. Set the same environment variables as in `.env.local.example` in the host’s dashboard (or `vercel env pull` for local sync).
2. Connect the Git repository so pushes trigger preview/production deploys.
3. Ensure Supabase Auth redirect URLs include your production domain.

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or public env vars.

---

## Security

- Middleware enforces authentication for `/dashboard/*`.
- `next.config.ts` sets security headers (CSP, HSTS, frame options, etc.); update CSP if you add new third-party origins.
- Use the **anon** key on the client; reserve the **service role** key for server-only code paths.

---

## Contributing / development notes

- Prefer existing patterns in `src/lib/queries/`, `src/actions/`, and `src/components/`.
- Avoid editing generated UI primitives under `src/components/ui/` directly; compose new behavior in feature components.
- For agent and automation context, see [`CLAUDE.md`](./CLAUDE.md) and [`.cursor/rules/`](./.cursor/rules/).

---

## License

Private project (`"private": true` in `package.json`). Add a `LICENSE` file if you intend to open-source the repository.
