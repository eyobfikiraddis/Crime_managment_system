// src/features/personnel/hooks/useDemotePersonRole.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { demotePersonRole } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { PersonRole } from '../types/personnel.types'

export function useDemotePersonRole(personId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: (role: PersonRole) => demotePersonRole(personId, role),
    onSuccess: (_, role) => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.person(personId) })
      void queryClient.invalidateQueries({ queryKey: personnelKeys.personList() })
      addToast({
        message: t('persons.demoteRole.successMessage', { roleName: t(`persons.roles.${role}`, { defaultValue: role }) }),
        variant: 'success',
      })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('persons.demoteRole.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
