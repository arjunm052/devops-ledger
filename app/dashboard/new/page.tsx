import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'New Article' }

export default async function NewArticlePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'author') redirect('/dashboard')

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold mb-4">
        New Article
      </h1>
      <p className="font-[family-name:var(--font-newsreader)] text-muted-foreground">
        The article editor is coming soon.
      </p>
    </div>
  )
}
