import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createOfficer } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateOfficerPayload } from '../types/personnel.types'

export function useCreateOfficer() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: (payload: CreateOfficerPayload) => createOfficer(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.officerList() })
      addToast({ message: t('officers.create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('officers.create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
