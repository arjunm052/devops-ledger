'use client'

import { useState, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { updateProfile } from '@/actions/profile'
import { uploadAvatar } from '@/actions/avatar'
import { updatePassword } from '@/actions/password'
import { createChangePasswordSchema, type ChangePasswordInput } from '@/lib/validations/auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

// ── Zod schema (username removed — immutable) ──────────────────────────────
const profileSchema = z.object({
  fullName: z.string().max(100, 'Max 100 characters').optional().or(z.literal('')),
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
function getInitials(name: string | null, username: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return (username ?? '').slice(0, 2).toUpperCase()
}

// ── Input style helpers ──────────────────────────────────────────────────────
const inputBase =
  'w-full bg-[var(--color-input-bg)] rounded-lg px-4 py-3 text-[var(--color-heading)] text-sm outline-none border-b-2 border-transparent focus:border-[#0045ad] transition-colors placeholder:text-[var(--color-muted-text)]'
const labelBase =
  'block text-xs font-semibold uppercase tracking-wider text-[var(--color-label)] mb-1.5'
const errorBase = 'text-xs text-red-500 mt-1'

// ── Props ────────────────────────────────────────────────────────────────────
interface ProfileSettingsFormProps {
  profile: Profile
  email: string
  role: string
  createdAt: string
  linkedProviders: string[]
}

// ── Component ────────────────────────────────────────────────────────────────
export function ProfileSettingsForm({ profile, email, role, createdAt, linkedProviders }: ProfileSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Profile')
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [avatarMode, setAvatarMode] = useState<'upload' | 'link'>('upload')
  const [isUploading, setIsUploading] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.full_name ?? '',
      bio: profile.bio ?? '',
      website: profile.website ?? '',
      avatarUrl: profile.avatar_url ?? '',
    },
  })

  const bioValue = watch('bio') ?? ''
  const avatarUrlValue = watch('avatarUrl') ?? ''
  const fullNameValue = watch('fullName') ?? ''

  const requiresCurrentPassword = linkedProviders.includes('email')
  const changePasswordSchema = useMemo(
    () => createChangePasswordSchema(requiresCurrentPassword),
    [requiresCurrentPassword]
  )

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = passwordForm

  const onPasswordSubmit = async (values: ChangePasswordInput) => {
    setIsSavingPassword(true)
    try {
      const result = await updatePassword(values)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Password updated successfully.')
        resetPasswordForm()
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true)
    try {
      const result = await updateProfile({
        fullName: values.fullName ?? '',
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadAvatar(formData)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        setValue('avatarUrl', result.url, { shouldDirty: true })
        toast.success('Photo uploaded!')
        setAvatarDialogOpen(false)
      }
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleLinkSubmit() {
    if (!linkInput.trim()) return
    try {
      new URL(linkInput)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }
    setValue('avatarUrl', linkInput.trim(), { shouldDirty: true })
    setLinkInput('')
    setAvatarDialogOpen(false)
    toast.success('Photo URL updated!')
  }

  const isGoogleLinked = linkedProviders.includes('google')
  const isGithubLinked = linkedProviders.includes('github')

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)]">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-[var(--color-heading)] mb-1"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Settings
          </h1>
          <p
            className="text-sm text-[var(--color-muted-text)]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Manage your profile, account preferences, and integrations.
          </p>
        </div>

        {/* Tab navigation */}
        <div
          className="flex gap-0 border-b border-[var(--color-border-subtle)] mb-8 overflow-x-auto"
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
                  : 'text-[var(--color-muted-text)] hover:text-[var(--color-heading)]',
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
              <p className="text-sm text-[var(--color-heading)] mt-1">{email}</p>
              <p className="text-xs text-[var(--color-muted-text)] mt-1">Contact support to change your email</p>
            </div>
            <div className="pt-6 border-t border-[var(--color-border-subtle)]/20">
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
              <p className="text-sm text-[var(--color-body)] mb-4">Deactivating your account will permanently remove all your data. This action cannot be undone.</p>
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
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-[var(--color-heading)] mb-2">
                {requiresCurrentPassword ? 'Change password' : 'Set a password'}
              </h3>
              <p className="text-sm text-[var(--color-body)] mb-4">
                {requiresCurrentPassword
                  ? 'Use a strong password you do not reuse on other sites.'
                  : 'Add a password so you can sign in with your email and password in addition to Google or GitHub.'}
              </p>
              {requiresCurrentPassword && (
                <p className="text-xs text-[var(--color-muted-text)] mb-4">
                  Only use magic links? If you have never set a password, use <strong>Forgot password</strong> on the
                  login page once, then you can change it here.
                </p>
              )}
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate className="space-y-4 max-w-md">
                {requiresCurrentPassword && (
                  <div>
                    <label className={labelBase} htmlFor="settings-current-password">
                      Current password
                    </label>
                    <input
                      id="settings-current-password"
                      type="password"
                      autoComplete="current-password"
                      className={inputBase}
                      {...registerPassword('currentPassword')}
                    />
                    {passwordErrors.currentPassword && (
                      <p className={errorBase}>{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>
                )}
                <div>
                  <label className={labelBase} htmlFor="settings-new-password">
                    New password
                  </label>
                  <input
                    id="settings-new-password"
                    type="password"
                    autoComplete="new-password"
                    className={inputBase}
                    {...registerPassword('newPassword')}
                  />
                  {passwordErrors.newPassword && <p className={errorBase}>{passwordErrors.newPassword.message}</p>}
                </div>
                <div>
                  <label className={labelBase} htmlFor="settings-confirm-password">
                    Confirm new password
                  </label>
                  <input
                    id="settings-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    className={inputBase}
                    {...registerPassword('confirmNewPassword')}
                  />
                  {passwordErrors.confirmNewPassword && (
                    <p className={errorBase}>{passwordErrors.confirmNewPassword.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-4 py-2 rounded-lg bg-[#0045ad] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSavingPassword ? 'Saving…' : requiresCurrentPassword ? 'Update password' : 'Set password'}
                </button>
              </form>
            </div>
          </div>
        ) : activeTab === 'Notifications' ? (
          <div className="space-y-6" style={{ fontFamily: 'var(--font-inter)' }}>
            <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-[var(--color-heading)] mb-4">Email Notifications</h3>
            <div className="space-y-4">
              {[
                { label: 'New comments on your posts', description: 'Get notified when someone comments on your articles' },
                { label: 'New followers', description: 'Get notified when someone follows you' },
                { label: 'Weekly digest', description: 'Receive a weekly summary of your post performance' },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-heading)]">{item.label}</p>
                    <p className="text-xs text-[var(--color-muted-text)] mt-0.5">{item.description}</p>
                  </div>
                  <button type="button" className="w-10 h-6 rounded-full bg-[var(--color-surface-raised)] relative cursor-not-allowed" disabled>
                    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-[var(--color-surface)] shadow transition-transform" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--color-muted-text)] italic">Notification preferences coming soon</p>
          </div>
        ) : activeTab === 'Membership' ? (
          <div className="space-y-6" style={{ fontFamily: 'var(--font-inter)' }}>
            <div>
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-[var(--color-heading)] mb-4">Membership</h3>
              <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.2)] space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-body)]">Role</span>
                  <span className="text-sm font-medium text-[var(--color-heading)] capitalize">{role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-body)]">Member since</span>
                  <span className="text-sm font-medium text-[var(--color-heading)]">
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
                className="text-lg font-semibold text-[var(--color-heading)] mb-5"
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

                {/* Change photo button + dialog */}
                <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
                  <DialogTrigger
                    className="text-sm font-medium text-[#0045ad] hover:text-[var(--color-link)] transition-colors"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Change photo
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        Update Profile Photo
                      </DialogTitle>
                    </DialogHeader>

                    {/* Tab toggle */}
                    <div className="flex gap-1 bg-muted p-1 rounded-lg mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
                      <button
                        type="button"
                        onClick={() => setAvatarMode('upload')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                          avatarMode === 'upload'
                            ? 'bg-[var(--color-surface)] text-[#0045ad] shadow-sm'
                            : 'text-[var(--color-muted-text)] hover:text-[var(--color-heading)]'
                        }`}
                      >
                        Upload Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatarMode('link')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                          avatarMode === 'link'
                            ? 'bg-[var(--color-surface)] text-[#0045ad] shadow-sm'
                            : 'text-[var(--color-muted-text)] hover:text-[var(--color-heading)]'
                        }`}
                      >
                        Paste Link
                      </button>
                    </div>

                    {avatarMode === 'upload' ? (
                      <div className="space-y-4">
                        <div
                          className="border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl p-8 text-center cursor-pointer hover:border-[#1a5dd5] transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <p className="text-sm text-[var(--color-muted-text)]" style={{ fontFamily: 'var(--font-inter)' }}>
                            {isUploading ? 'Uploading...' : 'Click to select an image'}
                          </p>
                          <p className="text-xs text-[var(--color-muted-text)] mt-1">JPEG, PNG, WebP. Max 2MB.</p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4" style={{ fontFamily: 'var(--font-inter)' }}>
                        <div>
                          <label className={labelBase}>Image URL</label>
                          <input
                            type="url"
                            placeholder="https://example.com/photo.jpg"
                            className={inputBase}
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleLinkSubmit}
                          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ background: 'linear-gradient(to right, #0045ad, #1a5dd5)' }}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                {/* Remove button */}
                {avatarUrlValue && (
                  <button
                    type="button"
                    onClick={() => setValue('avatarUrl', '', { shouldDirty: true })}
                    className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </section>

            {/* ── Personal Information ────────────────────────────────────── */}
            <section className="mb-10">
              <h2
                className="text-lg font-semibold text-[var(--color-heading)] mb-5"
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

                {/* Username (read-only) */}
                <div>
                  <label className={labelBase} htmlFor="username">
                    Username
                  </label>
                  <div className="flex items-stretch rounded-lg overflow-hidden bg-[var(--color-input-bg)]/60 border-b-2 border-transparent">
                    <span
                      className="flex items-center px-3 text-sm text-[var(--color-label)] bg-[rgba(26,93,213,0.15)] select-none shrink-0"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      @
                    </span>
                    <input
                      id="username"
                      type="text"
                      value={profile.username ?? ''}
                      className="flex-1 bg-transparent px-3 py-3 text-[var(--color-heading)] text-sm outline-none cursor-not-allowed opacity-70"
                      style={{ fontFamily: 'var(--font-inter)' }}
                      disabled
                      readOnly
                    />
                  </div>
                  <p
                    className="text-xs text-[var(--color-muted-text)] mt-1.5"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Username cannot be changed after creation.
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
                          : 'text-[var(--color-muted-text)]'
                      }`}
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {bioValue.length}/160
                    </span>
                  </div>
                  <textarea
                    id="bio"
                    rows={4}
                    placeholder="Tell readers a bit about yourself..."
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
                className="text-lg font-semibold text-[var(--color-heading)] mb-2"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Connected Accounts
              </h2>
              <p
                className="text-sm text-[var(--color-muted-text)] mb-5"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Third-party accounts linked to your profile.
              </p>

              <div className="space-y-3">
                {/* Google */}
                <div className="flex items-center justify-between bg-[var(--color-surface-raised)] rounded-xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-label="Google">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-heading)]" style={{ fontFamily: 'var(--font-inter)' }}>
                        Google
                      </p>
                      <p className="text-xs text-[var(--color-muted-text)]" style={{ fontFamily: 'var(--font-inter)' }}>
                        {isGoogleLinked ? 'Connected via Google sign-in' : 'Sign in with your Google account'}
                      </p>
                    </div>
                  </div>
                  {isGoogleLinked ? (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full" style={{ fontFamily: 'var(--font-inter)' }}>
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[var(--color-muted-text)]" style={{ fontFamily: 'var(--font-inter)' }}>
                      Not linked
                    </span>
                  )}
                </div>

                {/* GitHub */}
                <div className="flex items-center justify-between bg-[var(--color-surface-raised)] rounded-xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-heading)" aria-label="GitHub">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-heading)]" style={{ fontFamily: 'var(--font-inter)' }}>
                        GitHub
                      </p>
                      <p className="text-xs text-[var(--color-muted-text)]" style={{ fontFamily: 'var(--font-inter)' }}>
                        {isGithubLinked ? 'Connected via GitHub sign-in' : 'Sign in with your GitHub account'}
                      </p>
                    </div>
                  </div>
                  {isGithubLinked ? (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full" style={{ fontFamily: 'var(--font-inter)' }}>
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[var(--color-muted-text)]" style={{ fontFamily: 'var(--font-inter)' }}>
                      Not linked
                    </span>
                  )}
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
                    Saving...
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
