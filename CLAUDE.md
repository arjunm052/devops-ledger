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



## Persistent execution instructions for Claude sessions.

This file ensures that every new Claude session can continue work on the project without repeating completed tasks.

---

## PROJECT EXECUTION PROTOCOL

Claude must always follow this workflow before doing any work.

Step 1 — Read project context files

Always read these files in order:

1. PROJECT_PLAN.md
2. PROJECT_STATE.md
3. SESSION_SUMMARY.md (if it exists)

From these files determine:

• the full project plan
• which tasks are completed
• which task is currently in progress
• which tasks are pending

Never assume the project state from memory. Always rely on these files.

---

## PROJECT FILE STRUCTURE

The project maintains persistent state in the following files:

/ai
PROJECT_PLAN.md
PROJECT_STATE.md
SESSION_SUMMARY.md
DECISIONS.md
TASK_LOG.md

Definitions:

PROJECT_PLAN.md
Contains the full project roadmap.

PROJECT_STATE.md
Tracks which steps are completed, in progress, or pending.

SESSION_SUMMARY.md
Summary of the most recent session.

DECISIONS.md
Architectural decisions and reasoning.

TASK_LOG.md
Detailed history of work done.

---

## TASK STATUS DEFINITIONS

Use the following status markers:

[COMPLETED]
Task fully implemented and verified.

[IN_PROGRESS]
Work has started but not finished.

[PENDING]
Not yet started.

[BLOCKED]
Cannot proceed due to missing dependency.

---

## EXECUTION RULES

Claude must follow these rules:

1. Never redo completed tasks.
2. Continue work from the first task marked IN_PROGRESS.
3. If none are IN_PROGRESS, start the first PENDING task.
4. Update PROJECT_STATE.md when tasks change status.
5. Log important actions in TASK_LOG.md.
6. Document important architectural choices in DECISIONS.md.
7. Generate SESSION_SUMMARY.md at the end of each session.

---

## SESSION START PROCEDURE

At the start of every session:

1. Read PROJECT_PLAN.md
2. Read PROJECT_STATE.md
3. Read SESSION_SUMMARY.md if present
4. Determine the next task to execute
5. Confirm understanding of current project state
6. Begin executing the next task

Claude should output a short summary like:

Project understanding
Completed tasks: X
Current task: Y
Next task: Z

Then begin execution.

---

## SESSION END PROCEDURE

At the end of the session Claude must:

1. Update PROJECT_STATE.md
2. Append entries to TASK_LOG.md
3. Update DECISIONS.md if architecture changed
4. Create or update SESSION_SUMMARY.md

SESSION_SUMMARY.md should contain:

Session date

Completed tasks
Tasks in progress
Files modified
Important decisions
Next tasks

---

## STATE UPDATE FORMAT

Example PROJECT_STATE.md format:

# Project Execution State

[COMPLETED] Initialize repository
[COMPLETED] Setup project structure
[COMPLETED] Configure database

[IN_PROGRESS] Implement authentication system

[PENDING] Blog editor UI
[PENDING] API for blog posts
[PENDING] Deployment pipeline

---

## IMPORTANT RULES

Claude must treat project files as the single source of truth.

Never rely on conversation memory.

Always check project state files before continuing work.

If the project state is inconsistent or missing information,
Claude must ask the user for clarification before proceeding.

---

## GOAL

The purpose of this system is to allow multiple Claude sessions
to collaborate on the same project while maintaining accurate
execution state and preventing duplicate work.
