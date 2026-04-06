'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { updateProfile } from '@/actions/profile'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

// ── Zod schema ─────────────────────────────────────────────────────────────
const profileSchema = z.object({
  fullName: z.string().max(100, 'Max 100 characters').optional().or(z.literal('')),
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(30, 'Max 30 characters')
    .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, hyphens, underscores only'),
  bio: z.string().max(160, 'Max 160 characters').optional().or(z.literal('')),
  website: z
    .string()
    .url('Enter a valid URL (include https://)')
    .optional()
    .or(z.literal('')),
  avatarUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

// ── Tab definitions ─────────────────────────────────────────────────────────
const TABS = ['Profile', 'Account', 'Security', 'Notifications', 'Membership'] as const
type Tab = (typeof TABS)[number]

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string | null, username: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return username.slice(0, 2).toUpperCase()
}

// ── Input style helpers ──────────────────────────────────────────────────────
const inputBase =
  'w-full bg-[#d5e3fc] rounded-lg px-4 py-3 text-[#1a1a2e] text-sm outline-none border-b-2 border-transparent focus:border-[#0045ad] transition-colors placeholder:text-[#6b7a99]'
const labelBase =
  'block text-xs font-semibold uppercase tracking-wider text-[#4a5568] mb-1.5'
const errorBase = 'text-xs text-red-500 mt-1'

// ── Props ────────────────────────────────────────────────────────────────────
interface ProfileSettingsFormProps {
  profile: Profile
  email: string
  role: string
  createdAt: string
}

// ── Component ────────────────────────────────────────────────────────────────
export function ProfileSettingsForm({ profile, email, role, createdAt }: ProfileSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Profile')
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.full_name ?? '',
      username: profile.username ?? '',
      bio: profile.bio ?? '',
      website: profile.website ?? '',
      avatarUrl: profile.avatar_url ?? '',
    },
  })

  const bioValue = watch('bio') ?? ''
  const avatarUrlValue = watch('avatarUrl') ?? ''
  const fullNameValue = watch('fullName') ?? ''
  const usernameValue = watch('username') ?? ''

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true)
    try {
      const result = await updateProfile({
        fullName: values.fullName ?? '',
        username: values.username,
        bio: values.bio ?? '',
        website: values.website ?? '',
        avatarUrl: values.avatarUrl ?? '',
      })

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Profile updated successfully.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9ff' }}>
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-[#1a1a2e] mb-1"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Settings
          </h1>
          <p
            className="text-sm text-[#6b7a99]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Manage your profile, account preferences, and integrations.
          </p>
        </div>

        {/* Tab navigation */}
        <div
          className="flex gap-0 border-b border-[#e2eaf7] mb-8 overflow-x-auto"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab
                  ? 'border-b-2 border-[#0045ad] text-[#0045ad] -mb-px'
                  : 'text-[#6b7a99] hover:text-[#1a1a2e]',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Account' ? (
          <div className="space-y-6" style={{ fontFamily: 'var(--font-inter)' }}>
            <div>
              <label className={labelBase}>Email Address</label>
              <p className="text-sm text-[#0d1c2e] mt-1">{email}</p>
              <p className="text-xs text-[#70787f] mt-1">Contact support to change your email</p>
            </div>
            <div className="pt-6 border-t border-[#bfc7d0]/20">
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
              <p className="text-sm text-[#40484f] mb-4">Deactivating your account will permanently remove all your data. This action cannot be undone.</p>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                onClick={() => alert('Please contact support to deactivate your account.')}
              >
                Deactivate Account
              </button>
            </div>
          </div>
        ) : activeTab === 'Security' ? (
          <div className="space-y-6" style={{ fontFamily: 'var(--font-inter)' }}>
            <div>
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-[#0d1c2e] mb-4">Change Password</h3>
              <p className="text-sm text-[#40484f] mb-4">Only available for email/password accounts.</p>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className={labelBase}>New Password</label>
                  <input type="password" placeholder="Enter new password" className={inputBase} disabled />
                </div>
                <div>
                  <label className={labelBase}>Confirm Password</label>
                  <input type="password" placeholder="Confirm new password" className={inputBase} disabled />
                </div>
                <button type="button" className="px-4 py-2 rounded-lg bg-muted text-sm text-[#40484f] cursor-not-allowed" disabled>
                  Update Password (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'Notifications' ? (
          <div className="space-y-6" style={{ fontFamily: 'var(--font-inter)' }}>
            <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-[#0d1c2e] mb-4">Email Notifications</h3>
            <div className="space-y-4">
              {[
                { label: 'New comments on your posts', description: 'Get notified when someone comments on your articles' },
                { label: 'New followers', description: 'Get notified when someone follows you' },
                { label: 'Weekly digest', description: 'Receive a weekly summary of your post performance' },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-[#0d1c2e]">{item.label}</p>
                    <p className="text-xs text-[#70787f] mt-0.5">{item.description}</p>
                  </div>
                  <button type="button" className="w-10 h-6 rounded-full bg-[#dae2ff] relative cursor-not-allowed" disabled>
                    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#70787f] italic">Notification preferences coming soon</p>
          </div>
        ) : activeTab === 'Membership' ? (
          <div className="space-y-6" style={{ fontFamily: 'var(--font-inter)' }}>
            <div>
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-[#0d1c2e] mb-4">Membership</h3>
              <div className="bg-white rounded-xl p-6 shadow-[0_8px_40px_rgba(13,28,46,0.06)] space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-[#40484f]">Role</span>
                  <span className="text-sm font-medium text-[#0d1c2e] capitalize">{role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#40484f]">Member since</span>
                  <span className="text-sm font-medium text-[#0d1c2e]">
                    {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* ── Profile Picture ─────────────────────────────────────────── */}
            <section className="mb-10">
              <h2
                className="text-lg font-semibold text-[#1a1a2e] mb-5"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Profile Picture
              </h2>
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {avatarUrlValue ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrlValue}
                      alt="Profile photo"
                      className="w-20 h-20 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #0045ad, #1a5dd5)' }}
                    >
                      {getInitials(fullNameValue || profile.full_name, profile.username)}
                    </div>
                  )}
                </div>

                {/* Avatar URL input + hint */}
                <div className="flex-1">
                  <label className={labelBase} htmlFor="avatarUrl">
                    Photo URL
                  </label>
                  <input
                    id="avatarUrl"
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    className={inputBase}
                    style={{ fontFamily: 'var(--font-inter)' }}
                    {...register('avatarUrl')}
                  />
                  {errors.avatarUrl && (
                    <p className={errorBase}>{errors.avatarUrl.message}</p>
                  )}
                  <p
                    className="text-xs text-[#6b7a99] mt-1.5"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Paste a public image URL (JPEG, PNG, WebP recommended).
                  </p>
                </div>
              </div>
            </section>

            {/* ── Personal Information ────────────────────────────────────── */}
            <section className="mb-10">
              <h2
                className="text-lg font-semibold text-[#1a1a2e] mb-5"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Personal Information
              </h2>

              <div className="space-y-5">
                {/* Full name */}
                <div>
                  <label className={labelBase} htmlFor="fullName">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Ada Lovelace"
                    className={inputBase}
                    style={{ fontFamily: 'var(--font-inter)' }}
                    {...register('fullName')}
                  />
                  {errors.fullName && (
                    <p className={errorBase}>{errors.fullName.message}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className={labelBase} htmlFor="username">
                    Username
                  </label>
                  <div className="flex items-stretch rounded-lg overflow-hidden bg-[#d5e3fc] border-b-2 border-transparent focus-within:border-[#0045ad] transition-colors">
                    <span
                      className="flex items-center px-3 text-sm text-[#4a5568] bg-[#c3d7f9] select-none shrink-0"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      @
                    </span>
                    <input
                      id="username"
                      type="text"
                      placeholder="your-handle"
                      className="flex-1 bg-transparent px-3 py-3 text-[#1a1a2e] text-sm outline-none placeholder:text-[#6b7a99]"
                      style={{ fontFamily: 'var(--font-inter)' }}
                      {...register('username')}
                    />
                  </div>
                  {errors.username && (
                    <p className={errorBase}>{errors.username.message}</p>
                  )}
                  <p
                    className="text-xs text-[#6b7a99] mt-1.5"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    thedevopsledger.com/@{usernameValue}
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelBase} htmlFor="bio" style={{ marginBottom: 0 }}>
                      Bio
                    </label>
                    <span
                      className={`text-xs tabular-nums ${
                        bioValue.length > 160
                          ? 'text-red-500 font-semibold'
                          : bioValue.length > 140
                          ? 'text-amber-500'
                          : 'text-[#6b7a99]'
                      }`}
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {bioValue.length}/160
                    </span>
                  </div>
                  <textarea
                    id="bio"
                    rows={4}
                    placeholder="Tell readers a bit about yourself…"
                    className={`${inputBase} resize-none`}
                    style={{ fontFamily: 'var(--font-newsreader)' }}
                    {...register('bio')}
                  />
                  {errors.bio && (
                    <p className={errorBase}>{errors.bio.message}</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label className={labelBase} htmlFor="website">
                    Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    placeholder="https://yoursite.com"
                    className={inputBase}
                    style={{ fontFamily: 'var(--font-inter)' }}
                    {...register('website')}
                  />
                  {errors.website && (
                    <p className={errorBase}>{errors.website.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* ── Connected Accounts ──────────────────────────────────────── */}
            <section className="mb-12">
              <h2
                className="text-lg font-semibold text-[#1a1a2e] mb-2"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Connected Accounts
              </h2>
              <p
                className="text-sm text-[#6b7a99] mb-5"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Link third-party accounts for faster sign-in.
              </p>

              <div className="space-y-3">
                {/* Google */}
                <div className="flex items-center justify-between bg-[#eef3fd] rounded-xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    {/* Google icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-label="Google">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <div>
                      <p
                        className="text-sm font-medium text-[#1a1a2e]"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Google
                      </p>
                      <p
                        className="text-xs text-[#6b7a99]"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Sign in with your Google account
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#0045ad] hover:text-[#1a5dd5] transition-colors"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Connect
                  </button>
                </div>

                {/* GitHub */}
                <div className="flex items-center justify-between bg-[#eef3fd] rounded-xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    {/* GitHub icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a1a2e" aria-label="GitHub">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <div>
                      <p
                        className="text-sm font-medium text-[#1a1a2e]"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        GitHub
                      </p>
                      <p
                        className="text-xs text-[#6b7a99]"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Sign in with your GitHub account
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#0045ad] hover:text-[#1a5dd5] transition-colors"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Connect
                  </button>
                </div>
              </div>
            </section>

            {/* ── Action buttons ──────────────────────────────────────────── */}
            <div className="flex items-center pt-2">
              <button
                type="submit"
                disabled={isSaving || !isDirty}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(to right, #0045ad, #1a5dd5)',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
