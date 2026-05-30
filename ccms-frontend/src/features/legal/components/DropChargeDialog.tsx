'use client'

import { useTranslations } from 'next-intl'

import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'

import { useDropCharge } from '../hooks/useDropCharge'
import type { ChargeListItem } from '../types/legal.types'

interface DropChargeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  charge: ChargeListItem | null
  courtCaseId: string
  caseId: string
}

export function DropChargeDialog({
  open,
  onOpenChange,
  charge,
  courtCaseId,
  caseId,
}: DropChargeDialogProps) {
  const t = useTranslations('legal')

  if (!charge) return null

  const dropChargeMutation = useDropCharge(charge.id, courtCaseId, caseId)

  return (
    <DestructiveConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('charges.drop.confirmTitle')}
      description={t('charges.drop.confirmDescription', {
        suspectName: `${charge.suspect.firstName} ${charge.suspect.lastName}`,
        crimeType: charge.crimeType.name,
      })}
      confirmLabel={t('charges.drop.confirmButton')}
      cancelLabel={t('charges.drop.cancelButton')}
      onConfirm={async () => {
        await dropChargeMutation.mutateAsync()
        onOpenChange(false)
      }}
      isConfirming={dropChargeMutation.isPending}
    />
  )
}
