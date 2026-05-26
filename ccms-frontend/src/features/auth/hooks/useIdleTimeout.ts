'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'

import { useLogout } from '@/features/auth/hooks/useLogout'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useUiStore } from '@/shared/stores/ui.store'

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000
const WARNING_OFFSET_MS = 2 * 60 * 1000

const getConfiguredTimeout = () => {
  const raw = process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS
  if (!raw) return DEFAULT_TIMEOUT_MS
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS
}

export function useIdleTimeout(timeoutMs = getConfiguredTimeout()) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const updateLastActivity = useAuthStore((state) => state.updateLastActivity)
  const openModal = useUiStore((state) => state.openModal)
  const addToast = useNotificationStore((state) => state.addToast)
  const { mutate: logout } = useLogout()
  const tAuth = useTranslations('auth')

  const warningThreshold = useMemo(
    () => Math.max(timeoutMs - WARNING_OFFSET_MS, 0),
    [timeoutMs],
  )
  const warningShown = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      warningShown.current = false
      return
    }

    const updateActivity = () => {
      updateLastActivity()
      warningShown.current = false
    }

    const events: Array<keyof DocumentEventMap> = [
      'mousemove',
      'keydown',
      'mousedown',
      'scroll',
      'touchstart',
    ]

    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    const intervalId = window.setInterval(() => {
      const lastActivity = useAuthStore.getState().lastActivity ?? Date.now()
      const elapsed = Date.now() - lastActivity

      if (elapsed >= timeoutMs) {
        warningShown.current = false
        logout()
        addToast({ message: tAuth('session.autoLogoutMessage'), variant: 'warning' })
        return
      }

      if (elapsed >= warningThreshold && !warningShown.current) {
        openModal('idle-warning')
        warningShown.current = true
      }
    }, 1000)

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity)
      })
      window.clearInterval(intervalId)
    }
  }, [
    addToast,
    isAuthenticated,
    logout,
    openModal,
    tAuth,
    timeoutMs,
    updateLastActivity,
    warningThreshold,
  ])
}
