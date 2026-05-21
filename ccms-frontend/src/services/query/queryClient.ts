import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '../api/errors'
import { useNotificationStore } from '@/shared/stores/notification.store'

const createDefaultOptions = () => ({
  queries: {
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount: number, error: unknown) => {
      if (error instanceof ApiError) {
        if ([401, 403, 404].includes(error.statusCode)) {
          return false
        }
      }

      return failureCount < 2
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },
  mutations: {
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        useNotificationStore.getState().addToast({
          message: error.message,
          variant: 'error',
        })
      }
    },
  },
})

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: createDefaultOptions(),
  })

export const queryClient = createQueryClient()
