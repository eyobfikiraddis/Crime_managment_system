import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

import { env } from '@/config/env'
import { defaultLocale, locales, type Locale } from '@/config/i18n'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useNotificationStore } from '@/shared/stores/notification.store'

import { ApiError } from './errors'
import errorsEn from '../../../messages/en/errors.json'
import errorsAm from '../../../messages/am/errors.json'

type RetryRequestConfig = AxiosRequestConfig & { _retry?: boolean }

type QueueItem = {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}

const errorMessagesByLocale: Record<Locale, typeof errorsEn> = {
  en: errorsEn,
  am: errorsAm,
}

const getLocaleFromCookie = () => {
  if (typeof document === 'undefined') return defaultLocale
  const match = document.cookie.match(/(?:^|; )ccms_locale=([^;]*)/)
  const value = match ? decodeURIComponent(match[1]) : null
  if (value && locales.includes(value as Locale)) {
    return value as Locale
  }
  return defaultLocale
}

const getErrorMessage = (path: string, fallback: string) => {
  const locale = getLocaleFromCookie()
  const messages = errorMessagesByLocale[locale]
  return (
    path.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object' && key in acc) {
        return (acc as Record<string, unknown>)[key]
      }
      return null
    }, messages) || fallback
  ) as string
}

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
  const method = (config.method ?? 'get').toLowerCase()
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    config.headers['X-Requested-With'] = 'XMLHttpRequest'
  }
  return config
})

let isRefreshing = false
let failedQueue: QueueItem[] = []

const processQueue = (error?: unknown) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
      return
    }
    promise.resolve(null)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const apiError = ApiError.fromAxiosError(error)
    const statusCode = apiError.statusCode
    const notify = useNotificationStore.getState().addToast

    if (!error.response) {
      notify({
        message: getErrorMessage('api.network', apiError.message),
        variant: 'error',
      })
      throw apiError
    }

    if (statusCode === 401) {
      const originalRequest = error.config as RetryRequestConfig | undefined

      if (!originalRequest) {
        throw apiError
      }

      if (originalRequest._retry) {
        throw apiError
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => apiClient(originalRequest))
          .catch((queueError) => {
            throw queueError
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await refreshClient.post('/api/v1/auth/refresh')
        processQueue()
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        useAuthStore.getState().clearSession()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw apiError
      } finally {
        isRefreshing = false
      }
    }

    if (statusCode === 403) {
      notify({
        message: getErrorMessage('api.forbidden', apiError.message),
        variant: 'error',
      })
    }

    if (statusCode === 429) {
      notify({
        message: getErrorMessage('api.rateLimited', apiError.message),
        variant: 'warning',
      })
    }

    throw apiError
  },
)

export { apiClient }
export default apiClient
