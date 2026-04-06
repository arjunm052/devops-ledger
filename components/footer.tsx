import Link from 'next/link'

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/tags', label: 'Tags' },
  { href: '/about', label: 'About' },
]

export function Footer() {
  return (
    <footer className="mt-auto py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-sm text-muted-foreground">
        <Link
          href="/"
          className="font-[family-name:var(--font-newsreader)] text-lg font-semibold text-foreground"
        >
          The Ledger
        </Link>

        <nav className="flex items-center gap-1 font-[family-name:var(--font-space-grotesk)]">
          {footerLinks.map((link, i) => (
            <span key={link.href} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">&middot;</span>}
              <Link
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>

        <p>&copy; {new Date().getFullYear()} The DevOps Ledger</p>
      </div>
    </footer>
  )
}
