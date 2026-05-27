import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createCase } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateCasePayload } from '../types/case.types'

export function useCreateCase() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { addToast } = useNotificationStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (payload: CreateCasePayload) => createCase(payload),
    onSuccess: (newCase) => {
      // Invalidate the cases list so it refreshes on next visit
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      // Pre-populate the detail cache so the detail page loads instantly
      queryClient.setQueryData(caseKeys.detail(newCase.id), newCase)
      addToast({ message: t('create.successMessage', { caseNumber: newCase.caseNumber }), variant: 'success' })
      router.push(`/cases/${newCase.id}`)
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.isValidationError()) {
        // Field errors handled by the form via setError — no toast needed
        return
      }
      addToast({ message: t('create.errorMessage'), variant: 'error' })
    },
  })
}
