import { create } from 'zustand'

import type { OfficerProfile, OfficerRole } from '../types/auth.types'

interface AuthState {
  officer: OfficerProfile | null
  permissions: string[]
  role: OfficerRole | null
  sessionId: string | null
  lastActivity: number | null
  isAuthenticated: boolean
  setSession: (officer: OfficerProfile, permissions: string[], sessionId: string) => void
  clearSession: () => void
  updateLastActivity: () => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: OfficerRole) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  officer: null,
  permissions: [],
  role: null,
  sessionId: null,
  lastActivity: null,
  isAuthenticated: false,
  setSession: (officer, permissions, sessionId) =>
    set({
      officer,
      permissions,
      role: officer.role,
      sessionId,
      lastActivity: Date.now(),
      isAuthenticated: true,
    }),
  clearSession: () =>
    set({
      officer: null,
      permissions: [],
      role: null,
      sessionId: null,
      lastActivity: null,
      isAuthenticated: false,
    }),
  updateLastActivity: () => set({ lastActivity: Date.now() }),
  hasPermission: (permission) => get().permissions.includes(permission),
  hasRole: (role) => get().role === role,
}))
