# Foundation + Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold The DevOps Ledger Next.js app, set up the full Supabase schema with RLS, and implement all 4 auth methods (email/password, Google OAuth, GitHub OAuth, OTP/magic link).

**Architecture:** Next.js 16 App Router with TypeScript. Supabase handles auth, PostgreSQL DB, and storage. `@supabase/ssr` provides SSR-compatible sessions via HTTP-only cookies. Next.js middleware guards `/dashboard/*` routes.

**Tech Stack:** Next.js 16.2, TypeScript 6, Supabase (supabase-js + @supabase/ssr), Tailwind CSS 4.2.2, shadcn/ui 4.1.1, Zod 4.x, Vitest + React Testing Library

---

## File Map

```
the-devops-ledger/
├── app/
│   ├── layout.tsx                    # Root layout, Supabase session provider
│   ├── auth/
│   │   ├── login/page.tsx            # Sign in / sign up page
│   │   ├── callback/route.ts         # OAuth code exchange
│   │   └── verify/page.tsx           # OTP / magic link verification
│   └── dashboard/
│       └── page.tsx                  # Protected stub (confirms auth works)
├── components/
│   └── auth/
│       ├── login-form.tsx            # Email + password form
│       ├── oauth-buttons.tsx         # Google + GitHub buttons
│       └── otp-form.tsx              # OTP / magic link form
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client (singleton)
│   │   ├── server.ts                 # Server Supabase client (cookie-based)
│   │   └── types.ts                  # Generated DB types (Database interface)
│   ├── validations/
│   │   └── auth.ts                   # Zod schemas for auth forms
│   └── utils.ts                      # cn() helper
├── actions/
│   └── auth.ts                       # Server Actions: signIn, signUp, signOut, sendOtp
├── middleware.ts                      # Guards /dashboard/*, refreshes session
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql            # All tables + triggers
│       └── 002_rls.sql               # Row Level Security policies
├── __tests__/
│   ├── actions/auth.test.ts          # Server action unit tests
│   └── components/login-form.test.tsx
├── .env.local.example                # Required env vars
├── next.config.ts
├── tailwind.config.ts
└── components.json                   # shadcn config
```

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `components.json`

- [ ] **Step 1: Bootstrap the project**

Run inside `/Users/arjunmeena/Desktop/the-devops-ledger`:

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-git
```

- [ ] **Step 2: Upgrade to Tailwind CSS v4**

`create-next-app` may install Tailwind v3. Upgrade to v4:

```bash
npm install tailwindcss@latest @tailwindcss/vite@latest
```

Replace `tailwind.config.ts` content with a `@import "tailwindcss"` in your CSS file (v4 is CSS-first — no config file needed). In `app/globals.css`, replace the `@tailwind` directives with:

```css
@import "tailwindcss";
```

- [ ] **Step 3: Install all dependencies**

```bash
npm install @supabase/supabase-js@latest @supabase/ssr@latest
npm install @tiptap/react@latest @tiptap/starter-kit@latest @tiptap/extension-code-block-lowlight@latest @tiptap/extension-image@latest @tiptap/extension-link@latest @tiptap/extension-table@latest @tiptap/extension-table-row@latest @tiptap/extension-table-header@latest @tiptap/extension-table-cell@latest @tiptap/extension-placeholder@latest @tiptap/extension-character-count@latest @tiptap/extension-typography@latest @tiptap/extension-youtube@latest
npm install lowlight@latest
npm install zod@latest
npm install remark-reading-time@latest
npm install clsx tailwind-merge
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 4: Init shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted: style=default, base color=slate, CSS variables=yes.

- [ ] **Step 5: Add required shadcn components**

```bash
npx shadcn@latest add button input label textarea form toast badge tabs separator avatar dropdown-menu
```

- [ ] **Step 6: Update `next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 7: Create `.env.local.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Copy to `.env.local` and fill in your Supabase project values.

- [ ] **Step 8: Add `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 9: Create `vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 10: Add test script to `package.json`**

Add to scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 11: Verify dev server starts**

```bash
npm run dev
```

Expected: server running at http://localhost:3000 with default Next.js page.

- [ ] **Step 12: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 16 project with Supabase, Tailwind, shadcn, Vitest"
```

---

## Task 2: Utility helpers

**Files:**
- Create: `lib/utils.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { cn, slugify } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('deduplicates tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('foo  --  bar')).toBe('foo-bar')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- __tests__/lib/utils.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/lib/utils.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts __tests__/lib/utils.test.ts
git commit -m "feat: add cn and slugify utilities"
```

---

## Task 3: Supabase database schema

**Files:**
- Create: `supabase/migrations/001_schema.sql`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → New project. Note the project URL and anon key. Add them to `.env.local`.

- [ ] **Step 2: Install Supabase CLI**

```bash
npm install -D supabase
npx supabase login
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
```

- [ ] **Step 3: Create `supabase/migrations/001_schema.sql`**

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text,
  bio text,
  avatar_url text,
  website text,
  role text not null default 'reader' check (role in ('author', 'reader')),
  created_at timestamptz not null default now()
);

-- posts table
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  content jsonb not null default '{}',
  excerpt text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  reading_time_mins int not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
  ) stored
);

create index posts_fts_idx on public.posts using gin(fts);
create index posts_slug_idx on public.posts(slug);
create index posts_status_idx on public.posts(status);
create index posts_published_at_idx on public.posts(published_at desc);

-- tags table
create table public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  slug text unique not null,
  description text
);

-- post_tags join table
create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- comments table
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- claps table
create table public.claps (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  count int not null default 1 check (count between 1 and 50),
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

-- bookmarks table (v2, schema ready)
create table public.bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- auto-update updated_at on posts
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_updated_at
  before update on public.posts
  for each row execute procedure public.handle_updated_at();

-- auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 4: Create `supabase/migrations/002_rls.sql`**

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.comments enable row level security;
alter table public.claps enable row level security;
alter table public.bookmarks enable row level security;

-- profiles: anyone can read, only owner can update
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- posts: anyone can read published, only author can write
create policy "Published posts are viewable by everyone"
  on public.posts for select
  using (status = 'published' or auth.uid() = author_id);

create policy "Authors can insert own posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own posts"
  on public.posts for update
  using (auth.uid() = author_id);

create policy "Authors can delete own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- tags: public read, author write
create policy "Tags are viewable by everyone"
  on public.tags for select using (true);

create policy "Authors can manage tags"
  on public.tags for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'author'
  ));

-- post_tags: public read
create policy "Post tags are viewable by everyone"
  on public.post_tags for select using (true);

create policy "Authors can manage post tags"
  on public.post_tags for all
  using (exists (
    select 1 from public.posts
    where id = post_id and author_id = auth.uid()
  ));

-- comments: public read, auth write own
create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

create policy "Authenticated users can insert comments"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "Users can update own comments"
  on public.comments for update
  using (auth.uid() = author_id);

create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

-- claps: public read, auth write own
create policy "Claps are viewable by everyone"
  on public.claps for select using (true);

create policy "Authenticated users can clap"
  on public.claps for insert
  with check (auth.uid() = user_id);

create policy "Users can update own claps"
  on public.claps for update
  using (auth.uid() = user_id);

-- bookmarks: only owner can read/write
create policy "Users can manage own bookmarks"
  on public.bookmarks for all
  using (auth.uid() = user_id);
```

- [ ] **Step 5: Apply migrations**

```bash
npx supabase db push
```

Expected: migrations applied successfully.

- [ ] **Step 6: Generate TypeScript types**

```bash
npx supabase gen types typescript --linked > lib/supabase/types.ts
```

- [ ] **Step 7: Verify schema in Supabase dashboard**

Open your Supabase project → Table Editor. Verify these tables exist: `profiles`, `posts`, `tags`, `post_tags`, `comments`, `claps`, `bookmarks`.

- [ ] **Step 8: Create Supabase Storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `post-images`
- Public: ✅ yes

Then add storage policy: allow authenticated users to upload.

```sql
-- Run in Supabase SQL editor
create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

create policy "Images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'post-images');
```

- [ ] **Step 9: Commit**

```bash
git add supabase/ lib/supabase/types.ts
git commit -m "feat: add database schema, RLS policies, and generated types"
```

---

## Task 4: Supabase client helpers

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/supabase/client.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

// Mock the env vars
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

describe('createBrowserClient', () => {
  it('exports a createBrowserClient function', async () => {
    const { createBrowserClient } = await import('@/lib/supabase/client')
    expect(typeof createBrowserClient).toBe('function')
  })

  it('returns a supabase client with auth property', async () => {
    const { createBrowserClient } = await import('@/lib/supabase/client')
    const client = createBrowserClient()
    expect(client).toHaveProperty('auth')
    expect(client).toHaveProperty('from')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- __tests__/lib/supabase/client.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/supabase/client.ts`**

```typescript
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createBrowserClient() {
  return createSupabaseBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Implement `lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies can't be set here, middleware handles it
          }
        },
      },
    }
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/lib/supabase/client.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts __tests__/lib/supabase/
git commit -m "feat: add Supabase browser and server client helpers"
```

---

## Task 5: Auth middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/middleware.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

// Middleware is hard to unit test directly — test the config instead
describe('middleware config', () => {
  it('exports a config with matcher that includes dashboard routes', async () => {
    const mod = await import('@/middleware')
    expect(mod.config).toBeDefined()
    expect(mod.config.matcher).toBeDefined()
    const matchers = mod.config.matcher as string[]
    expect(matchers.some(m => m.includes('dashboard'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- __tests__/middleware.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  if (isDashboard && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/middleware.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts __tests__/middleware.test.ts
git commit -m "feat: add auth middleware guarding /dashboard/* routes"
```

---

## Task 6: Auth Zod validation schemas

**Files:**
- Create: `lib/validations/auth.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/validations/auth.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { loginSchema, signupSchema, otpSchema } from '@/lib/validations/auth'

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 chars', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'short' })
    expect(result.success).toBe(false)
  })
})

describe('signupSchema', () => {
  it('accepts valid signup data', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
    })
    expect(result.success).toBe(true)
  })

  it('rejects username with spaces', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      username: 'test user',
    })
    expect(result.success).toBe(false)
  })
})

describe('otpSchema', () => {
  it('accepts valid email', () => {
    const result = otpSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = otpSchema.safeParse({ email: 'not-email' })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- __tests__/lib/validations/auth.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/validations/auth.ts`**

```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
})

export const otpSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type OtpInput = z.infer<typeof otpSchema>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/lib/validations/auth.test.ts
```

Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/validations/auth.ts __tests__/lib/validations/auth.test.ts
git commit -m "feat: add Zod validation schemas for auth forms"
```

---

## Task 7: Auth server actions

**Files:**
- Create: `actions/auth.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/actions/auth.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSignInWithPassword = vi.fn()
const mockSignInWithOAuth = vi.fn()
const mockSignInWithOtp = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
      signInWithOtp: mockSignInWithOtp,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('signInWithEmail', () => {
  it('calls supabase signInWithPassword with correct args', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    const { signInWithEmail } = await import('@/actions/auth')
    await signInWithEmail({ email: 'test@example.com', password: 'password123' })
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('returns error message on failure', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    const { signInWithEmail } = await import('@/actions/auth')
    const result = await signInWithEmail({ email: 'test@example.com', password: 'wrong' })
    expect(result?.error).toBe('Invalid credentials')
  })
})

describe('sendOtp', () => {
  it('calls supabase signInWithOtp with email', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null })
    const { sendOtp } = await import('@/actions/auth')
    await sendOtp({ email: 'test@example.com' })
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: { emailRedirectTo: expect.stringContaining('/auth/callback') },
    })
  })
})

describe('signOut', () => {
  it('calls supabase signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    const { signOut } = await import('@/actions/auth')
    await signOut()
    expect(mockSignOut).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- __tests__/actions/auth.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `actions/auth.ts`**

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema, otpSchema } from '@/lib/validations/auth'
import type { LoginInput, SignupInput, OtpInput } from '@/lib/validations/auth'

export async function signInWithEmail(input: LoginInput) {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signUpWithEmail(input: SignupInput) {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { user_name: parsed.data.username },
    },
  })

  if (error) return { error: error.message }
  return { success: 'Check your email to confirm your account.' }
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
}

export async function sendOtp(input: OtpInput) {
  const parsed = otpSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  return { success: 'Check your email for the login link.' }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/actions/auth.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add actions/auth.ts __tests__/actions/auth.test.ts
git commit -m "feat: add auth server actions (signIn, signUp, OAuth, OTP, signOut)"
```

---

## Task 8: Auth UI components

**Files:**
- Create: `components/auth/login-form.tsx`
- Create: `components/auth/oauth-buttons.tsx`
- Create: `components/auth/otp-form.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/auth/login-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'

vi.mock('@/actions/auth', () => ({
  signInWithEmail: vi.fn().mockResolvedValue(null),
}))

describe('LoginForm', () => {
  it('renders email and password inputs', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<LoginForm />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation error for invalid email', async () => {
    render(<LoginForm />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- __tests__/components/auth/login-form.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/auth/login-form.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { signInWithEmail } from '@/actions/auth'

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    setServerError(null)
    const result = await signInWithEmail(data)
    if (result?.error) setServerError(result.error)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Install react-hook-form + hookform resolver**

```bash
npm install react-hook-form @hookform/resolvers
```

- [ ] **Step 5: Implement `components/auth/oauth-buttons.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signInWithOAuth } from '@/actions/auth'

export function OAuthButtons() {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null)

  async function handleOAuth(provider: 'google' | 'github') {
    setLoading(provider)
    await signInWithOAuth(provider)
    setLoading(null)
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuth('google')}
        disabled={loading !== null}
      >
        {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuth('github')}
        disabled={loading !== null}
      >
        {loading === 'github' ? 'Redirecting…' : 'Continue with GitHub'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 6: Implement `components/auth/otp-form.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { otpSchema, type OtpInput } from '@/lib/validations/auth'
import { sendOtp } from '@/actions/auth'

export function OtpForm() {
  const [serverMessage, setServerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpInput>({ resolver: zodResolver(otpSchema) })

  async function onSubmit(data: OtpInput) {
    setLoading(true)
    setServerMessage(null)
    const result = await sendOtp(data)
    if (result?.error) setServerMessage({ type: 'error', text: result.error })
    if (result?.success) setServerMessage({ type: 'success', text: result.success })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="otp-email">Email for magic link</Label>
        <Input id="otp-email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      {serverMessage && (
        <p className={`text-sm ${serverMessage.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
          {serverMessage.text}
        </p>
      )}
      <Button type="submit" variant="outline" className="w-full" disabled={loading}>
        {loading ? 'Sending…' : 'Send OTP / Magic Link'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/components/auth/login-form.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add components/auth/ __tests__/components/auth/
git commit -m "feat: add auth UI components (LoginForm, OAuthButtons, OtpForm)"
```

---

## Task 9: Auth pages and OAuth callback

**Files:**
- Create: `app/auth/login/page.tsx`
- Create: `app/auth/callback/route.ts`
- Create: `app/auth/verify/page.tsx`
- Create: `app/dashboard/page.tsx` (stub)
- Create: `app/layout.tsx`

- [ ] **Step 1: Implement `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Space_Grotesk, Newsreader, Inter } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: { default: 'The DevOps Ledger', template: '%s | The DevOps Ledger' },
  description: 'Engineering insights, architecture deep-dives, and DevOps patterns.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${newsreader.variable} ${inter.variable}`}>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Implement `app/auth/login/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { OtpForm } from '@/components/auth/otp-form'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
            Join the conversation.
          </h1>
          <p className="text-muted-foreground text-sm">Sign in to The DevOps Ledger</p>
        </div>

        <OAuthButtons />

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <LoginForm />

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">
            or sign in with OTP
          </span>
        </div>

        <OtpForm />

        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <a href="/auth/signup" className="text-primary underline underline-offset-4">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement `app/auth/callback/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
```

- [ ] **Step 4: Implement `app/auth/verify/page.tsx`**

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Verify Email' }

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-3 max-w-sm">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
          Check your email
        </h1>
        <p className="text-muted-foreground">
          We sent you a magic link. Click it to sign in — it expires in 1 hour.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implement `app/dashboard/page.tsx` (auth smoke test stub)**

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Signed in as {user.email}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Enable Google + GitHub OAuth in Supabase**

In Supabase dashboard → Authentication → Providers:
- Enable Google: add Client ID + Secret from Google Cloud Console
- Enable GitHub: add Client ID + Secret from GitHub OAuth Apps
- Set redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

- [ ] **Step 7: Run the dev server and test all auth flows manually**

```bash
npm run dev
```

Test checklist:
- [ ] Visit http://localhost:3000/auth/login — page renders
- [ ] Sign up with email → confirmation email received
- [ ] Sign in with email + password → redirected to /dashboard
- [ ] Click Google → OAuth redirect works → lands on /dashboard
- [ ] Click GitHub → OAuth redirect works → lands on /dashboard
- [ ] Send OTP → email received → magic link works
- [ ] Visit /dashboard without auth → redirected to /auth/login

- [ ] **Step 8: Run all tests**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add app/ components/auth/
git commit -m "feat: add auth pages, OAuth callback route, and dashboard stub"
```

---

## Task 10: Deploy to Vercel

**Files:** No code changes — deployment config only.

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/the-devops-ledger.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Deploy on Vercel**

Go to https://vercel.com → New Project → import your GitHub repo.

Add environment variables in Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

- [ ] **Step 3: Update Supabase redirect URLs**

In Supabase dashboard → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: add `https://your-app.vercel.app/auth/callback`

- [ ] **Step 4: Test production deploy**

Visit your Vercel URL and run the auth flow checklist from Task 9, Step 7 against production.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: verify production deploy and update redirect URLs"
git push
```

---

## Verification

Run the full test suite before considering this plan complete:

```bash
npm run test:run
```

Expected output:
```
✓ __tests__/lib/utils.test.ts (3)
✓ __tests__/lib/supabase/client.test.ts (2)
✓ __tests__/middleware.test.ts (1)
✓ __tests__/lib/validations/auth.test.ts (7)
✓ __tests__/actions/auth.test.ts (4)
✓ __tests__/components/auth/login-form.test.tsx (3)

Test Files  6 passed
Tests      20 passed
```

**Manual smoke test:** Sign in via all 4 methods on production. Confirm `/dashboard` is protected. Confirm DB has your profile row in Supabase.

---

*Next: Plan 2 — Public Site (homepage, article reader, tag page, search, about)*
