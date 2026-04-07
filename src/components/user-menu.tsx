'use client'

import { signOut } from '@/actions/auth'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface UserMenuProps {
  email: string
  userName: string | null
  avatarUrl: string | null
  isAuthor?: boolean
}

export function UserMenu({ email, userName, avatarUrl, isAuthor }: UserMenuProps) {
  const initials = (userName ?? email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer outline-none">
        <Avatar
          className="h-[30px] w-[30px] rounded-full shadow-[0_0_0_2px_oklch(0.28_0.03_250)]"
        >
          {avatarUrl && <AvatarImage src={avatarUrl} alt={userName ?? email} />}
          <AvatarFallback
            className="rounded-full bg-gradient-to-br from-[#0045ad] to-[#4a9eff] text-[11px] font-bold text-white"
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 overflow-hidden rounded-[14px] border-0 bg-[oklch(0.20_0.02_250)] p-0 shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_1px_oklch(0.28_0.02_250)]"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[oklch(0.27_0.02_250)] bg-gradient-to-br from-[oklch(0.22_0.04_255)] to-[oklch(0.20_0.02_250)] px-4 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0045ad] to-[#4a9eff] text-base font-bold text-white shadow-[0_2px_8px_rgba(0,69,173,0.4)]">
            {initials}
          </div>
          <div className="min-w-0">
            {userName && (
              <p className="truncate text-sm font-semibold text-[oklch(0.93_0_0)]">{userName}</p>
            )}
            <p className="truncate text-[11.5px] text-[oklch(0.55_0_0)]">{email}</p>
            {isAuthor && (
              <span className="mt-1 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#4a9eff] bg-[rgba(0,69,173,0.18)] border border-[rgba(74,158,255,0.25)]">
                ✦ Author
              </span>
            )}
          </div>
        </div>

        {/* Author actions */}
        {isAuthor && (
          <>
            <div className="p-1.5">
              <DropdownMenuItem className="rounded-lg px-2.5 py-2 text-[oklch(0.75_0_0)] hover:bg-[oklch(0.26_0.02_250)] hover:text-[oklch(0.93_0_0)] focus:bg-[oklch(0.26_0.02_250)] focus:text-[oklch(0.93_0_0)] cursor-pointer p-0">
                <Link href="/dashboard/new" className="flex w-full items-center gap-2.5 px-2.5 py-2">
                  <svg className="opacity-70 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  New Article
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg px-2.5 py-2 text-[oklch(0.75_0_0)] hover:bg-[oklch(0.26_0.02_250)] hover:text-[oklch(0.93_0_0)] focus:bg-[oklch(0.26_0.02_250)] focus:text-[oklch(0.93_0_0)] cursor-pointer p-0">
                <Link href="/dashboard" className="flex w-full items-center gap-2.5 px-2.5 py-2">
                  <svg className="opacity-70 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
                  </svg>
                  Dashboard
                </Link>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="my-0 bg-[oklch(0.26_0.02_250)]" />
          </>
        )}

        {/* Settings */}
        <div className="p-1.5">
          <DropdownMenuItem className="rounded-lg text-[oklch(0.75_0_0)] hover:bg-[oklch(0.26_0.02_250)] hover:text-[oklch(0.93_0_0)] focus:bg-[oklch(0.26_0.02_250)] focus:text-[oklch(0.93_0_0)] cursor-pointer p-0">
            <Link href="/dashboard/settings" className="flex w-full items-center gap-2.5 px-2.5 py-2">
              <svg className="opacity-70 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Settings
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-0 bg-[oklch(0.26_0.02_250)]" />

        {/* Sign Out */}
        <div className="p-1.5">
          <DropdownMenuItem className="rounded-lg px-2.5 py-2 text-[oklch(0.65_0.15_20)] hover:bg-[oklch(0.23_0.05_20)] hover:text-[oklch(0.85_0.15_20)] focus:bg-[oklch(0.23_0.05_20)] focus:text-[oklch(0.85_0.15_20)] cursor-pointer">
            <form action={signOut} className="w-full">
              <button type="submit" className="flex w-full items-center gap-2.5 text-left text-inherit">
                <svg className="opacity-70 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
                </svg>
                Sign Out
              </button>
            </form>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
