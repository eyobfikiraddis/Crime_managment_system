'use client'

import type { ReactNode } from 'react'

import { useSession } from '@/features/auth/hooks/useSession'
import { useIdleTimeout } from '@/features/auth/hooks/useIdleTimeout'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  useSession()
  useIdleTimeout()

  return <>{children}</>
}
