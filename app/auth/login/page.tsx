import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import { OAuthButtons } from '@/components/auth/oauth-buttons'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-[#fcf9f8] text-[#323233] overflow-hidden">
      {/* Right decorative panel */}
      <div className="fixed top-0 right-0 w-1/3 h-screen pointer-events-none opacity-40 mix-blend-multiply overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-bl from-[#9df5bd]/20 to-transparent" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkHnBSiQIOPQz5D0p4pCzmI1lvs22KPjQButjwkWS7ANSnqLPIA-Y8jNuc4nRUmhJFwNbjmSIEkUzobxE8Wlc4zXbulJsVxtM2maDnM3aOfkfw2bH6ZHAsFMwVEN69zDmN2Ijfz0o-1ikYFTVAUqWBcMrsgkoGotartoc1RHqn1XOODJu5XiORNpMtHgqw8ZZX1RMNniJZGxmtX33m1zumSi5HRLIBiSjZRNHsNmEAt6qxst0wthIawr8A4qv-5myJBWzLGIExoGI"
          alt=""
          aria-hidden="true"
          className="object-cover h-full w-full grayscale opacity-20 translate-x-20"
        />
      </div>

      {/* Main content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center pt-20 pb-12 px-4">
        <div className="w-full max-w-md space-y-12">
          {/* Heading */}
          <div className="text-center space-y-4">
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight leading-tight"
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              Join the conversation.
            </h1>
            <p
              className="text-sm tracking-wide text-[#5f5f5f]"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Enter your details to create an account or sign in.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl shadow-black/5 space-y-8 border border-[#b2b2b1]/10">
            <OAuthButtons />

            {/* OR divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#b2b2b1]/30" />
              <span
                className="flex-shrink mx-4 text-xs text-[#7b7b7a] tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Or
              </span>
              <div className="flex-grow border-t border-[#b2b2b1]/30" />
            </div>

            <LoginForm />
          </div>

          {/* Privacy notice */}
          <p
            className="text-center text-[10px] uppercase tracking-widest text-[#7b7b7a] leading-relaxed max-w-xs mx-auto"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            By signing in, you agree to our Terms of Service and acknowledge that our Privacy Policy applies to you.
          </p>
        </div>
      </main>
    </div>
  )
}
