import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { assignHeadOfficer } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { AssignHeadOfficerPayload } from '../types/department.types'

export function useAssignHeadOfficer(departmentId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('departments')

  return useMutation({
    mutationFn: (payload: AssignHeadOfficerPayload) =>
      assignHeadOfficer(departmentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.department(departmentId) })
      void queryClient.invalidateQueries({ queryKey: departmentKeys.departmentList() })
      addToast({ message: t('assignHead.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('assignHead.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
