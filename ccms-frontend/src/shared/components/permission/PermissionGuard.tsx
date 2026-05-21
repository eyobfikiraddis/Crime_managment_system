'use client'

import type { ReactNode } from 'react'

import { hasAllPermissions } from '@/shared/permissions'
import { useAuthStore } from '@/shared/stores/auth.store'

interface PermissionGuardProps {
  permission: string | string[]
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const permissions = useAuthStore((state) => state.permissions)
  const required = Array.isArray(permission) ? permission : [permission]
  const allowed = hasAllPermissions(permissions, required)

  if (!allowed) {
    return fallback ?? null
  }

  return children
}
