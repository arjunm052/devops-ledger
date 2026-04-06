import type { Metadata } from 'next'
import { Space_Grotesk, Newsreader, Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

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
  description: 'Engineering insights, architecture deep-dives, and DevOps patterns from the trenches.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://thedevopsledger.com'),
  openGraph: {
    type: 'website',
    siteName: 'The DevOps Ledger',
    title: 'The DevOps Ledger',
    description: 'Engineering insights, architecture deep-dives, and DevOps patterns from the trenches.',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${newsreader.variable} ${inter.variable}`}>
      <body className="flex min-h-svh flex-col bg-background text-foreground antialiased">
        <ThemeProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
