import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateCharge } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ChargeStatus } from '../types/legal.types'

export function useDropCharge(
  chargeId: string,
  courtCaseId: string,
  caseId: string,
) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: () => updateCharge(chargeId, { status: ChargeStatus.DROPPED }),
    onSuccess: () => {
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
      addToast({ message: t('charges.drop.successMessage'), variant: 'success' })
    },
  })
}
