import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { resetOfficerPassword } from '@services/domain/personnel.service'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'

export function useResetOfficerPassword(officerId: string) {
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: () => resetOfficerPassword(officerId),
    onSuccess: () => {
      addToast({ message: t('officers.resetPassword.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('officers.resetPassword.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
