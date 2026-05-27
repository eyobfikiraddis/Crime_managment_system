import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { recordCustodyEvent } from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import type { RecordCustodyEventPayload } from '../types/evidence.types'

export function useRecordCustodyEvent(evidenceId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('evidence')

  return useMutation({
    mutationFn: (payload: RecordCustodyEventPayload) =>
      recordCustodyEvent(evidenceId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(evidenceKeys.detail(evidenceId), updated)
      void queryClient.invalidateQueries({ queryKey: evidenceKeys.custodyChain(evidenceId) })
      addToast({ message: t('custody.eventRecordedMessage'), variant: 'success' })
    },
  })
}
