'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const emailSchema = z.string().email('Please enter a valid email address')

export async function subscribeToNewsletter(email: string): Promise<{ success: true } | { error: string }> {
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email: parsed.data }, { onConflict: 'email' })

  if (error) return { error: 'Something went wrong. Please try again.' }
  return { success: true }
}
