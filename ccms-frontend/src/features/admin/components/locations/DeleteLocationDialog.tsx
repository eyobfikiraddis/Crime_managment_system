'use client'

import { useTranslations } from 'next-intl'
import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'
import { useDeleteLocation } from '../../hooks/useDeleteLocation'
import type { Location } from '../../types/admin.types'

interface DeleteLocationDialogProps {
  open: boolean
  location: Location
  onClose: () => void
}

export function DeleteLocationDialog({ open, location, onClose }: DeleteLocationDialogProps) {
  const t = useTranslations('admin')
  const deleteMutation = useDeleteLocation(location.id)

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
      title={t('locations.delete.confirmTitle')}
      description={t('locations.delete.confirmDescription', {
        locationName: location.name,
      })}
      confirmLabel={t('locations.delete.confirmButton')}
      cancelLabel={t('locations.delete.cancelButton')}
      onConfirm={handleConfirm}
      isConfirming={deleteMutation.isPending}
    />
  )
}
