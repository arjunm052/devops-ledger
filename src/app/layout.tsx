import type { Metadata } from 'next'
import { Space_Grotesk, Newsreader, Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
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

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
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
    <html lang="en" className={`${spaceGrotesk.variable} ${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable} ${plusJakartaSans.variable}`}>
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
