'use client'

import { useTranslations } from 'next-intl'
import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'
import { useDeactivateOfficer } from '@features/personnel/hooks/useDeactivateOfficer'
import type { OfficerListItem, Officer } from '@features/personnel/types/personnel.types'

interface DeactivateOfficerDialogProps {
  open: boolean
  officer: OfficerListItem | Officer
  onClose: () => void
}

export function DeactivateOfficerDialog({ open, officer, onClose }: DeactivateOfficerDialogProps) {
  const t = useTranslations('personnel')
  const deactivateMutation = useDeactivateOfficer(officer.id)

  const handleConfirm = async () => {
    try {
      await deactivateMutation.mutateAsync()
      onClose()
    } catch (err) {
      // Handled by hook
    }
  }

  return (
    <DestructiveConfirmDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      title={t('officers.deactivate.confirmTitle')}
      description={t('officers.deactivate.confirmDescription', {
        badgeNumber: officer.badgeNumber,
        officerName: `${officer.firstName} ${officer.lastName}`,
      })}
      confirmLabel={t('officers.deactivate.confirmButton')}
      cancelLabel={t('officers.deactivate.cancelButton')}
      onConfirm={handleConfirm}
      isConfirming={deactivateMutation.isPending}
    />
  )
}

export default DeactivateOfficerDialog
