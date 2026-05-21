'use client'

import type { ReactNode } from 'react'

import { useQuery } from '@tanstack/react-query'

import { caseKeys } from '@/services/query/keys/caseKeys'
import { ForbiddenState } from '@/shared/components/feedback/ForbiddenState'
import { Skeleton } from '@/shared/components/feedback/Skeleton'

interface CaseAccessGuardProps {
  caseId: string
  requiredLevel: 'read' | 'write' | 'admin'
  children: ReactNode
  fallback?: ReactNode
}

const ACCESS_RANK = {
  read: 1,
  write: 2,
  admin: 3,
} as const

export function CaseAccessGuard({
  caseId,
  requiredLevel,
  children,
  fallback,
}: CaseAccessGuardProps) {
  const { data, isLoading } = useQuery({
    queryKey: caseKeys.permissions(caseId),
    queryFn: async () => ({ level: 'read' as const }),
  })

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />
  }

  const accessLevel = data?.level ?? 'read'
  const allowed = ACCESS_RANK[accessLevel] >= ACCESS_RANK[requiredLevel]

  if (!allowed) {
    return fallback ?? <ForbiddenState />
  }

  return children
}
