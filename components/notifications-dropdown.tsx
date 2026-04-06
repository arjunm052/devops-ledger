'use client'

import { useState, useTransition } from 'react'
import { markNotificationRead, markAllRead } from '@/actions/notifications'

interface Notification {
  id: string
  type: string
  read: boolean
  created_at: string
  post_id: string | null
  actor: { full_name: string | null; username: string; avatar_url: string | null }
}

interface NotificationsDropdownProps {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationsDropdown({ notifications, unreadCount }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function getMessage(n: Notification) {
    const name = n.actor.full_name ?? n.actor.username
    switch (n.type) {
      case 'comment': return `${name} commented on your post`
      case 'follow': return `${name} started following you`
      case 'clap': return `${name} clapped for your post`
      default: return `${name} interacted with you`
    }
  }

  function handleClick(n: Notification) {
    if (!n.read) {
      startTransition(() => markNotificationRead(n.id))
    }
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-[#40484f] hover:text-[#0045ad] transition-colors"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1a2332] rounded-xl shadow-[0_8px_40px_rgba(13,28,46,0.12)] z-50 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-[#bfc7d0]/20">
              <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#0d1c2e] dark:text-[#eaf1ff]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() => startTransition(() => markAllRead())}
                  disabled={isPending}
                  className="text-xs text-[#0045ad] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-[#70787f]">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-start gap-3 ${
                      !n.read ? 'bg-[#eff4ff] dark:bg-[#1a2a40]' : ''
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-[#dae2ff] inline-flex items-center justify-center text-xs font-medium text-[#0045ad] shrink-0 mt-0.5">
                      {(n.actor.full_name ?? n.actor.username).charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-inter)] text-sm text-[#0d1c2e] dark:text-[#eaf1ff]">
                        {getMessage(n)}
                      </p>
                      <span className="text-xs text-[#70787f]">
                        {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
