import type {
  AuthSession,
  LoginCredentials,
  ResetPasswordPayload,
} from '@/shared/types/auth.types'

import { apiClient } from '@/services/api/client'
import { authSessionSchema } from '@/features/auth/schemas/auth-session.schema'

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await apiClient.post<AuthSession>('/api/v1/auth/login', credentials)
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
  return apiClient.post('/api/v1/auth/forgot-password', { email })
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<{ message: string }> {
  return apiClient.post('/api/v1/auth/reset-password', payload)
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const response = await apiClient.get<AuthSession>('/api/v1/auth/session')
    return authSessionSchema.parse(response)
  } catch {
    return null
  }
}
