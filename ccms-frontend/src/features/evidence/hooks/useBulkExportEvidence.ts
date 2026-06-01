// src/features/evidence/hooks/useBulkExportEvidence.ts
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { bulkExportEvidence } from '@services/domain/evidence.service'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useBulkExportEvidence(caseId: string) {
  const { addToast } = useNotificationStore()
  const t = useTranslations('evidence')

  return useMutation({
    mutationFn: (ids: string[]) => bulkExportEvidence(caseId, ids),
    onSuccess: () => {
      addToast({ message: t('bulk.export.successMessage'), variant: 'success' })
    },
    onError: () => {
      addToast({ message: t('bulk.export.errorMessage'), variant: 'error' })
    },
  })
}
