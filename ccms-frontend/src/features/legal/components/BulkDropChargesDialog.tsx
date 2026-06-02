'use client'

import { useTranslations } from 'next-intl'
import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'
import { useBulkDropCharges } from '../hooks/useBulkDropCharges'
import { isChargeTerminal } from '../utils/chargeUtils'
import type { ChargeListItem } from '../types/legal.types'

interface BulkDropChargesDialogProps {
  open: boolean
  onClose: () => void
  selectedCharges: ChargeListItem[]
  courtCaseId: string
  caseId: string
}

export function BulkDropChargesDialog({
  open,
  onClose,
  selectedCharges,
  courtCaseId,
  caseId,
}: BulkDropChargesDialogProps) {
  const t = useTranslations('legal')
  const bulkDropMutation = useBulkDropCharges(courtCaseId, caseId)

  const droppableCharges = selectedCharges.filter((c) => !isChargeTerminal(c.status))
  const terminalCount = selectedCharges.length - droppableCharges.length
  const droppableCount = droppableCharges.length

  const handleConfirm = () => {
    if (droppableCount === 0) return
    const ids = droppableCharges.map((c) => c.id)
    bulkDropMutation.mutate(ids, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  const warningText =
    terminalCount > 0
      ? t('charges.bulkDrop.terminalWarning', {
          terminalCount,
          droppableCount,
        })
      : undefined

  // Construct a detailed description listing all affected charges
  const chargeListText = droppableCharges
    .map((c) => `• ${c.crimeType.name} — ${c.suspect.firstName} ${c.suspect.lastName}`)
    .join('\n')

  const description = `${t('charges.bulkDrop.dialogDescription', { count: droppableCount })}\n\n${chargeListText}\n\n${t('charges.bulkDrop.undoneNotice')}`

  return (
    <DestructiveConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      title={t('charges.bulkDrop.dialogTitle', { count: droppableCount })}
      description={description}
      confirmLabel={t('charges.bulkDrop.confirmButton', { count: droppableCount })}
      cancelLabel={t('charges.bulkDrop.cancelButton')}
      onConfirm={handleConfirm}
      isConfirming={bulkDropMutation.isPending}
      warning={warningText}
    />
  )
}

export default BulkDropChargesDialog
