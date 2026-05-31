import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { removeHeadOfficer } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'

export function useRemoveHeadOfficer(departmentId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('departments')

  return useMutation({
    mutationFn: () => removeHeadOfficer(departmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.department(departmentId) })
      void queryClient.invalidateQueries({ queryKey: departmentKeys.departmentList() })
      addToast({ message: t('removeHead.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('removeHead.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
