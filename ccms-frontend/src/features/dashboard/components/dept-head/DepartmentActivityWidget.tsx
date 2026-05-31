'use client'

import { Activity } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '@/shared/stores/auth.store'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import type { DashboardActivityEntry } from '../../types/dashboard.types'

interface DepartmentActivityWidgetProps {
  activity?: DashboardActivityEntry[] | undefined
  isLoading: boolean
}

export function DepartmentActivityWidget({ activity = [], isLoading }: DepartmentActivityWidgetProps) {
  const t = useTranslations('dashboard')
  const { officer } = useAuthStore()

  const deptId = officer?.departmentId ?? ''
  const timelineUrl = deptId ? `/cases?departmentId=${deptId}` : '/cases'

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">{t('deptHead.activityWidget.title')}</h3>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t('deptHead.activityWidget.title')}
        </h3>
        <Link
          href={timelineUrl}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('deptHead.activityWidget.viewTimeline')}
        </Link>
      </div>

      {activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-foreground-muted">
          {t('deptHead.activityWidget.empty')}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border/40 max-h-[320px] overflow-y-auto pr-1">
          {activity.map((item, idx) => {
            const d = new Date(item.timestamp)
            return (
              <div key={idx} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary self-start">
                  <Activity className="h-3 w-3" />
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    <span className="font-semibold">{item.actorName}</span>{' '}
                    {item.action}
                  </p>
                  <span className="text-[10px] text-foreground-muted">
                    {isNaN(d.getTime()) ? '—' : formatDistanceToNow(d, { addSuffix: true })}
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
