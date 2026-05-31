'use client'

import { useTranslations } from 'next-intl'
import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'
import { useDeleteCrimeType } from '../../hooks/useDeleteCrimeType'
import type { CrimeType } from '../../types/admin.types'

interface DeleteCrimeTypeDialogProps {
  open: boolean
  crimeType: CrimeType
  onClose: () => void
}

export function DeleteCrimeTypeDialog({ open, crimeType, onClose }: DeleteCrimeTypeDialogProps) {
  const t = useTranslations('admin')
  const deleteMutation = useDeleteCrimeType(crimeType.id)

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync()
      onClose()
    } catch (err) {
      // API error handled by hook toast
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
      title={t('crimeTypes.delete.confirmTitle')}
      description={t('crimeTypes.delete.confirmDescription', {
        crimeTypeName: crimeType.name,
        code: crimeType.code,
      })}
      confirmLabel={t('crimeTypes.delete.confirmButton')}
      cancelLabel={t('crimeTypes.delete.cancelButton')}
      onConfirm={handleConfirm}
      isConfirming={deleteMutation.isPending}
    />
  )
}
