'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useLogout } from '@/features/auth/hooks/useLogout'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useUiStore } from '@/shared/stores/ui.store'

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000

const getConfiguredTimeout = () => {
  const raw = process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS
  if (!raw) return DEFAULT_TIMEOUT_MS
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS
}

const getRemainingSeconds = (timeoutMs: number) => {
  const lastActivity = useAuthStore.getState().lastActivity ?? Date.now()
  const elapsed = Date.now() - lastActivity
  const remainingMs = Math.max(timeoutMs - elapsed, 0)
  return Math.ceil(remainingMs / 1000)
}

export function IdleWarningModal() {
  const tAuth = useTranslations('auth')
  const activeModal = useUiStore((state) => state.activeModal)
  const closeModal = useUiStore((state) => state.closeModal)
  const updateLastActivity = useAuthStore((state) => state.updateLastActivity)
  const { mutate: logout, isPending } = useLogout()

  const isOpen = activeModal?.id === 'idle-warning'
  const timeoutMs = useMemo(() => getConfiguredTimeout(), [])
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(timeoutMs),
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setRemainingSeconds(getRemainingSeconds(timeoutMs))
    const intervalId = window.setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(timeoutMs))
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isOpen, timeoutMs])

  const minutes = Math.max(1, Math.ceil(remainingSeconds / 60))

  const handleStaySignedIn = () => {
    updateLastActivity()
    closeModal()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      updateLastActivity()
      closeModal()
    }
  }

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={tAuth('session.idleWarningTitle')}
      description={tAuth('session.idleWarningDescription', { minutes })}
      confirmLabel={tAuth('session.idleLogoutButton')}
      cancelLabel={tAuth('session.idleStayButton')}
      onConfirm={() => logout()}
      isConfirming={isPending}
    />
  )
}
