import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

import { env } from '@/config/env'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useNotificationStore } from '@/shared/stores/notification.store'

import { ApiError } from './errors'

type RetryRequestConfig = AxiosRequestConfig & { _retry?: boolean }

const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

const refreshClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers ?? {}
  config.headers['X-Request-ID'] = createRequestId()
  return config
})

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const apiError = ApiError.fromAxiosError(error)
    const statusCode = apiError.statusCode
    const notify = useNotificationStore.getState().addToast

    if (!error.response) {
      notify({
        message: 'Network error. Please check your connection.',
        variant: 'error',
      })
      throw apiError
    }

    if (statusCode === 401) {
      const originalRequest = error.config as RetryRequestConfig | undefined

      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          await refreshClient.post('/api/v1/auth/refresh')
          return apiClient(originalRequest)
        } catch {
          useAuthStore.getState().clearSession()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      }
    }

    if (statusCode === 403) {
      notify({
        message: 'You do not have permission to perform this action.',
        variant: 'error',
      })
    }

    if (statusCode === 429) {
      notify({
        message: 'Too many requests. Please slow down and try again.',
        variant: 'warning',
      })
    }

    throw apiError
  },
)

export { apiClient }
export default apiClient
