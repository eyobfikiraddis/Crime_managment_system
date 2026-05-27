import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { deleteCase } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useDeleteCase() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { addToast } = useNotificationStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (caseId: string) => deleteCase(caseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      addToast({ message: t('delete.successMessage'), variant: 'success' })
      router.push('/cases')
    },
  })
}
