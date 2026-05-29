import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateArrest } from '@services/domain/arrests.service'
import { arrestKeys } from '@services/query/keys/arrestKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { UpdateArrestPayload } from '../types/arrest.types'

export function useUpdateArrest(arrestId: string, caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('arrests')

  return useMutation({
    mutationFn: (payload: UpdateArrestPayload) => updateArrest(arrestId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: arrestKeys.detail(arrestId) })
      void queryClient.invalidateQueries({ queryKey: arrestKeys.caseArrests(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.arrests(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      addToast({ message: t('update.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : t('update.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
