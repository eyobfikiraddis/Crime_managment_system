import type {
  AuthSession,
  LoginCredentials,
  ResetPasswordPayload,
} from '@/shared/types/auth.types'

import { apiClient } from '@/services/api/client'

async function tryGetProfileCandidates() {
  const candidates = ['/api/v1/auth/session', '/api/v1/auth/me', '/api/v1/personnel/me']

  for (const path of candidates) {
    try {
      const res = await apiClient.get(path)
      if (res && typeof res === 'object') return res
    } catch (err) {
      // ignore and try next
    }
  }

  return null
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  // Backend expects `national_id` as the identifier
  const payload = {
    national_id: credentials.badgeNumber,
    password: credentials.password,
  }

  const resp = await apiClient.post('/api/v1/auth/login', payload)

  // after login, try to fetch a profile/session record
  const session = await getSession()
  if (!session) {
    throw new Error('Login succeeded but failed to retrieve session/profile')
  }

  return session
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/v1/auth/logout')
  } catch (err) {
    // swallow — ensure client clears local session anyway
  }
}

export async function refreshToken(): Promise<AuthSession> {
  await apiClient.post('/api/v1/auth/refresh')
  const session = await getSession()
  if (!session) throw new Error('Failed to refresh session')
  return session
}

export async function forgotPassword(nationalId: string): Promise<{ message: string }> {
  const res = await apiClient.post('/api/v1/auth/password-reset-request', {
    national_id: nationalId,
  })
  return (res as any) as { message: string }
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<{ message: string }> {
  const res = await apiClient.post('/api/v1/auth/password-reset-confirm', {
    token: payload.token,
    new_password: payload.password,
  })
  return (res as any) as { message: string }
}

export async function getSession(): Promise<AuthSession | null> {
  const profile = (await tryGetProfileCandidates()) as any
  if (!profile) return null

  // Best-effort map to AuthSession shape. If backend returns a session-like
  // object, normalize it. Otherwise, try common fields.
  const sessionId = profile.session_id ?? profile.sessionId ?? null
  const officer = profile.officer ?? profile.user ?? profile.current_user ?? profile

  if (!officer || !sessionId) {
    // If the response doesn't include a session id, try to call a lightweight
    // session info endpoint and tolerate missing fields.
    return null
  }

  return {
    officer,
    sessionId,
    expiresAt: profile.expires_at ?? profile.expiresAt ?? new Date().toISOString(),
  }
}
