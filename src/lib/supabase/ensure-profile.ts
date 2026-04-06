import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Ensures a `profiles` row exists for the signed-in user.
 * Mirrors `handle_new_user` trigger logic so OAuth users get username NULL until choose-username.
 */
export async function ensureProfileRow(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<void> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) return

  const md = user.user_metadata ?? {}
  const avatarUrl =
    (typeof md.avatar_url === 'string' ? md.avatar_url : null) ??
    (typeof md.picture === 'string' ? md.picture : null)
  const fullName =
    (typeof md.full_name === 'string' ? md.full_name : null) ??
    (typeof md.name === 'string' ? md.name : null)

  const provider = user.app_metadata?.provider
  const userNameMeta = typeof md.user_name === 'string' ? md.user_name : null
  const emailLocal = user.email?.split('@')[0] ?? null

  let username: string | null = null
  if (
    userNameMeta &&
    (provider === 'email' || provider === undefined || provider === null)
  ) {
    username = userNameMeta
  } else if (provider === 'email' || provider === undefined || provider === null) {
    username = emailLocal
  }

  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    username,
    full_name: fullName,
    avatar_url: avatarUrl,
  })

  if (error?.code === '23505') return
  if (error) {
    console.error('[ensureProfileRow]', error.message)
  }
}
