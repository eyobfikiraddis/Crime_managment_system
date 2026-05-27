import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { transitionCaseStatus } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { useUiStore } from '@shared/stores/ui.store'
import type { StatusTransitionPayload } from '../types/case.types'

export function useTransitionCaseStatus(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const { closeModal } = useUiStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (payload: StatusTransitionPayload) => transitionCaseStatus(caseId, payload),
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(caseKeys.detail(caseId), updatedCase)
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: caseKeys.timeline(caseId) })
      closeModal()
      addToast({ message: t('status.transitionSuccess'), variant: 'success' })
    },
  })
}
