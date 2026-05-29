import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createArrest } from '@services/domain/arrests.service'
import { arrestKeys } from '@services/query/keys/arrestKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateArrestPayload } from '../types/arrest.types'

export function useCreateArrest(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('arrests')

  return useMutation({
    mutationFn: (payload: CreateArrestPayload) => createArrest(caseId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: arrestKeys.caseArrests(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.arrests(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      addToast({ message: t('create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : t('create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
