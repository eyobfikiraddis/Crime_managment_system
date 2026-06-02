// src/features/cases/hooks/useBulkUpdateCaseStatus.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { bulkUpdateCaseStatus } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import type { CaseStatus } from '../types/case.types'

export function useBulkUpdateCaseStatus() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (payload: { caseIds: string[]; status: CaseStatus; reason?: string }) =>
      bulkUpdateCaseStatus(payload),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      if (result.failed > 0) {
        addToast({
          message: t('bulk.statusUpdate.partialSuccessMessage', {
            updated: result.updated,
            failed: result.failed,
          }),
          variant: 'warning',
        })
      } else {
        addToast({
          message: t('bulk.statusUpdate.successMessage', { count: result.updated }),
          variant: 'success',
        })
      }
    },
    onError: () => {
      addToast({ message: t('bulk.statusUpdate.errorMessage'), variant: 'error' })
    },
  })
}
