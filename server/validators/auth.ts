import { z } from '../utils/validation'

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid').transform((s) => s.toLowerCase().trim()),
  password: z.string().min(1, 'Kata sandi wajib diisi').max(200),
  remember: z.boolean().optional().default(true),
})
export type LoginInput = z.infer<typeof loginSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Minimal 8 karakter').max(200),
})
