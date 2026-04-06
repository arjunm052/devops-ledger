import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureProfileRow } from '@/lib/supabase/ensure-profile'
import { redirect } from 'next/navigation'
import { getAllTags } from '@/lib/queries/tags'
import PostEditor from '@/components/post-editor'

export const metadata: Metadata = { title: 'New Article – The DevOps Ledger' }

export default async function NewArticlePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  await ensureProfileRow(supabase, user)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'author') redirect('/dashboard')

  const allTags = await getAllTags()

  return <PostEditor allTags={allTags} />
}
