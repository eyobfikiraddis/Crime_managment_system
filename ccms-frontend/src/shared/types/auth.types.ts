import { OfficerRole as OfficerRoleValues } from '../constants/roles'

export const OfficerRole = OfficerRoleValues
export type OfficerRole = (typeof OfficerRoleValues)[keyof typeof OfficerRoleValues]

export interface OfficerProfile {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  email: string
  role: OfficerRole
  departmentId: string
  permissions: string[]
  isActive: boolean
  lastLoginAt: string | null
}

export interface AuthSession {
  officer: OfficerProfile
  sessionId: string
  expiresAt: string
}

export interface LoginCredentials {
  nationalId: string
  password: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
  confirmPassword: string
}
