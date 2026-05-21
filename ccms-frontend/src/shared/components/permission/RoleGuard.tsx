'use client'

import type { ReactNode } from 'react'

import type { OfficerRole } from '@/shared/types/auth.types'
import { useAuthStore } from '@/shared/stores/auth.store'

interface RoleGuardProps {
  roles: OfficerRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const role = useAuthStore((state) => state.role)
  const allowed = role ? roles.includes(role) : false

  if (!allowed) {
    return fallback ?? null
  }

  return children
}
