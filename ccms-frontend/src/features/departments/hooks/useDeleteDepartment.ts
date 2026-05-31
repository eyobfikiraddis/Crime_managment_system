import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { deleteDepartment } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'

export function useDeleteDepartment(departmentId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('departments')
  const router = useRouter()

  return useMutation({
    mutationFn: () => deleteDepartment(departmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.departmentList() })
      queryClient.removeQueries({ queryKey: departmentKeys.department(departmentId) })
      addToast({ message: t('delete.successMessage'), variant: 'success' })
      router.push('/departments')
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('delete.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
