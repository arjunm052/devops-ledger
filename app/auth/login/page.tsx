import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { OtpForm } from '@/components/auth/otp-form'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
            Join the conversation.
          </h1>
          <p className="text-muted-foreground text-sm">Sign in to The DevOps Ledger</p>
        </div>

        <OAuthButtons />

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <LoginForm />

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">
            or sign in with OTP
          </span>
        </div>

        <OtpForm />

        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <a href="/auth/login" className="text-primary underline underline-offset-4">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
