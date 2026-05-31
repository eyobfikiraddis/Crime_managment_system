'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { User, UserX } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Department } from '../types/department.types'

interface DepartmentHeadCardProps {
  department: Department
  onAssignHead: () => void
  canManage: boolean
}

export function DepartmentHeadCard({
  department,
  onAssignHead,
  canManage,
}: DepartmentHeadCardProps) {
  const t = useTranslations('departments')
  const { headOfficer } = department

  if (!headOfficer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.headCard.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <div className="flex items-center justify-center size-12 rounded-full bg-muted text-muted-foreground mb-3">
            <UserX className="size-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            {t('detail.headCard.noHead')}
          </h4>
          <p className="text-xs text-foreground-muted max-w-sm mt-1 mb-4">
            {t('detail.headCard.noHeadDescription')}
          </p>
          {canManage ? (
            <Button variant="outline" size="sm" onClick={onAssignHead}>
              {t('detail.actions.assignHead')}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  const initials = `${headOfficer.firstName[0] || ''}${headOfficer.lastName[0] || ''}`.toUpperCase()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('detail.headCard.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-4 py-4">
        <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary font-semibold text-xl shrink-0">
          {initials || <User className="size-8" />}
        </div>
        <div className="space-y-1">
          <Link
            href={`/personnel/officers/${headOfficer.id}`}
            className="text-base font-semibold text-primary hover:underline"
          >
            {headOfficer.firstName} {headOfficer.lastName}
          </Link>
          <div className="grid grid-cols-[auto_1fr] gap-x-2 text-sm text-foreground-muted">
            <span className="font-medium text-foreground">{t('detail.headCard.badge')}:</span>
            <span>{headOfficer.badgeNumber}</span>

            <span className="font-medium text-foreground">{t('detail.headCard.email')}:</span>
            <span>{headOfficer.email}</span>

            <span className="font-medium text-foreground">{t('detail.headCard.phone')}:</span>
            <span>{headOfficer.phone || t('detail.headCard.noPhone')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
