import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createInterrogation } from '@services/domain/interrogations.service'
import { interrogationKeys } from '@services/query/keys/interrogationKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateInterrogationPayload } from '../types/interrogation.types'

export function useCreateInterrogation(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('interrogations')

  return useMutation({
    mutationFn: (payload: CreateInterrogationPayload) =>
      createInterrogation(caseId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: interrogationKeys.caseInterrogations(caseId),
      })
      void queryClient.invalidateQueries({ queryKey: caseKeys.interrogations(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      addToast({ message: t('create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : t('create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
