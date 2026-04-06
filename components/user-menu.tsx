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
        <Avatar size="sm">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={userName ?? email} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <div className="px-3 py-2">
          {userName && (
            <p className="text-sm font-medium">{userName}</p>
          )}
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <DropdownMenuSeparator />
        {isAuthor && (
          <DropdownMenuItem>
            <Link href="/dashboard/new" className="w-full">
              New Article
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem>
          <Link href="/dashboard" className="w-full">
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/dashboard/settings" className="w-full">
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <form action={signOut} className="w-full">
            <button type="submit" className="w-full cursor-pointer text-left">
              Sign Out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
