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

export async function getProfileByUsername(username: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, bio, website, role, created_at')
    .eq('username', username)
    .single()

  if (error) throw error
  return data
}
