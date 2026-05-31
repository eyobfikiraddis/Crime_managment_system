import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createCrimeType } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateCrimeTypePayload } from '../types/admin.types'

export function useCreateCrimeType() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('admin')

  return useMutation({
    mutationFn: (payload: CreateCrimeTypePayload) => createCrimeType(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.crimeTypeList() })
      addToast({ message: t('crimeTypes.create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('crimeTypes.create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
