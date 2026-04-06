'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { otpSchema, type OtpInput } from '@/lib/validations/auth'
import { sendOtp } from '@/actions/auth'

export function OtpForm() {
  const [serverMessage, setServerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpInput>({ resolver: zodResolver(otpSchema) })

  async function onSubmit(data: OtpInput) {
    setLoading(true)
    setServerMessage(null)
    const result = await sendOtp(data)
    if (result?.error) setServerMessage({ type: 'error', text: result.error })
    if (result?.success) setServerMessage({ type: 'success', text: result.success })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="otp-email">Email for magic link</Label>
        <Input id="otp-email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      {serverMessage && (
        <p className={`text-sm ${serverMessage.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
          {serverMessage.text}
        </p>
      )}
      <Button type="submit" variant="outline" className="w-full" disabled={loading}>
        {loading ? 'Sending\u2026' : 'Send OTP / Magic Link'}
      </Button>
    </form>
  )
}
