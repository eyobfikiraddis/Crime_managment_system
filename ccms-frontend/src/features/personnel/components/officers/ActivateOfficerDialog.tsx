'use client'

import { useTranslations } from 'next-intl'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { useActivateOfficer } from '@features/personnel/hooks/useActivateOfficer'
import type { OfficerListItem, Officer } from '@features/personnel/types/personnel.types'

interface ActivateOfficerDialogProps {
  open: boolean
  officer: OfficerListItem | Officer
  onClose: () => void
}

export function ActivateOfficerDialog({ open, officer, onClose }: ActivateOfficerDialogProps) {
  const t = useTranslations('personnel')
  const activateMutation = useActivateOfficer(officer.id)

  const handleConfirm = async () => {
    try {
      await activateMutation.mutateAsync()
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
      title={t('officers.activate.confirmTitle')}
      description={t('officers.activate.confirmDescription', {
        badgeNumber: officer.badgeNumber,
        officerName: `${officer.firstName} ${officer.lastName}`,
      })}
      confirmLabel={t('officers.activate.confirmButton')}
      cancelLabel={t('officers.activate.cancelButton')}
      onConfirm={handleConfirm}
      isConfirming={activateMutation.isPending}
    />
  )
}

export default ActivateOfficerDialog
