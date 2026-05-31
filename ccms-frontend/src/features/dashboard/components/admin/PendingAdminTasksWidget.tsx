'use client'

import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import type { AdminPendingTasks } from '../../types/dashboard.types'

interface PendingAdminTasksWidgetProps {
  pendingTasks?: AdminPendingTasks | undefined
  isLoading: boolean
}

export function PendingAdminTasksWidget({ pendingTasks, isLoading }: PendingAdminTasksWidgetProps) {
  const t = useTranslations('dashboard')

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">{t('admin.pendingTasksWidget.title')}</h3>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const { officersAwaitingActivationCount = 0, departmentsWithoutHeadCount = 0 } = pendingTasks ?? {}
  const hasTasks = officersAwaitingActivationCount > 0 || departmentsWithoutHeadCount > 0

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t('admin.pendingTasksWidget.title')}
      </h3>

      {!hasTasks ? (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-success/20 bg-success/5 text-success">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-xs font-medium">
            {t('admin.pendingTasksWidget.allClear')}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {officersAwaitingActivationCount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card-hover/20">
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground">
                    {officersAwaitingActivationCount}
                  </span>
                  <span className="text-xs text-foreground-muted truncate">
                    {t('admin.pendingTasksWidget.officersAwaitingActivation')}
                  </span>
                </div>
              </div>
              <Link
                href="/personnel"
                className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline ml-4 flex-shrink-0"
              >
                {t('admin.pendingTasksWidget.viewOfficers')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {departmentsWithoutHeadCount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card-hover/20">
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground">
                    {departmentsWithoutHeadCount}
                  </span>
                  <span className="text-xs text-foreground-muted truncate">
                    {t('admin.pendingTasksWidget.departmentsWithoutHead')}
                  </span>
                </div>
              </div>
              <Link
                href="/departments"
                className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline ml-4 flex-shrink-0"
              >
                {t('admin.pendingTasksWidget.viewDepartments')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
