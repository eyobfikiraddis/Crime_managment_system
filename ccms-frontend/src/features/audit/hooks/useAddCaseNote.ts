import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { addCaseNote } from '@services/domain/audit.service'
import { auditKeys } from '@services/query/keys/auditKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { AddCaseNotePayload } from '../types/audit.types'

export function useAddCaseNote(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('audit')

  return useMutation({
    mutationFn: (payload: AddCaseNotePayload) => addCaseNote(caseId, payload),
    onSuccess: () => {
      // Invalidate the case timeline so the new note appears immediately.
      void queryClient.invalidateQueries({
        queryKey: auditKeys.caseTimeline(caseId),
      })
      addToast({ message: t('note.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('note.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
