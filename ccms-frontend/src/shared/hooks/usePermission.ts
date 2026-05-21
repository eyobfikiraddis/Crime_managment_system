'use client'

import { useAuthStore } from '../stores/auth.store'
import { hasPermission, hasMinRole, hasRole } from '../permissions'
import type { OfficerRole } from '../types/auth.types'

export function usePermission() {
  const permissions = useAuthStore((state) => state.permissions)
  const role = useAuthStore((state) => state.role)

  return {
    hasPermission: (permission: string) => hasPermission(permissions, permission),
    hasRole: (requiredRole: OfficerRole) => (role ? hasRole(role, requiredRole) : false),
    hasMinRole: (minimumRole: OfficerRole) =>
      role ? hasMinRole(role, minimumRole) : false,
  }
}
