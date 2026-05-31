import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { deleteCrimeType } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'

export function useDeleteCrimeType(crimeTypeId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('admin')

  return useMutation({
    mutationFn: () => deleteCrimeType(crimeTypeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.crimeTypeList() })
      addToast({ message: t('crimeTypes.delete.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('crimeTypes.delete.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
