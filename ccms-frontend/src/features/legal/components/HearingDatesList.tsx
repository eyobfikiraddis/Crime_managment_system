'use client'

import { format, isFuture } from 'date-fns'
import { Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

import type { HearingDate } from '../types/legal.types'

interface HearingDatesListProps {
  hearingDates: HearingDate[]
}

export function HearingDatesList({ hearingDates }: HearingDatesListProps) {
  const t = useTranslations('legal')

  const sorted = [...hearingDates].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        {t('courtCase.card.noNextHearing')}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((hearing) => {
        const upcoming = isFuture(new Date(hearing.date))
        return (
          <div
            key={hearing.id}
            className={cn(
              'rounded-md border border-border bg-card p-3',
              upcoming ? 'border-l-4 border-l-primary' : undefined,
            )}
          >
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 size-4 text-foreground-muted" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {t(`courtCase.hearingType.${hearing.type}`)}
                </p>
                <p className="text-sm text-foreground-muted">
                  {format(new Date(hearing.date), 'dd MMM yyyy')} — {hearing.location}
                </p>
                {hearing.notes ? (
                  <p className="text-xs text-foreground-muted">{hearing.notes}</p>
                ) : null}
                {hearing.outcome ? (
                  <p className="text-xs italic text-warning">{hearing.outcome}</p>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
