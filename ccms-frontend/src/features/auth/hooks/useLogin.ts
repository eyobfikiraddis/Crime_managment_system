'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { login } from '@/services/domain/auth.service'
import { ApiError } from '@/services/api/errors'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useNotificationStore } from '@/shared/stores/notification.store'
import type { LoginCredentials } from '@/shared/types/auth.types'

export function useLogin() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const addToast = useNotificationStore((state) => state.addToast)
  const tAuth = useTranslations('auth')
  const tErrors = useTranslations('errors')

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (session) => {
      setSession(session.officer, session.officer.permissions ?? [], session.sessionId)
      router.push('/dashboard')
      router.refresh()
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        addToast({ message: tErrors('api.generic'), variant: 'error' })
        return
      }

      if (error.isUnauthorized() || error.isForbidden()) {
        return
      }

      if (error.isRateLimited()) {
        addToast({ message: tErrors('api.rateLimited'), variant: 'warning' })
        return
      }

      if (error.statusCode === 0) {
        addToast({ message: tAuth('login.errors.networkError'), variant: 'error' })
        return
      }

      if (error.isServerError()) {
        addToast({ message: tAuth('login.errors.serverError'), variant: 'error' })
        return
      }

      addToast({ message: error.message || tErrors('api.generic'), variant: 'error' })
    },
  })
}
