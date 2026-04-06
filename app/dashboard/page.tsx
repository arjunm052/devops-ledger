import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const isAuthor = profile?.role === 'author'
  const name = profile?.full_name ?? user.email

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold">
          Welcome back, {name}
        </h1>
        <p className="font-[family-name:var(--font-inter)] text-sm text-muted-foreground mt-1">
          {user.email}
        </p>
      </div>

      {isAuthor ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-card p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold">
                Ready to write?
              </h2>
              <p className="font-[family-name:var(--font-newsreader)] text-muted-foreground mt-1">
                Start a new article and share your insights with the community.
              </p>
            </div>
            <Link
              href="/dashboard/new"
              className="font-[family-name:var(--font-space-grotesk)] shrink-0 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              New Article
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card p-8">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold mb-2">
            Your account
          </h2>
          <p className="font-[family-name:var(--font-newsreader)] text-muted-foreground">
            You&apos;re signed in as a reader. Contact the admin to become an author.
          </p>
        </div>
      )}
    </div>
  )
}
