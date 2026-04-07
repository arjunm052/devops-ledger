'use server'

import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const emailSchema = z.string().email('Please enter a valid email address')

export async function subscribeToNewsletter(email: string): Promise<{ success: true } | { error: string }> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const rl = rateLimit(`newsletter:${ip}`, { maxRequests: 5, windowMs: 60_000 })
  if (!rl.success) return { error: 'Too many requests. Please try again later.' }

  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email: parsed.data }, { onConflict: 'email' })

  if (error) return { error: 'Something went wrong. Please try again.' }
  return { success: true }
}
