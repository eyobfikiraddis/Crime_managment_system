'use client'

import { useTranslations } from 'next-intl'
import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'
import { useDemotePersonRole } from '../../hooks/useDemotePersonRole'
import type { PersonRole } from '../../types/personnel.types'

interface DemotePersonRoleDialogProps {
  open: boolean
  onClose: () => void
  personId: string
  personName: string
  role: PersonRole
  activeCaseCount: number
}

export function DemotePersonRoleDialog({
  open,
  onClose,
  personId,
  personName,
  role,
  activeCaseCount,
}: DemotePersonRoleDialogProps) {
  const t = useTranslations('personnel')
  const demoteMutation = useDemotePersonRole(personId)

  const roleName = t(`persons.roles.${role}`, { defaultValue: role })

  const handleConfirm = () => {
    demoteMutation.mutate(role, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  const warningText = activeCaseCount > 0 
    ? t('persons.demoteRole.activeCasesWarning', { count: activeCaseCount, roleName })
    : undefined

  return (
    <DestructiveConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      title={t('persons.demoteRole.dialogTitle', { roleName })}
      description={t('persons.demoteRole.dialogDescription', { personName, roleName })}
      confirmLabel={t('persons.demoteRole.confirmButton', { roleName })}
      cancelLabel={t('persons.demoteRole.cancelButton')}
      onConfirm={handleConfirm}
      isConfirming={demoteMutation.isPending}
      warning={warningText}
    />
  )
}
export default DemotePersonRoleDialog
