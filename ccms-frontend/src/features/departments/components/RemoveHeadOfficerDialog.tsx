'use client'

import { useTranslations } from 'next-intl'
import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'
import { useRemoveHeadOfficer } from '../hooks/useRemoveHeadOfficer'
import type { Department } from '../types/department.types'

interface RemoveHeadOfficerDialogProps {
  open: boolean
  department: Department
  onClose: () => void
}

export function RemoveHeadOfficerDialog({
  open,
  department,
  onClose,
}: RemoveHeadOfficerDialogProps) {
  const t = useTranslations('departments')
  const removeMutation = useRemoveHeadOfficer(department.id)

  const handleConfirm = async () => {
    try {
      await removeMutation.mutateAsync()
      onClose()
    } catch (err) {
      // Handled by toast in hook
    }
  }

  return (
    <DestructiveConfirmDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
      title={t('removeHead.confirmTitle')}
      description={t('removeHead.confirmDescription', {
        officerName: department.headOfficer
          ? `${department.headOfficer.firstName} ${department.headOfficer.lastName}`
          : '',
        badgeNumber: department.headOfficer?.badgeNumber ?? '',
        departmentName: department.name,
      })}
      confirmLabel={t('removeHead.confirmButton')}
      cancelLabel={t('removeHead.cancelButton')}
      onConfirm={handleConfirm}
      isConfirming={removeMutation.isPending}
    />
  )
}
