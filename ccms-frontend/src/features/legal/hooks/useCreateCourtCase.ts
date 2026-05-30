import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createCourtCase } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateCourtCasePayload } from '../types/legal.types'

export function useCreateCourtCase(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: (payload: CreateCourtCasePayload) =>
      createCourtCase(caseId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseByCase(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseList(),
      })
      void queryClient.invalidateQueries({
        queryKey: caseKeys.summary(caseId),
      })
      addToast({ message: t('courtCase.create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('courtCase.create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
