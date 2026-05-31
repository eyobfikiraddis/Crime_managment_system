import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { deleteLocation } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'

export function useDeleteLocation(locationId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('admin')

  return useMutation({
    mutationFn: () => deleteLocation(locationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.locationList() })
      addToast({ message: t('locations.delete.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('locations.delete.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
