'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Department } from '../types/department.types'

interface DepartmentMetadataCardProps {
  department: Department
}

export function DepartmentMetadataCard({ department }: DepartmentMetadataCardProps) {
  const t = useTranslations('departments')

  const formattedCreatedAt = useMemoDate(department.createdAt)
  const formattedUpdatedAt = useMemoDate(department.updatedAt)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('detail.metadataCard.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              {t('detail.metadataCard.name')}
            </span>
            <p className="text-sm font-medium text-foreground">{department.name}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              {t('detail.metadataCard.code')}
            </span>
            <p className="text-sm font-medium text-foreground">
              {department.code || <span className="text-foreground-muted italic">{t('detail.metadataCard.noCode')}</span>}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              {t('detail.metadataCard.location')}
            </span>
            <p className="text-sm font-medium text-foreground">
              {department.location ? (
                department.location.region
                  ? `${department.location.name}, ${department.location.region}`
                  : department.location.name
              ) : (
                <span className="text-foreground-muted italic">{t('detail.metadataCard.noLocation')}</span>
              )}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              {t('detail.metadataCard.officerCount')}
            </span>
            <p className="text-sm font-medium text-foreground">{department.officerCount}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              {t('detail.metadataCard.activeCaseCount')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{department.activeCaseCount}</span>
              <Link
                href={`/cases?departmentId=${department.id}`}
                className="text-xs text-primary hover:underline"
              >
                {t('detail.metadataCard.activeCasesLink')}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-1">
          <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
            {t('detail.metadataCard.description')}
          </span>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {department.description || <span className="text-foreground-muted italic">{t('detail.metadataCard.noDescription')}</span>}
          </p>
        </div>

        <div className="border-t border-border pt-4 grid grid-cols-2 gap-4 text-xs text-foreground-muted">
          <div>
            <span>{t('detail.metadataCard.createdAt')}: </span>
            <span className="font-medium text-foreground">{formattedCreatedAt}</span>
          </div>
          <div>
            <span>{t('detail.metadataCard.updatedAt')}: </span>
            <span className="font-medium text-foreground">{formattedUpdatedAt}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function useMemoDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}
