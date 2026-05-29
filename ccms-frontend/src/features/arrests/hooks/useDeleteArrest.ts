import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { deleteArrest } from '@services/domain/arrests.service'
import { arrestKeys } from '@services/query/keys/arrestKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'

export function useDeleteArrest(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('arrests')

  return useMutation({
    mutationFn: (arrestId: string) => deleteArrest(arrestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: arrestKeys.caseArrests(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.arrests(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      addToast({ message: t('delete.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : t('delete.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
