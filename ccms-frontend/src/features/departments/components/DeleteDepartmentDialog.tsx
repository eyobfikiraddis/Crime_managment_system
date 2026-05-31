'use client'

import { useTranslations } from 'next-intl'
import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'
import { useDeleteDepartment } from '../hooks/useDeleteDepartment'
import type { Department } from '../types/department.types'

interface DeleteDepartmentDialogProps {
  open: boolean
  department: Department
  onClose: () => void
}

export function DeleteDepartmentDialog({ open, department, onClose }: DeleteDepartmentDialogProps) {
  const t = useTranslations('departments')
  const deleteMutation = useDeleteDepartment(department.id)

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync()
      onClose()
    } catch (err) {
      // API error handled by toast in hook
    }
  }

  const warningText =
    department.officerCount > 0
      ? t('delete.warningHasOfficers', { officerCount: department.officerCount })
      : undefined

  return (
    <DestructiveConfirmDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
      title={t('delete.confirmTitle')}
      description={t('delete.confirmDescription', {
        departmentName: department.name,
      })}
      warning={warningText}
      confirmLabel={t('delete.confirmButton')}
      cancelLabel={t('delete.cancelButton')}
      onConfirm={handleConfirm}
      isConfirming={deleteMutation.isPending}
    />
  )
}
