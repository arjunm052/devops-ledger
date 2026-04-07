import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserMenu } from '@/components/user-menu'
import { NavLinks } from '@/components/nav-links'
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

        {/* Right side: nav links + actions */}
        <div className="flex items-center gap-1">
          {/* Nav links */}
          <NavLinks links={navLinks} />

          {/* Divider */}
          <div className="mx-3 hidden h-[18px] w-px bg-[oklch(0.27_0.02_250)] sm:block" />

          {/* Search */}
          <Link
            href="/search"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[oklch(0.60_0_0)] transition-colors hover:bg-[oklch(0.24_0.02_250)] hover:text-[oklch(0.93_0_0)]"
            aria-label="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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

          {/* Notifications */}
          {user && (
            <NotificationsDropdown notifications={notifications} unreadCount={unreadCount} />
          )}

          {/* Write */}
          {isAuthor && (
            <Link
              href="/dashboard/new"
              className="font-[family-name:var(--font-space-grotesk)] ml-1 flex items-center gap-1.5 rounded-full border border-[oklch(0.35_0.05_250)] px-[14px] py-[6px] text-[12px] font-semibold text-[oklch(0.80_0.05_250)] transition-colors hover:border-[#1a5dd5] hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
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

          {/* Avatar / Sign In */}
          {user ? (
            <div className="ml-2">
              <UserMenu
                email={user.email ?? ''}
                userName={navUserName}
                avatarUrl={navAvatarUrl}
                isAuthor={isAuthor}
              />
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="font-[family-name:var(--font-space-grotesk)] ml-2 rounded-full border border-[#0045ad]/40 px-4 py-1.5 text-sm font-medium text-[var(--color-link)] transition-colors hover:bg-[#0045ad]/10"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
