'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { login } from '@/services/domain/auth.service'
import { useAuthStore } from '@/shared/stores/auth.store'
import type { LoginCredentials } from '@/shared/types/auth.types'

type LoginRequest = LoginCredentials & {
  rememberMe?: boolean
  redirectTo?: string
}

export function useLogin() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: ({ rememberMe, redirectTo: _redirectTo, ...credentials }: LoginRequest) =>
      login(credentials, Boolean(rememberMe)),
    onSuccess: (session, variables) => {
      setSession(session.officer, session.officer.permissions ?? [], session.sessionId)
      const destination = variables?.redirectTo ?? '/dashboard'
      setTimeout(() => {
        router.push(destination)
        router.refresh()
      }, 150)
    },
  })
}
