import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAllTags() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug, description')
    .order('name')

  if (error) throw error
  return data
}
