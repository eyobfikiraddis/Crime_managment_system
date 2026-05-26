'use client'

import { useTranslations } from 'next-intl'

import { useLogout } from '@/features/auth/hooks/useLogout'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { useUiStore } from '@/shared/stores/ui.store'

export function LogoutConfirmModal() {
  const tAuth = useTranslations('auth')
  const activeModal = useUiStore((state) => state.activeModal)
  const closeModal = useUiStore((state) => state.closeModal)
  const { mutate: logout, isPending } = useLogout()

  const isOpen = activeModal?.id === 'logout-confirm'

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeModal()
    }
  }

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={tAuth('logout.confirmTitle')}
      description={tAuth('logout.confirmDescription')}
      confirmLabel={tAuth('logout.confirmButton')}
      cancelLabel={tAuth('logout.cancelButton')}
      onConfirm={() => logout()}
      isConfirming={isPending}
    />
  )
}
