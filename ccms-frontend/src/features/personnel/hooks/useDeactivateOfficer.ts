import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { deactivateOfficer } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useDeactivateOfficer(officerId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: () => deactivateOfficer(officerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.officer(officerId) })
      void queryClient.invalidateQueries({ queryKey: personnelKeys.officerList() })
      addToast({ message: t('officers.deactivate.successMessage'), variant: 'success' })
    },
  })
}
