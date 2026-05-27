import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateCase } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import type { Case, CreateCasePayload } from '../types/case.types'

export function useUpdateCase(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (payload: Partial<CreateCasePayload>) => updateCase(caseId, payload),
    onSuccess: (updatedCase: Case) => {
      queryClient.setQueryData(caseKeys.detail(caseId), updatedCase)
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      addToast({ message: t('update.successMessage'), variant: 'success' })
    },
  })
}
