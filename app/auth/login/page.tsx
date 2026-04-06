import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import { OAuthButtons } from '@/components/auth/oauth-buttons'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-[#fcf9f8] text-[#323233] overflow-hidden">
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
