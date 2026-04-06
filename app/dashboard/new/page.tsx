import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllTags } from '@/lib/queries/tags'
import PostEditor from '@/components/post-editor'

export const metadata: Metadata = { title: 'New Article – The DevOps Ledger' }

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

  const allTags = await getAllTags()

  return <PostEditor allTags={allTags} />
}
