import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Signed in as {user.email}</p>
      </div>
    </div>
  )
}
