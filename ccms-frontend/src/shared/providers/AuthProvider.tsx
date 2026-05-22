'use client'

import type { ReactNode } from 'react'

import { useSession } from '@/features/auth/hooks/useSession'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoading } = useSession()

  if (isLoading) {
    return <div aria-busy="true">{children}</div>
  }

  return <>{children}</>
}
