'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createChangePasswordSchema } from '@/lib/validations/auth'

export async function updatePassword(input: unknown): Promise<{ success: true } | { error: string }> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { error: 'Not authenticated.' }
  }

  const hasEmailIdentity =
    user.identities?.some((i) => i.provider === 'email') ?? false

  const schema = createChangePasswordSchema(hasEmailIdentity)
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  if (hasEmailIdentity) {
    const current = parsed.data.currentPassword?.trim() ?? ''
    if (!current) {
      return { error: 'Current password is required.' }
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    })
    if (signInError) {
      return { error: 'Current password is incorrect.' }
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/', 'layout')
  return { success: true }
}
