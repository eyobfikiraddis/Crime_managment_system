import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    CCMS_API_BASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32).optional(),
    SESSION_SECRET: z.string().min(32).optional(),
    NODE_ENV: z.enum(['development', 'test', 'production']),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
    NEXT_PUBLIC_APP_VERSION: z.string().min(1),
    NEXT_PUBLIC_ENV: z.string().min(1),
  },
  runtimeEnv: {
    CCMS_API_BASE_URL: process.env.CCMS_API_BASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
  },
  emptyStringAsUndefined: true,
})

if (!env.NEXTAUTH_SECRET && !env.SESSION_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET or SESSION_SECRET. Provide at least one.')
}
