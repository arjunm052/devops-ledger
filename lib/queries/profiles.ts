import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAuthorProfile() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, bio, website, role, created_at')
    .eq('role', 'author')
    .single()

  if (error) throw error
  return data
}
