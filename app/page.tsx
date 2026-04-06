import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold">
          The DevOps Ledger
        </h1>
        <p className="text-muted-foreground">Coming soon.</p>
        <Link href="/auth/login" className="text-primary underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </div>
  )
}
