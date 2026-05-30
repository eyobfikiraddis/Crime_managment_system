'use client'

import { format } from 'date-fns'
import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { Permission } from '@/shared/constants/permissions'

import type { CourtCase } from '../types/legal.types'
import { COURT_CASE_STATUS_VARIANTS } from '../utils/chargeUtils'
import { HearingDatesList } from './HearingDatesList'

interface CourtCaseCardProps {
  courtCase: CourtCase
  onEdit: () => void
}

export function CourtCaseCard({ courtCase, onEdit }: CourtCaseCardProps) {
  const t = useTranslations('legal')

  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle>{t('courtCase.sectionTitle')}</CardTitle>
        <CardAction>
          <PermissionGuard permission={Permission.LEGAL_MANAGE}>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              {t('courtCase.card.editButton')}
            </Button>
          </PermissionGuard>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-foreground-muted">
              {t('courtCase.card.caseNumber')}
            </p>
            <p className="text-sm font-mono text-foreground">
              {courtCase.courtCaseNumber}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-foreground-muted">
              {t('courtCase.card.status')}
            </p>
            <StatusBadge
              status={t(`courtCase.status.${courtCase.status}`)}
              variant={COURT_CASE_STATUS_VARIANTS[courtCase.status] ?? 'muted'}
              className="w-[120px] text-center"
            />
          </div>
          <div>
            <p className="text-xs uppercase text-foreground-muted">
              {t('courtCase.card.court')}
            </p>
            <p className="text-sm text-foreground">{courtCase.court}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-foreground-muted">
              {t('courtCase.card.outcome')}
            </p>
            <p className="text-sm text-foreground">
              {courtCase.outcome
                ? t(`courtCase.outcome.${courtCase.outcome}`)
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-foreground-muted">
              {t('courtCase.card.filedAt')}
            </p>
            <p className="text-sm text-foreground">
              {format(new Date(courtCase.filedAt), 'dd MMM yyyy')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-foreground-muted">
              {t('courtCase.card.nextHearing')}
            </p>
            <p className="text-sm text-foreground">
              {courtCase.nextHearingDate
                ? format(new Date(courtCase.nextHearingDate), 'dd MMM yyyy')
                : t('courtCase.card.noNextHearing')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-foreground-muted">
              {t('charges.sectionTitle')}
            </p>
            <p className="text-sm text-foreground">
              {t('courtCase.card.chargeCount', { count: courtCase.chargeCount })}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-foreground-muted">
              {t('courtCase.card.presidingJudge')}
            </p>
            <p className="text-sm text-foreground">
              {courtCase.presidingJudge || t('courtCase.card.noJudge')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-foreground-muted">
              {t('courtCase.card.prosecutor')}
            </p>
            <p className="text-sm text-foreground">
              {courtCase.prosecutor || t('courtCase.card.noProsecutor')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-foreground-muted">
              {t('courtCase.card.defenceCounsel')}
            </p>
            <p className="text-sm text-foreground">
              {courtCase.defenceCounsel || t('courtCase.card.noDefenceCounsel')}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">
            {t('courtCase.card.hearingsSectionTitle')}
          </p>
          <HearingDatesList hearingDates={courtCase.hearingDates} />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">{t('courtCase.card.notes')}</p>
          <p className="text-sm text-foreground-muted">
            {courtCase.notes || t('courtCase.card.noNotes')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
