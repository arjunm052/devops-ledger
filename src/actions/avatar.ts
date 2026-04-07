'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadAvatar(formData: FormData): Promise<{ url: string } | { error: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  if (!file.type.startsWith('image/')) return { error: 'File must be an image' }
  if (file.size > 2 * 1024 * 1024) return { error: 'File must be under 2MB' }

  const rawExt = file.name.split('.').pop()?.toLowerCase()
  const ext = rawExt && /^[a-z0-9]+$/.test(rawExt) && rawExt.length <= 8 ? rawExt : 'jpg'
  const filePath = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Update profile with new avatar URL
  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  // Sync avatar to Auth user metadata so it's updated everywhere the session is used
  await supabase.auth.updateUser({
    data: { avatar_url: publicUrl }
  })

  revalidatePath('/dashboard/settings')
  revalidatePath('/', 'layout')
  return { url: publicUrl }
}
