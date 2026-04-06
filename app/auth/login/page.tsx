import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import { OAuthButtons } from '@/components/auth/oauth-buttons'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border/50 bg-white/80 backdrop-blur-sm p-8 shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-bold tracking-tight">
              The Ledger
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to join the conversation
            </p>
          </div>

          <OAuthButtons />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/80 px-3 text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>

          <LoginForm />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          No account?{' '}
          <a href="/auth/login" className="text-primary font-medium hover:underline underline-offset-4">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
