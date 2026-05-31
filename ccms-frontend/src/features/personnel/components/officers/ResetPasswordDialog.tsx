'use client'

import { useTranslations } from 'next-intl'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { useResetOfficerPassword } from '@features/personnel/hooks/useResetOfficerPassword'
import type { OfficerListItem, Officer } from '@features/personnel/types/personnel.types'

interface ResetPasswordDialogProps {
  open: boolean
  officer: OfficerListItem | Officer
  onClose: () => void
}

export function ResetPasswordDialog({ open, officer, onClose }: ResetPasswordDialogProps) {
  const t = useTranslations('personnel')
  const resetMutation = useResetOfficerPassword(officer.id)

  const handleConfirm = async () => {
    try {
      await resetMutation.mutateAsync()
      onClose()
    } catch (err) {
      // Handled by hook
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      title={t('officers.resetPassword.confirmTitle')}
      description={t('officers.resetPassword.confirmDescription', {
        officerEmail: officer.email,
      })}
      confirmLabel={t('officers.resetPassword.confirmButton')}
      cancelLabel={t('officers.resetPassword.cancelButton')}
      onConfirm={handleConfirm}
      isConfirming={resetMutation.isPending}
    />
  )
}

export default ResetPasswordDialog
