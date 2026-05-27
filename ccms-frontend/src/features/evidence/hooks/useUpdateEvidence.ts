import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateEvidence } from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import type { Evidence, UploadEvidencePayload } from '../types/evidence.types'

export function useUpdateEvidence(evidenceId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('evidence')

  return useMutation({
    mutationFn: (payload: Partial<UploadEvidencePayload>) => updateEvidence(evidenceId, payload),
    onSuccess: (updated: Evidence) => {
      queryClient.setQueryData(evidenceKeys.detail(evidenceId), updated)
      void queryClient.invalidateQueries({ queryKey: evidenceKeys.caseEvidence(updated.caseId) })
      addToast({ message: t('update.successMessage'), variant: 'success' })
    },
  })
}
