import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserMenu } from '@/components/user-menu'
import { getNotifications, getUnreadCount } from '@/actions/notifications'
import { NotificationsDropdown } from '@/components/notifications-dropdown'

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

  let isAuthor = false
  let navAvatarUrl: string | null = null
  let navUserName: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, avatar_url, full_name')
      .eq('id', user.id)
      .maybeSingle()
    isAuthor = profile?.role === 'author'
    // Use profiles row as source of truth so avatar/name match settings and public pages
    // (JWT user_metadata still holds the provider picture after the user removes it in settings).
    navAvatarUrl = profile?.avatar_url ?? null
    navUserName =
      profile?.full_name ??
      user.user_metadata?.full_name ??
      user.user_metadata?.user_name ??
      null
  }

  let notifications: Awaited<ReturnType<typeof getNotifications>> = []
  let unreadCount = 0
  if (user) {
    ;[notifications, unreadCount] = await Promise.all([getNotifications(10), getUnreadCount()])
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="font-[family-name:var(--font-newsreader)] text-xl font-bold tracking-tight text-[var(--color-heading)]"
        >
          DevOps Ledger
        </Link>

        {/* Center nav links */}
        <ul className="hidden items-center gap-8 sm:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-[family-name:var(--font-space-grotesk)] text-sm font-medium text-[var(--color-body)] transition-colors hover:text-[var(--color-link)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side: search + write + auth */}
        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="text-[var(--color-body)] transition-colors hover:text-[var(--color-link)]"
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

          {isAuthor && (
            <Link
              href="/dashboard/new"
              className="font-[family-name:var(--font-space-grotesk)] text-sm font-medium flex items-center gap-1.5 bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] text-white px-4 py-1.5 rounded-full transition-opacity hover:opacity-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Write
            </Link>
          )}

          {user && (
            <NotificationsDropdown notifications={notifications} unreadCount={unreadCount} />
          )}

          {user ? (
            <UserMenu
              email={user.email ?? ''}
              userName={navUserName}
              avatarUrl={navAvatarUrl}
              isAuthor={isAuthor}
            />
          ) : (
            <Link
              href="/auth/login"
              className="font-[family-name:var(--font-space-grotesk)] rounded-full border border-[#0045ad]/40 px-4 py-1.5 text-sm font-medium text-[var(--color-link)] transition-colors hover:bg-[#0045ad]/10"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
