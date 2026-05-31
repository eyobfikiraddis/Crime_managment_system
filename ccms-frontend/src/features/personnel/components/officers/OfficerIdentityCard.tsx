'use client'

import { useTranslations } from 'next-intl'
import { format, formatDistanceToNow } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { useAuthStore } from '@/shared/stores/auth.store'
import { Permission } from '@/shared/constants/permissions'
import { OFFICER_ROLE_VARIANTS, OFFICER_STATUS_VARIANTS } from '@features/personnel/utils/personnelUtils'
import type { Officer } from '@features/personnel/types/personnel.types'

interface OfficerIdentityCardProps {
  officer: Officer
}

export function OfficerIdentityCard({ officer }: OfficerIdentityCardProps) {
  const t = useTranslations('personnel')
  const permissions = useAuthStore((state) => state.permissions)
  const isManage = permissions.includes(Permission.PERSONNEL_MANAGE)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {t('officers.detail.identityCard.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Column 1 */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('officers.detail.identityCard.badgeNumber')}
              </p>
              <p className="text-sm font-mono font-medium text-foreground">{officer.badgeNumber}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('officers.detail.identityCard.firstName')}
              </p>
              <p className="text-sm font-medium text-foreground">{officer.firstName}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('officers.detail.identityCard.lastName')}
              </p>
              <p className="text-sm font-medium text-foreground">{officer.lastName}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('officers.detail.identityCard.email')}
              </p>
              <p className="text-sm font-medium text-foreground">{officer.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('officers.detail.identityCard.activeCases')}
              </p>
              <p className="text-sm font-medium text-foreground">{officer.activeCaseCount}</p>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('officers.detail.identityCard.status')}
              </p>
              <div>
                <StatusBadge
                  status={t(`officers.officerStatus.${officer.status}`)}
                  variant={OFFICER_STATUS_VARIANTS[officer.status]}
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('officers.detail.identityCard.role')}
              </p>
              <div>
                <StatusBadge
                  status={t(`officers.officerRole.${officer.role}`)}
                  variant={OFFICER_ROLE_VARIANTS[officer.role]}
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('officers.detail.identityCard.department')}
              </p>
              <p className="text-sm font-medium text-foreground">{officer.departmentName}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('officers.detail.identityCard.phone')}
              </p>
              <p className="text-sm font-medium text-foreground">
                {officer.phone ?? (
                  <span className="text-foreground-muted italic">
                    {t('officers.detail.identityCard.noPhone')}
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('officers.detail.identityCard.totalCases')}
              </p>
              <p className="text-sm font-medium text-foreground">{officer.totalCaseCount}</p>
            </div>
          </div>
        </div>

        {/* Footnotes: Admin Scopes and Created Date */}
        <div className="mt-6 flex flex-wrap justify-between gap-4 border-t border-border pt-4 text-xs text-foreground-muted">
          <div>
            <span>{t('officers.detail.identityCard.createdAt')}: </span>
            <span className="font-medium text-foreground">
              {format(new Date(officer.createdAt), 'dd MMM yyyy HH:mm')}
            </span>
          </div>

          <div>
            <span>{t('officers.detail.identityCard.lastActivity')}: </span>
            {isManage ? (
              <span className="font-medium text-foreground">
                {officer.lastActivityAt
                  ? formatDistanceToNow(new Date(officer.lastActivityAt), { addSuffix: true })
                  : t('officers.detail.identityCard.lastActivityNever')}
              </span>
            ) : (
              <span className="text-foreground-muted">—</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
