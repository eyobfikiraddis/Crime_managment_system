import type {
  AuthSession,
  LoginCredentials,
  ResetPasswordPayload,
} from '@/shared/types/auth.types'

import { apiClient } from '@/services/api/client'
import { authSessionSchema } from '@/features/auth/schemas/auth-session.schema'

type AuthRequestConfig = Parameters<typeof apiClient.post>[2] & {
  skipAuthRefresh?: boolean
  skipErrorToast?: boolean
}

export async function login(
  credentials: LoginCredentials,
  rememberMe = false,
): Promise<AuthSession> {
  const config: AuthRequestConfig = {
    skipAuthRefresh: true,
    skipErrorToast: true,
  }
//   if (credentials.rememberMe) {
//   config.headers = { 'X-Remember-Me': 'true' };
// }
  const response = await apiClient.post<AuthSession>('/api/v1/auth/login', credentials, config)
  return authSessionSchema.parse(response)
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/v1/auth/logout')
}

export async function refreshToken(): Promise<AuthSession> {
  const response = await apiClient.post<AuthSession>('/api/v1/auth/refresh')
  return authSessionSchema.parse(response)
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
    const response = await apiClient.get<AuthSession>('/api/v1/auth/session')
    return authSessionSchema.parse(response)
  } catch {
    return null
  }
}
