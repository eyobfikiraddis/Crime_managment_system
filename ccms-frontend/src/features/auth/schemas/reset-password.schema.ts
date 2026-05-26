import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'minLength')
  .regex(/[A-Z]/, 'uppercase')
  .regex(/[0-9]/, 'number')
  .regex(/[!@#$%^&*()_+\-=[\]{}|;':\",.<>/?]/, 'special')

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'required'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordMismatch',
  })
