import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createDepartment } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateDepartmentPayload } from '../types/department.types'

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('departments')

  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => createDepartment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.departmentList() })
      addToast({ message: t('create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
