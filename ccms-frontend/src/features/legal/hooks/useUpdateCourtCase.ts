import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateCourtCase } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { UpdateCourtCasePayload } from '../types/legal.types'

export function useUpdateCourtCase(courtCaseId: string, caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: (payload: UpdateCourtCasePayload) =>
      updateCourtCase(courtCaseId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCase(courtCaseId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseByCase(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseList(),
      })
      addToast({ message: t('courtCase.update.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('courtCase.update.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
