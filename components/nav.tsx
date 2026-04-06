import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserMenu } from '@/components/user-menu'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/tags', label: 'Tags' },
  { href: '/about', label: 'About' },
]

export async function Nav() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="font-[family-name:var(--font-newsreader)] text-xl font-semibold tracking-tight"
        >
          The Ledger
        </Link>

        {/* Center nav links */}
        <ul className="hidden items-center gap-8 sm:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-[family-name:var(--font-space-grotesk)] text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side: search + auth */}
        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>

          {user ? (
            <UserMenu
              email={user.email ?? ''}
              userName={user.user_metadata?.user_name ?? null}
              avatarUrl={user.user_metadata?.avatar_url ?? null}
            />
          ) : (
            <Link
              href="/auth/login"
              className="font-[family-name:var(--font-space-grotesk)] rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
