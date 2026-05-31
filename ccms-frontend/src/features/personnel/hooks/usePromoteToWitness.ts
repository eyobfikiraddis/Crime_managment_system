import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { promoteToWitness } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { PromoteToWitnessPayload } from '../types/personnel.types'

export function usePromoteToWitness(personId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: (payload: PromoteToWitnessPayload) =>
      promoteToWitness(personId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.person(personId) })
      void queryClient.invalidateQueries({ queryKey: personnelKeys.personList() })
      addToast({
        message: t('persons.promoteToWitness.successMessage'),
        variant: 'success',
      })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('persons.promoteToWitness.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
