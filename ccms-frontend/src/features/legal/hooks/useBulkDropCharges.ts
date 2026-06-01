// src/features/legal/hooks/useBulkDropCharges.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { bulkDropCharges } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useBulkDropCharges(courtCaseId: string, caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: (chargeIds: string[]) => bulkDropCharges({ chargeIds }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: legalKeys.chargeList(courtCaseId) })
      void queryClient.invalidateQueries({ queryKey: legalKeys.courtCaseByCase(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      if (result.failed > 0) {
        addToast({
          message: t('charges.bulkDrop.partialSuccessMessage', {
            updated: result.updated,
            failed: result.failed,
          }),
          variant: 'warning',
        })
      } else {
        addToast({
          message: t('charges.bulkDrop.successMessage', { count: result.updated }),
          variant: 'success',
        })
      }
    },
    onError: () => {
      addToast({ message: t('charges.bulkDrop.errorMessage'), variant: 'error' })
    },
  })
}
export default useBulkDropCharges
