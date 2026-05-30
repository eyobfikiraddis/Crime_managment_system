import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { recordSentence } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { RecordSentencePayload } from '../types/legal.types'

export function useRecordSentence(
  chargeId: string,
  courtCaseId: string,
  caseId: string,
) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: (payload: RecordSentencePayload) =>
      recordSentence(chargeId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: legalKeys.chargeDetail(chargeId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.chargeList(courtCaseId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseByCase(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: caseKeys.summary(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: caseKeys.charges(caseId),
      })
      addToast({ message: t('charges.sentence.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('charges.sentence.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
