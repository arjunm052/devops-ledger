'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLink {
  href: string
  label: string
}

interface NavLinksProps {
  links: NavLink[]
}

export function NavLinks({ links }: NavLinksProps) {
  const pathname = usePathname()

  return (
    <ul className="hidden items-center sm:flex">
      {links.map((link) => {
        const isActive = pathname === link.href
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              data-active={isActive}
              className={[
                'font-[family-name:var(--font-space-grotesk)] text-sm font-medium px-[14px] py-[6px] transition-colors',
                'border-b-2',
                isActive
                  ? 'text-[oklch(0.93_0_0)] border-[#1a5dd5]'
                  : 'text-[oklch(0.60_0_0)] border-transparent hover:text-[oklch(0.85_0_0)]',
              ].join(' ')}
            >
              {link.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
