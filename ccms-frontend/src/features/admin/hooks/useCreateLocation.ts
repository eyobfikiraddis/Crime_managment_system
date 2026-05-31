import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createLocation } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateLocationPayload } from '../types/admin.types'

export function useCreateLocation() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('admin')

  return useMutation({
    mutationFn: (payload: CreateLocationPayload) => createLocation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.locationList() })
      addToast({ message: t('locations.create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('locations.create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
