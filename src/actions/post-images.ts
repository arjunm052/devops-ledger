'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

const MAX_BYTES = 5 * 1024 * 1024

export async function uploadPostImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'author') return { error: 'Only authors can upload images' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  if (!file.type.startsWith('image/')) return { error: 'File must be an image' }
  if (file.size > MAX_BYTES) return { error: 'Image must be under 5MB' }

  const ext = file.name.split('.').pop()?.toLowerCase()
  const safeExt =
    ext && /^[a-z0-9]+$/i.test(ext) && ext.length <= 8 ? ext : 'jpg'
  const filePath = `${user.id}/${crypto.randomUUID()}.${safeExt}`

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(filePath, file, { upsert: false })

  if (uploadError) return { error: uploadError.message }

  const {
    data: { publicUrl },
  } = supabase.storage.from('post-images').getPublicUrl(filePath)

  return { url: publicUrl }
}
