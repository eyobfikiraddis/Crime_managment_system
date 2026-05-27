import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { addCaseNote } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useAddCaseNote(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (content: string) => addCaseNote(caseId, content),
    onSuccess: () => {
      // Immediately invalidate timeline — the new note must appear at once
      void queryClient.invalidateQueries({ queryKey: caseKeys.timeline(caseId) })
    },
    onError: () => {
      addToast({ message: t('timeline.noteError'), variant: 'error' })
    },
  })
}
