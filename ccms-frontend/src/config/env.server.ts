import 'server-only'
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const serverEnv = createEnv({
  server: {
    CCMS_API_BASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32).optional(),
    SESSION_SECRET: z.string().min(32).optional(),
    NODE_ENV: z.enum(['development', 'test', 'production']),
  },
  runtimeEnv: {
    CCMS_API_BASE_URL: process.env.CCMS_API_BASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  },
  emptyStringAsUndefined: true,
})

if (!serverEnv.NEXTAUTH_SECRET && !serverEnv.SESSION_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET or SESSION_SECRET. Provide at least one.')
}
