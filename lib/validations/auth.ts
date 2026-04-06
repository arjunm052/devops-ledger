import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
})

export const otpSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export function createChangePasswordSchema(requiresCurrentPassword: boolean) {
  return z
    .object({
      currentPassword: requiresCurrentPassword
        ? z.string().min(1, 'Current password is required')
        : z.string().optional(),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      confirmNewPassword: z.string().min(8, 'Password must be at least 8 characters'),
    })
    .refine((d) => d.newPassword === d.confirmNewPassword, {
      message: 'Passwords do not match',
      path: ['confirmNewPassword'],
    })
}

export type ChangePasswordInput = z.infer<ReturnType<typeof createChangePasswordSchema>>

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type OtpInput = z.infer<typeof otpSchema>
