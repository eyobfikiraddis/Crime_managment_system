'use client'

import { format } from 'date-fns'
import { Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { StatusBadge } from '@/shared/components/display/StatusBadge'

import type { InterrogationListItem, RoleOnCase } from '../types/interrogation.types'

type BadgeVariant = 'primary' | 'warning' | 'accent' | 'success' | 'muted' | 'destructive'

const ROLE_BADGE_VARIANTS: Record<RoleOnCase, BadgeVariant> = {
  SUSPECT: 'accent',
  VICTIM: 'muted',
  WITNESS: 'muted',
}

interface InterrogationDetailDrawerProps {
  interrogationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  records: InterrogationListItem[]
}

interface InterrogationRecord extends InterrogationListItem {
  legalRepresentativeName?: string | null
  summary?: string
  recordingReference?: string | null
}

function formatDuration(minutes: number, t: (key: string, values?: Record<string, any>) => string): string {
  if (minutes < 60) return t('tab.durationValue', { minutes })
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function InterrogationDetailDrawer({
  interrogationId,
  open,
  onOpenChange,
  records,
}: InterrogationDetailDrawerProps) {
  const t = useTranslations('interrogations')

  if (!open) return null

  const record = records.find((item) => item.id === interrogationId) as InterrogationRecord | undefined

  return (
    <SlideOverDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('detail.drawerTitle')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('create.cancelButton')}
          </Button>
        </div>
      }
    >
      {!record ? (
        <div className="text-sm text-foreground-muted">{t('tab.empty')}</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-foreground">{record.interrogationNumber}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
                    <Lock className="size-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('detail.immutableTooltip')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2 rounded-sm border border-border bg-[var(--color-card-hover)] px-3 py-2 text-xs text-foreground-muted">
            <Lock className="size-4" />
            <span>{t('detail.immutableNotice')}</span>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('detail.drawerTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.interrogationNumber')}</p>
                <p className="text-sm text-foreground">{record.interrogationNumber}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.subject')}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                  <span>{`${record.subject.firstName} ${record.subject.lastName}`}</span>
                  <StatusBadge
                    status={t(`roleOnCase.${record.subject.roleOnCase}`)}
                    variant={ROLE_BADGE_VARIANTS[record.subject.roleOnCase] ?? 'muted'}
                    className="w-auto px-2"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.conductingOfficer')}</p>
                <p className="text-sm text-foreground">{`${record.conductingOfficer.firstName} ${record.conductingOfficer.lastName} (${record.conductingOfficer.badgeNumber})`}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.interrogationDate')}</p>
                <p className="text-sm text-foreground">{format(new Date(record.interrogationDate), 'dd MMM yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.location')}</p>
                <p className="text-sm text-foreground">{record.location}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.duration')}</p>
                <p className="text-sm text-foreground">
                  {record.durationMinutes === null
                    ? t('detail.durationUnknown')
                    : formatDuration(record.durationMinutes, t)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('detail.legalRepSection')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('tab.columns.legalRep')}</p>
                <StatusBadge
                  status={record.legalRepresentativePresent ? t('detail.legalRepPresent') : t('detail.legalRepAbsent')}
                  variant={record.legalRepresentativePresent ? 'success' : 'muted'}
                  className="w-[100px] text-center"
                />
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.legalRepName')}</p>
                <p className="text-sm text-foreground">
                  {record.legalRepresentativePresent
                    ? record.legalRepresentativeName || t('detail.noLegalRepName')
                    : t('detail.noLegalRepName')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('detail.summarySection')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {record.summary ?? ''}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('detail.recordingReference')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">
                {record.recordingReference || t('detail.noRecordingReference')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </SlideOverDrawer>
  )
}
