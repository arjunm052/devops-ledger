import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ProfileSettingsForm } from '@/components/profile-settings-form'

export const metadata: Metadata = { title: 'Profile Settings' }

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Extract linked OAuth providers from user identities
  const linkedProviders = (user.identities ?? []).map((i) => i.provider)

  return (
    <div className="bg-[var(--color-page-bg)] min-h-screen">
      <ProfileSettingsForm
        profile={profile}
        email={user.email ?? ''}
        role={profile.role ?? 'reader'}
        createdAt={profile.created_at}
        linkedProviders={linkedProviders}
      />
    </div>
  )
}
