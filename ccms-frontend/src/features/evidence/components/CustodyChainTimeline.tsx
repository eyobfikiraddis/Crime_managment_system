'use client'

import { useMemo } from 'react'
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  FlaskConical,
  Gavel,
  Lock,
  PackagePlus,
  Trash2,
  Undo2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { cn } from '@/lib/utils'
import type { CustodyChain, CustodyEventType } from '../types/evidence.types'
import { detectCustodyGaps } from '../utils/custody-gap'

const CUSTODY_EVENT_ICONS: Record<CustodyEventType, any> = {
  COLLECTED: PackagePlus,
  TRANSFERRED: ArrowRightLeft,
  EXAMINED: FlaskConical,
  STORED: Archive,
  PRESENTED_IN_COURT: Gavel,
  RETURNED: Undo2,
  DESTROYED: Trash2,
}

interface CustodyChainTimelineProps {
  custodyChain: CustodyChain
}

export function CustodyChainTimeline({ custodyChain }: CustodyChainTimelineProps) {
  const t = useTranslations('evidence')

  const gaps = custodyChain.gaps?.length > 0 ? custodyChain.gaps : detectCustodyGaps(custodyChain.events)

  const gapByEvent = useMemo(() => {
    return gaps.reduce<Record<string, number>>((acc, gap) => {
      acc[gap.afterEventId] = gap.gapHours
      return acc
    }, {})
  }, [gaps])

  const isIntact = gaps.length === 0 && custodyChain.isIntact

  if (custodyChain.events.length === 0) {
    return <EmptyState title={t('custody.empty')} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {isIntact ? (
          <Badge variant="secondary" className="bg-success/10 text-success">
            <CheckCircle2 className="size-3" />
            {t('custody.intactBadge')}
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            <AlertTriangle className="size-3" />
            {t('custody.brokenBadge')}
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {custodyChain.events.map((event, index) => {
          const Icon = CUSTODY_EVENT_ICONS[event.eventType] ?? PackagePlus
          const gapHours = gapByEvent[event.id]
          const gapDetected = typeof gapHours === 'number'
          const isLast = index === custodyChain.events.length - 1

          return (
            <div key={event.id} className="relative pl-8">
              <div className="absolute left-2 top-3 flex h-full flex-col items-center">
                <span className="size-3 rounded-full border-2 border-border bg-card" />
                {!isLast ? (
                  <span
                    className={cn(
                      'mt-1 flex-1 border-l-2',
                      gapDetected ? 'border-warning border-dashed' : 'border-border',
                    )}
                  />
                ) : null}
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-muted/30">
                      <Icon className="size-4 text-foreground" aria-hidden="true" />
                    </span>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">
                          {t(`custody.eventTypes.${event.eventType}`)}
                        </span>
                        <span className="text-xs font-mono text-foreground-muted">
                          {new Date(event.timestamp).toISOString()}
                        </span>
                      </div>
                      <div className="text-xs text-foreground-muted flex flex-wrap items-center gap-2">
                        <span className="text-foreground-muted">
                          {t('custody.from')}: {event.fromOfficer
                            ? `${event.fromOfficer.firstName} ${event.fromOfficer.lastName} (${event.fromOfficer.badgeNumber})`
                            : '—'}
                        </span>
                        <ArrowRight className="size-3 text-foreground-muted" />
                        <span className="text-foreground">
                          {t('custody.to')}: {`${event.toOfficer.firstName} ${event.toOfficer.lastName} (${event.toOfficer.badgeNumber})`}
                        </span>
                      </div>
                      {event.location ? (
                        <div className="text-xs text-foreground-muted">
                          {t('custody.location')}: {event.location}
                        </div>
                      ) : null}
                      {event.reason ? (
                        <div className="text-xs text-foreground-muted">
                          {t('custody.reason')}: {event.reason}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center text-foreground-muted">
                          <Lock className="size-3" aria-hidden="true" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{t('custody.immutableTooltip')}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {gapDetected && !isLast ? (
                <div className="ml-4 mt-2 flex items-center gap-2 text-xs text-warning">
                  <AlertTriangle className="size-3" />
                  <span>{t('custody.gapWarning', { hours: gapHours })}</span>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
