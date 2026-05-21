import type { AuthSession, LoginCredentials, ResetPasswordPayload } from '@/shared/types/auth.types'

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  void credentials
  throw new Error('Not yet implemented')
}

export async function logout(): Promise<void> {
  throw new Error('Not yet implemented')
}

export async function refreshToken(): Promise<AuthSession> {
  throw new Error('Not yet implemented')
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  void email
  throw new Error('Not yet implemented')
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<{ message: string }> {
  void payload
  throw new Error('Not yet implemented')
}

export async function getSession(): Promise<AuthSession | null> {
  throw new Error('Not yet implemented')
}
