'use client'

import type { ReactNode } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { caseKeys } from '@/services/query/keys/caseKeys'
import { ForbiddenState } from '@/shared/components/feedback/ForbiddenState'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { Button } from '@/components/ui/button'

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
  const tErrors = useTranslations('errors')

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
    const action = (
      <Button asChild variant="outline">
        <Link href="/dashboard">{tErrors('pages.403.action')}</Link>
      </Button>
    )

    return (
      fallback ?? (
        <ForbiddenState
          title={tErrors('pages.403.title')}
          description={tErrors('pages.403.description')}
          action={action}
        />
      )
    )
  }

  return children
}
