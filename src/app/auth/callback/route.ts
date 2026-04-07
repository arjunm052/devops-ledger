import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureProfileRow } from '@/lib/supabase/ensure-profile'

/** Ensure the redirect target is a safe, same-origin relative path. */
function safeRedirectPath(raw: string | null): string {
  const fallback = '/dashboard'
  if (!raw) return fallback
  // Block protocol-relative URLs, backslash tricks, and non-path characters
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return fallback
  }
  try {
    // Parse against a dummy base — if the host changes, the path escapes our origin
    const url = new URL(raw, 'http://n')
    if (url.host !== 'n') return fallback
  } catch {
    return fallback
  }
  return raw
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await ensureProfileRow(supabase, user)

        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile?.username) {
          return NextResponse.redirect(`${origin}/auth/choose-username`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
