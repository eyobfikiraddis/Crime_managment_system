import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateCharge } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { UpdateChargePayload } from '../types/legal.types'

export function useUpdateCharge(
  chargeId: string,
  courtCaseId: string,
  caseId: string,
) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: (payload: UpdateChargePayload) =>
      updateCharge(chargeId, payload),
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
      addToast({ message: t('charges.update.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('charges.update.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
