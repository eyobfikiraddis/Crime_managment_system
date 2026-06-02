'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { logout } from '@/services/domain/auth.service'
import { authKeys } from '@/services/query/keys/authKeys'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useNotificationStore } from '@/shared/stores/notification.store'

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const clearSession = useAuthStore((state) => state.clearSession)
  const addToast = useNotificationStore((state) => state.addToast)
  const tAuth = useTranslations('auth')

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearSession()
      queryClient.clear()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ccms-query-cache')
      }
      addToast({ message: tAuth('logout.successMessage'), variant: 'success' })
      router.push('/login')
      router.refresh()
    },
    onError: () => {
      clearSession()
      queryClient.clear()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ccms-query-cache')
      }
      router.push('/login')
      router.refresh()
    },
  })
}
