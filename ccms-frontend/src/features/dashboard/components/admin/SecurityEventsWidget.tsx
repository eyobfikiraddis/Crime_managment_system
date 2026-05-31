'use client'

import { ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { cn } from '@/shared/utils/cn'
import type { SecurityEvent } from '../../types/dashboard.types'

interface SecurityEventsWidgetProps {
  securityEvents?: SecurityEvent[] | undefined
  isLoading: boolean
}

const SEVERITY_COLORS = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function SecurityEventsWidget({ securityEvents = [], isLoading }: SecurityEventsWidgetProps) {
  const t = useTranslations('dashboard')

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">{t('admin.securityWidget.title')}</h3>
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
          <ShieldAlert className="h-4 w-4 text-warning" />
          {t('admin.securityWidget.title')}
        </h3>
        <Link
          href="/admin/health"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          {t('admin.securityWidget.viewAll')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {securityEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2 text-foreground-muted">
          <ShieldCheck className="h-8 w-8 text-success" />
          <p className="text-xs">{t('admin.securityWidget.empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border/40 max-h-[300px] overflow-y-auto pr-1">
          {securityEvents.map((event) => {
            const d = new Date(event.timestamp)
            return (
              <div key={event.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-4">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {event.description}
                  </p>
                  <p className="text-[10px] text-foreground-muted">
                    {event.actorName} (<span className="font-mono">{event.actorBadgeNumber}</span>) • {event.type}
                  </p>
                  <span className="text-[9px] text-foreground-muted mt-0.5">
                    {isNaN(d.getTime()) ? '—' : formatDistanceToNow(d, { addSuffix: true })}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 self-center uppercase tracking-wide',
                    SEVERITY_COLORS[event.severity] ?? SEVERITY_COLORS.low
                  )}
                >
                  {t(`admin.securityWidget.severity.${event.severity}`)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
