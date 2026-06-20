import type {
  AuthSession,
  LoginCredentials,
  ResetPasswordPayload,
} from '@/shared/types/auth.types'

import { apiClient, getCookie, setCookie, deleteCookie } from '@/services/api/client'
import { authSessionSchema } from '@/features/auth/schemas/auth-session.schema'

type AuthRequestConfig = Parameters<typeof apiClient.post>[2] & {
  skipAuthRefresh?: boolean
  skipErrorToast?: boolean
}

function decodeJwt(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64Url = parts[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    let decoded = ''
    if (typeof window !== 'undefined') {
      decoded = window.atob(base64)
    } else {
      decoded = Buffer.from(base64, 'base64').toString('binary')
    }
    const jsonPayload = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

export async function login(
  credentials: LoginCredentials,
  rememberMe = false,
): Promise<AuthSession> {
  const config: AuthRequestConfig = {
    skipAuthRefresh: true,
    skipErrorToast: true,
  }
  const response = (await apiClient.post<any>(
    '/api/v1/auth/login',
    {
      national_id: credentials.nationalId,
      password: credentials.password,
    },
    config,
  )) as any

  const payload = decodeJwt(response.accessToken)
  const role = payload?.role || 'readonly'

  const maxAge = rememberMe ? 28800 : 3600
  console.log("response", response)
  setCookie('ccms_access_token', response.accessToken, 900)
  setCookie('ccms_refresh_token', response.refreshToken, 28800)
  setCookie('ccms_session', response.sessionId, maxAge)
  setCookie('ccms_role', role, maxAge)

  const sessionResponse = (await apiClient.get('/api/v1/auth/session')) as any
  return authSessionSchema.parse(sessionResponse) as AuthSession
}

export async function logout(): Promise<void> {
  const refreshToken = getCookie('ccms_refresh_token')
  try {
    await apiClient.post('/api/v1/auth/logout', { refresh_token: refreshToken })
  } finally {
    deleteCookie('ccms_access_token')
    deleteCookie('ccms_refresh_token')
    deleteCookie('ccms_session')
    deleteCookie('ccms_role')
  }
}

export async function refreshToken(): Promise<AuthSession> {
  const rToken = getCookie('ccms_refresh_token')
  const refreshResponse = (await apiClient.post<any>('/api/v1/auth/refresh', {
    refresh_token: rToken
  })) as any
  setCookie('ccms_access_token', refreshResponse.access_token, 900)
  const sessionResponse = (await apiClient.get('/api/v1/auth/session')) as any
  return authSessionSchema.parse(sessionResponse) as AuthSession
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const config: AuthRequestConfig = {
    skipAuthRefresh: true,
    skipErrorToast: true,
  }
  return apiClient.post('/api/v1/auth/forgot-password', { email }, config)
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<{ message: string }> {
  const config: AuthRequestConfig = {
    skipAuthRefresh: true,
    skipErrorToast: true,
  }
  return apiClient.post('/api/v1/auth/reset-password', payload, config)
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const response = (await apiClient.get<AuthSession>('/api/v1/auth/session')) as any
    return authSessionSchema.parse(response) as AuthSession
  } catch {
    return null
  }
}
