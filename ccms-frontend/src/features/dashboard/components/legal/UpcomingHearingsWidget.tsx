'use client'

import { Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import type { UpcomingHearingItem } from '../../types/dashboard.types'

interface UpcomingHearingsWidgetProps {
  hearings?: UpcomingHearingItem[] | undefined
  isLoading: boolean
}

export function UpcomingHearingsWidget({ hearings = [], isLoading }: UpcomingHearingsWidgetProps) {
  const t = useTranslations('dashboard')

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">{t('legal.hearingsWidget.title')}</h3>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          {t('legal.hearingsWidget.title')}
        </h3>
        <Link
          href="/reports/legal"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          {t('legal.hearingsWidget.viewAll')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {hearings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-foreground-muted">
          {t('legal.hearingsWidget.empty')}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border/40 max-h-[360px] overflow-y-auto pr-1">
          {hearings.map((item, idx) => {
            const d = new Date(item.hearingDate)
            return (
              <div key={idx} className="flex flex-col py-3 first:pt-0 last:pb-0 gap-1">
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/cases/${item.courtCaseId}`}
                    className="text-xs font-semibold text-primary hover:underline truncate"
                  >
                    {item.caseNumber} — {item.caseTitle}
                  </Link>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-foreground-muted">
                  <span>
                    <strong className="text-foreground">Court:</strong> {item.courtName}
                  </span>
                  <span>
                    <strong className="text-foreground">Date:</strong> {isNaN(d.getTime()) ? '—' : format(d, 'dd MMM yyyy HH:mm')}
                  </span>
                  <span>
                    <strong className="text-foreground">Type:</strong> {item.hearingType}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
