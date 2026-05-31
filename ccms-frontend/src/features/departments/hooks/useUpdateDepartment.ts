import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateDepartment } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { UpdateDepartmentPayload } from '../types/department.types'

export function useUpdateDepartment(departmentId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('departments')

  return useMutation({
    mutationFn: (payload: UpdateDepartmentPayload) =>
      updateDepartment(departmentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.department(departmentId) })
      void queryClient.invalidateQueries({ queryKey: departmentKeys.departmentList() })
      addToast({ message: t('update.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('update.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
