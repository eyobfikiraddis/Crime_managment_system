import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createPerson } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreatePersonPayload } from '../types/personnel.types'

export function useCreatePerson() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: (payload: CreatePersonPayload) => createPerson(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.personList() })
      addToast({ message: t('persons.create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('persons.create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
