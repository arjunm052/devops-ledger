import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Verify Email' }

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-3 max-w-sm">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
          Check your email
        </h1>
        <p className="text-muted-foreground">
          We sent you a magic link. Click it to sign in — it expires in 1 hour.
        </p>
      </div>
    </div>
  )
}
