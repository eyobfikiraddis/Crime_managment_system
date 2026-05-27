import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { deleteEvidence } from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useDeleteEvidence(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('evidence')

  return useMutation({
    mutationFn: (evidenceId: string) => deleteEvidence(evidenceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: evidenceKeys.caseEvidence(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      addToast({ message: t('delete.successMessage'), variant: 'success' })
    },
  })
}
